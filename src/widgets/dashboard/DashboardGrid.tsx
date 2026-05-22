import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scalable Widget Layout System
 * Handles masonry/grid layout for analytics and enterprise widgets
 */
export const DashboardGrid = ({ children, className }: DashboardGridProps) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6", className)}>
      {children}
    </div>
  );
};

export const WidgetSpan = ({ children, colSpan = 2 }: { children: ReactNode, colSpan?: number }) => {
  return (
    <div className={cn(`col-span-1 md:col-span-${colSpan}`)}>
      {children}
    </div>
  );
};
