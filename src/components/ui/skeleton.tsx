import { cn } from "@/lib/utils";

/**
 * Skeleton — adapted from the Watermelon UI registry
 * (https://github.com/WatermelonCorp/watermellon-registry, `skeleton`).
 * Zero dependencies: uses the project's `skeleton` shimmer (globals.css)
 * instead of the registry's `bg-accent` (no --color-accent in this theme).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("skeleton", className)} {...props} />;
}

export { Skeleton };
