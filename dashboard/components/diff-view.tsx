import { Fragment } from "react";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";

export type DiffPart = ReturnType<typeof diffLines>[number];

export function computeLineDiff(prev: string, current: string): DiffPart[] {
  return diffLines(prev, current);
}

// diffLines values usually end with `\n`; strip a single trailing newline
// before counting so a 3-line block reports 3, not 4.
export function countLines(s: string): number {
  if (s.length === 0) return 0;
  const trimmed = s.endsWith("\n") ? s.slice(0, -1) : s;
  return trimmed.split("\n").length;
}

export function splitLines(s: string): string[] {
  const trimmed = s.endsWith("\n") ? s.slice(0, -1) : s;
  return trimmed.split("\n");
}

export function diffStats(parts: DiffPart[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const p of parts) {
    const lc = countLines(p.value);
    if (p.added) added += lc;
    else if (p.removed) removed += lc;
  }
  return { added, removed };
}

// ─────────────────────────────────────────────────────────────────────────
// Unified (single-column) diff body — used at narrow widths.
// ─────────────────────────────────────────────────────────────────────────

export function DiffBody({
  parts,
  className,
}: {
  parts: DiffPart[];
  className?: string;
}) {
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
    <div
      className={cn(
        "bg-muted border-border max-h-[28rem] overflow-auto border font-mono text-[11px] leading-relaxed",
        className,
      )}
    >
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

// ─────────────────────────────────────────────────────────────────────────
// Side-by-side diff body — used at md+ widths where each side has room.
// ─────────────────────────────────────────────────────────────────────────

type CellKind = "ctx" | "del" | "add" | "empty";

type SideRow = {
  left: { kind: CellKind; text: string };
  right: { kind: CellKind; text: string };
};

// Pair each removed block with the immediately-following added block (the
// `diff` package emits removed before added). Within a pair, align lines by
// index and pad the shorter side with empty filler so subsequent unchanged
// lines line up.
export function toSideBySideRows(parts: DiffPart[]): SideRow[] {
  const rows: SideRow[] = [];
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    const isRemoved = !!p.removed;
    const isAdded = !!p.added;
    const next = parts[i + 1];
    const nextIsAdded = next ? !!next.added : false;

    if (!isRemoved && !isAdded) {
      for (const line of splitLines(p.value)) {
        rows.push({
          left: { kind: "ctx", text: line },
          right: { kind: "ctx", text: line },
        });
      }
      i += 1;
    } else if (isRemoved && nextIsAdded) {
      const removedLines = splitLines(p.value);
      const addedLines = splitLines(next!.value);
      const max = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < max; j += 1) {
        rows.push({
          left:
            j < removedLines.length
              ? { kind: "del", text: removedLines[j] }
              : { kind: "empty", text: "" },
          right:
            j < addedLines.length
              ? { kind: "add", text: addedLines[j] }
              : { kind: "empty", text: "" },
        });
      }
      i += 2;
    } else if (isRemoved) {
      for (const line of splitLines(p.value)) {
        rows.push({
          left: { kind: "del", text: line },
          right: { kind: "empty", text: "" },
        });
      }
      i += 1;
    } else {
      // added-only (no preceding removed)
      for (const line of splitLines(p.value)) {
        rows.push({
          left: { kind: "empty", text: "" },
          right: { kind: "add", text: line },
        });
      }
      i += 1;
    }
  }
  return rows;
}

function SideCell({
  kind,
  text,
  side,
}: {
  kind: CellKind;
  text: string;
  side: "left" | "right";
}) {
  const bg =
    kind === "del"
      ? "bg-rose-500/12 text-rose-900 dark:text-rose-100"
      : kind === "add"
        ? "bg-emerald-500/12 text-emerald-900 dark:text-emerald-100"
        : kind === "empty"
          ? "bg-muted/40"
          : "text-muted-foreground";
  const marker = kind === "del" ? "−" : kind === "add" ? "+" : kind === "ctx" ? " " : "";
  return (
    <div
      className={cn(
        "flex min-w-0 gap-2 px-3 py-[1px] whitespace-pre-wrap",
        side === "right" && "border-border border-l",
        bg,
      )}
    >
      <span aria-hidden className="w-3 shrink-0 select-none opacity-60">
        {marker}
      </span>
      <span className="min-w-0 flex-1 break-words">
        {kind === "empty" ? "" : text || " "}
      </span>
    </div>
  );
}

export function SideBySideDiffBody({
  parts,
  className,
}: {
  parts: DiffPart[];
  className?: string;
}) {
  const rows = toSideBySideRows(parts);
  return (
    <div
      className={cn(
        "bg-muted border-border max-h-[36rem] overflow-auto border font-mono text-[11px] leading-relaxed",
        className,
      )}
    >
      <div className="grid grid-cols-2">
        {rows.map((row, i) => (
          <Fragment key={i}>
            <SideCell kind={row.left.kind} text={row.left.text} side="left" />
            <SideCell kind={row.right.kind} text={row.right.text} side="right" />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// Renders unified single-column at narrow widths and side-by-side at md+.
// Both trees are present in the DOM; CSS hides one. Diffs in this app cap
// at ~200KB per file, so duplication is cheap.
export function ResponsiveDiff({
  parts,
  className,
}: {
  parts: DiffPart[];
  className?: string;
}) {
  return (
    <>
      <div className={cn("md:hidden", className)}>
        <DiffBody parts={parts} />
      </div>
      <div className={cn("hidden md:block", className)}>
        <SideBySideDiffBody parts={parts} />
      </div>
    </>
  );
}
