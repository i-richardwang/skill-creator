import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "border-border bg-card text-card-foreground border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "border-border flex flex-col gap-1 border-b px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

function CardEyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-eyebrow"
      className={cn(
        "text-muted-foreground font-mono text-[10px] tracking-widest uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-heading text-xl leading-tight tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-body"
      className={cn("px-5 py-4", className)}
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-border text-muted-foreground flex items-center justify-between border-t px-5 py-3 font-mono text-[10px] tracking-widest uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardEyebrow, CardTitle, CardBody, CardFooter };
