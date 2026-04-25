"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        // Project extensions — kept beyond shadcn's default/secondary/outline/destructive set
        // because the dashboard's delta semantics need positive/warning surfaces too.
        positive:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    render?: useRender.RenderProp;
  };

function Badge({ className, variant, render, ...props }: BadgeProps) {
  const element = useRender({
    render: render ?? <span />,
    props: {
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
      ...props,
    },
  });
  return element;
}

export { Badge, badgeVariants };
