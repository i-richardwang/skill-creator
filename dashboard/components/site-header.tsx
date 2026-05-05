import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          aria-label="Skill evals home"
        >
          <span className="font-heading text-lg leading-none tracking-tight group-hover:underline">
            skill&nbsp;evals
          </span>
          <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
            {"// instrument panel"}
          </span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[10px] tracking-widest uppercase">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Portfolio
          </Link>
          <a
            href="https://github.com/i-richardwang/better-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Source ↗
          </a>
          <span
            className="text-muted-foreground/60 hidden sm:inline"
            aria-hidden
          >
            press&nbsp;<kbd className="text-foreground/70">d</kbd>&nbsp;for dark
          </span>
        </nav>
      </div>
    </header>
  );
}
