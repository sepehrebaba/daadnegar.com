import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "border-border/70 relative grid w-full grid-cols-[0_1fr] items-start rounded-lg border has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-yellow-50/40 *:data-[slot=alert-description]:text-yellow-600 dark:bg-yellow-950 [&>svg]:text-yellow-600",
        error:
          "text-destructive bg-red-50/40 *:data-[slot=alert-description]:text-red-700 dark:bg-red-950 [&>svg]:text-red-700",
      },
      size: {
        xs: "gap-x-1 gap-y-0 px-2 py-1 text-xs has-[>svg]:gap-x-1 [&>svg]:size-3",
        sm: "gap-x-2 gap-y-0 px-3 py-2 text-xs has-[>svg]:gap-x-2 [&>svg]:size-3.5",
        default: "gap-x-3 gap-y-0.5 px-4 py-3 text-sm has-[>svg]:gap-x-3 [&>svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

function Alert({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant, size }),
        "[&>svg]:relative [&>svg]:top-[-1px]",
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
