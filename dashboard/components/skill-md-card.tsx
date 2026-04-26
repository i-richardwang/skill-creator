import Link from "next/link";
import { diffLines } from "diff";
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  skillName: string;
  iterationNumber: number;
  current: string | null;
  previous: string | null;
  previousIterationNumber: number | null;
};

export function SkillMdCard({
  skillName,
  iterationNumber,
  current,
  previous,
  previousIterationNumber,
}: Props) {
  if (!current) return null;

  const hasPrev = previous !== null && previousIterationNumber !== null;
  const unchanged = hasPrev && previous === current;
  const showDiff = hasPrev && !unchanged;

  let added = 0;
  let removed = 0;
  let parts: ReturnType<typeof diffLines> = [];
  if (showDiff) {
    parts = diffLines(previous!, current);
    for (const p of parts) {
      const lineCount = countLines(p.value);
      if (p.added) added += lineCount;
      else if (p.removed) removed += lineCount;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardEyebrow>SKILL.md</CardEyebrow>
        <CardTitle className="text-base">
          <span className="font-mono tabular-nums">
            {fmtInt(current.length)} chars
          </span>
          {showDiff ? (
            <>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="font-mono tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{added}
                </span>{" "}
                <span className="text-rose-600 dark:text-rose-400">
                  −{removed}
                </span>
              </span>{" "}
              <span className="text-muted-foreground text-xs font-normal">
                vs{" "}
                <Link
                  href={`/skills/${encodeURIComponent(skillName)}/iterations/${previousIterationNumber}`}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  iter #{previousIterationNumber}
                </Link>
              </span>
            </>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-xs">
          {!hasPrev
            ? `Initial version — no prior iteration to compare against.`
            : unchanged
              ? `Identical to iteration #${previousIterationNumber}.`
              : `Diff shows changes from iteration #${previousIterationNumber} → #${iterationNumber}.`}
        </p>

        {showDiff ? (
          <details className="group" open>
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-mono text-[10px] tracking-widest uppercase select-none">
              <span className="group-open:hidden">view diff ↓</span>
              <span className="hidden group-open:inline">hide diff ↑</span>
            </summary>
            <DiffBody parts={parts} />
          </details>
        ) : null}

        <details className="group">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-mono text-[10px] tracking-widest uppercase select-none">
            <span className="group-open:hidden">view full snapshot ↓</span>
            <span className="hidden group-open:inline">hide full snapshot ↑</span>
          </summary>
          <pre className="bg-muted border-border mt-3 max-h-96 overflow-auto border px-3 py-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {current}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

function DiffBody({ parts }: { parts: ReturnType<typeof diffLines> }) {
  const rows: { kind: "add" | "del" | "ctx"; text: string }[] = [];
  for (const p of parts) {
    const kind: "add" | "del" | "ctx" = p.added
      ? "add"
      : p.removed
        ? "del"
        : "ctx";
    for (const line of splitLines(p.value)) {
      rows.push({ kind, text: line });
    }
  }

  return (
    <div className="bg-muted border-border mt-3 max-h-[28rem] overflow-auto border font-mono text-[11px] leading-relaxed">
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2 px-3 py-[1px] whitespace-pre-wrap",
            row.kind === "add" &&
              "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
            row.kind === "del" &&
              "bg-rose-500/10 text-rose-900 dark:text-rose-100",
            row.kind === "ctx" && "text-muted-foreground",
          )}
        >
          <span aria-hidden className="select-none opacity-60">
            {row.kind === "add" ? "+" : row.kind === "del" ? "−" : " "}
          </span>
          <span className="min-w-0 flex-1 break-words">{row.text || " "}</span>
        </div>
      ))}
    </div>
  );
}

function countLines(s: string): number {
  if (s.length === 0) return 0;
  // diffLines values usually end with \n; strip a single trailing newline
  // before counting so a 3-line block reports 3, not 4.
  const trimmed = s.endsWith("\n") ? s.slice(0, -1) : s;
  return trimmed.split("\n").length;
}

function splitLines(s: string): string[] {
  const trimmed = s.endsWith("\n") ? s.slice(0, -1) : s;
  return trimmed.split("\n");
}
