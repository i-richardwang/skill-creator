# Evals config schema

Two JSON files per skill, both validated by `scripts/config.py`:

- `<skill>/evals.json` — functional eval cases + variants (consumed by `better-skills run/iterate`)
- `<skill>/triggers.json` — trigger eval queries (consumed by `better-skills trigger-eval/trigger-loop`)

Both default to `<skill>/<file>.json`. Legacy fallback: `<skill>/evals/<file>.json`.

Use `python -m scripts.cli init <skill-path>` to scaffold starter templates.

## evals.json

```jsonc
{
  "version": 2,
  "skill_name": "my-skill",                    // optional; defaults to skill dir name
  "default_model": "claude-opus-4-7",          // optional; CLI --model overrides

  "variants": [                                // each declared variant becomes
    {                                          // a directory under iteration-N/eval-X/
      "name": "with_skill",                    // user-chosen identifier
      "mount": "self"                          // self / none / snapshot / path
    },
    {
      "name": "without_skill",
      "mount": "none"
    },
    {
      "name": "old_skill",
      "mount": "snapshot"                      // uses <workspace>/skill-snapshot/
    },
    {
      "name": "experimental",
      "mount": "path",
      "path": "/abs/path/to/skill-v3"          // required when mount=path
    }
  ],

  "defaults": {
    "primary_variant": "with_skill",           // delta = primary - baseline
    "baseline_variant": "without_skill",       // null = no delta
    "runs_per_variant": 1,                     // replicate count per case×variant
    "timeout_s": 600,                          // per-run subprocess timeout
    "num_workers": 4,                          // parallel workers
    "env_pool": {},                            // optional, see "Per-run isolation" below
    "pre_run_script": null                     // optional, see "Per-run isolation" below
  },

  "cases": [
    {
      "id": 1,                                 // stable int; eval-<id>/ dir name
      "name": "make a chart",                  // optional human label
      "prompt": "Create a bar chart from ...", // inline OR prompt_file (XOR)
      "prompt_file": null,                     // path relative to skill dir
      "files": [                               // file paths mentioned in prompt
        "data.csv"                             // (must already exist; not materialized)
      ],
      "expectations": [                        // grader's pass/fail criteria
        "produces a chart with axis labels",
        "includes a title"
      ],
      "timeout_s": null                        // override defaults.timeout_s
    }
  ]
}
```

### Mount types

| Mount | Behavior |
|---|---|
| `self` | Mount the skill at `--skill-path` (the canonical "with skill" branch) |
| `none` | No skill mounted (bare baseline) |
| `snapshot` | Mount `<workspace>/skill-snapshot/`, auto-created on first run if absent. Delete the dir to refresh between iterations. |
| `path` | Mount the explicit `path` field. Use for testing forks/branches. |

### Validation rules (enforced by pydantic)

- At least one variant; names must be unique.
- `defaults.primary_variant` must reference an existing variant.
- `defaults.baseline_variant` (if set) must be a different existing variant.
- Each case must set exactly one of `prompt` or `prompt_file`.
- Case IDs must be unique.
- `mount: path` requires the `path` field; other mounts must omit it.
- `runs_per_variant`, `timeout_s`, `num_workers` must be ≥ 1.
- `env_pool` (if set): every list must be non-empty, all keys equal length,
  and each list ≥ `num_workers`.
- `pre_run_script` (if set): file must exist under the skill dir and be
  executable. Validated when the runner starts, not when the config loads.

Bad configs fail with field-level error messages pointing at the JSON path:

```
config validation failed (2 error(s)):
  - defaults.primary_variant: 'with_kill' not in variants ['with_skill', 'without_skill']
  - cases.1: must set prompt or prompt_file
```

### Per-run isolation: `env_pool` and `pre_run_script`

Two independent extension hooks for tests where a run needs its own slice of
external state. They're orthogonal — use either, both, or neither.

#### `env_pool` — per-worker environment values

Some skills exercise external resources (databases, sandboxes, scratch
directories, ports, third-party API keys with per-key rate limits) where two
runs sharing the same value would clobber each other. `env_pool` declares a
list of values for each environment variable, and the runner gives each worker
thread one slot's worth for the duration of a run:

```jsonc
"defaults": {
  "num_workers": 4,
  "env_pool": {
    "DATABASE_URL": [
      "postgres://localhost/test_db_1",
      "postgres://localhost/test_db_2",
      "postgres://localhost/test_db_3",
      "postgres://localhost/test_db_4"
    ],
    "SCRATCH_DIR": [
      "/tmp/eval-1", "/tmp/eval-2", "/tmp/eval-3", "/tmp/eval-4"
    ]
  }
}
```

