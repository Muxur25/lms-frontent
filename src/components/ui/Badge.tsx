import * as React from "react"
import { cn } from "@/utils/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'violet'
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let badgeClass = "badge";
  if (variant && variant !== 'default') {
    badgeClass = `badge badge-${variant}`;
  }
  return (
    <div className={cn(badgeClass, className)} {...props} />
  )
}

export { Badge }
