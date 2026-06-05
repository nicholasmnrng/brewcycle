import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "focus-ring flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