Mechanics:

- Pool size must be `>= num_workers` per key — runs never share a slot.
  Validation rejects smaller pools rather than silently looping.
- Multiple keys must have **equal-length** lists. Same index across keys binds
  to the same worker — `DATABASE_URL[2]` and `SCRATCH_DIR[2]` are always held
  by the same in-flight run, so you can rely on cross-variable consistency.
- Slot lifetime is one run: acquired before `pre_run_script` (if any),
  released after the executor returns. If the executor crashes the slot still
  goes back to the pool.
- The values are merged into the executor's environment, overriding any
  inherited value with the same name.

Use it whenever parallel runs each need their own copy of *some* resource.
DBs are one example; per-worker sandbox dirs, port numbers, or API tokens
fit the same shape.

#### `pre_run_script` — per-run setup hook

```jsonc
"defaults": {
  "pre_run_script": "scripts/reset_db.sh"
}
```

The path is relative to the skill directory and must be executable. Before
each executor subprocess, the runner invokes this script with:

- **cwd** = the run's directory (`iteration-N/eval-X/<variant>/run-K/`)
- **env** = the same env the executor will see (inherited shell env, plus any
  `env_pool` slot values the worker is currently holding)
- **stdout/stderr** captured to `setup_stdout.log` / `setup_stderr.log`
  inside the run dir

A non-zero exit (or timeout) marks the run `failed`, surfaces
`setup_exit_code` / `setup_timed_out` in `run_status.json` and the manifest,
and **skips the executor** — there's no point running the test if its
prerequisites didn't establish.

Independent of `env_pool`: it's just "run this script first". Use it for any
per-run preparation: clearing state from the previous occupant of the slot,
seeding fixtures, warming a cache, registering a tenant, etc.

#### Pairing them

The common pattern is `env_pool` for resource isolation plus `pre_run_script`
to bring the resource to a clean starting state. Worth knowing:

- The script can read its own env to find which slot it's in
  (e.g. `psql "$DATABASE_URL" -c 'TRUNCATE TABLE …'`).
- The runner does not verify the script actually cleaned state — its exit
  code is taken as truth. If your script can fail silently, add a sanity
  check at its tail.
- One pre-allocated pool of N reusable resources + a clear-state script
  beats spinning up a fresh resource per run, especially when setup is
  cheaper than provisioning.

### prompt vs prompt_file

For short inline prompts, use `prompt`. For multi-paragraph prompts (long
markdown bodies, embedded code blocks), put the prompt in its own `.md` file
and reference it via `prompt_file` (path is relative to the skill dir). This
keeps evals.json readable and lets prompts be edited like normal markdown.

```jsonc
{
  "id": 1,
  "name": "complex task",
  "prompt_file": "evals/prompts/case-1.md"
}
```

## triggers.json

Trigger evals test whether the skill's *description* causes Claude to invoke
the skill on relevant queries. No variants — the variable being tested is the
description itself, mutated in-place by `trigger-improve`.

```jsonc
{
  "version": 2,
  "skill_name": "my-skill",
  "default_model": "claude-opus-4-7",

  "defaults": {
    "runs_per_query": 3,                       // replicate per query
    "trigger_threshold": 0.5,                  // pass if rate ≥ this when should=true
    "timeout_s": 30,
    "num_workers": 10,
    "max_iterations": 5,                       // for trigger-loop
    "holdout": 0.4                             // fraction held out for test split
  },

  "queries": [
    {
      "query": "How do I make a bar chart?",
      "should_trigger": true
    },
    {
      "query": "What's the weather today?",
      "should_trigger": false
    }
  ]
}
```

### Validation rules

- At least one query.
- `trigger_threshold` ∈ [0, 1].
- `holdout` ∈ [0, 1).
- All defaults are optional and have sensible fallbacks.

## Why this layout

- **Variants are data, not code**: adding a fourth variant means editing
  `evals.json`, not the python scripts. The dashboard reads variant names
  from the manifest and renders whatever's there.
- **Single source of truth**: there's no separate file declaring "primary is
  with_skill, delta direction is positive" — the config says it, the manifest
  records it, the aggregator reads it.
- **Schema-validated**: writing a bad config produces a clear error pointing
  at the offending field, not a `KeyError` deep in `aggregate_benchmark.py`.
- **JSON, not YAML**: agents edit these files via the Edit tool — JSON's
  unambiguous structure beats YAML's indent-sensitive grammar. Long prompts
  go in separate `.md` files via `prompt_file` to avoid escape hell.
