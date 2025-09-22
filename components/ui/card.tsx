// admin-panel/components/ui/card.tsx

import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

export function Card({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl transition-all duration-200",
        {
          'bg-white dark:bg-gray-800 shadow-sm': variant === 'default',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700': variant === 'bordered',
          'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl': variant === 'elevated',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}