import * as React from "react";
import { cn } from "@/lib/utils";

function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn(
          "w-full border-collapse text-left text-sm [&_th]:border-border [&_td]:border-border",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-head"
      className={cn(
        "text-muted-foreground border-border border-b font-mono text-[10px] tracking-widest uppercase",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr]:border-border [&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/40 data-[interactive=true]:cursor-pointer transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHeaderCell({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-header-cell"
      className={cn("px-4 py-3 font-medium align-bottom", className)}
      {...props}
    />
  );
}

function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
};
