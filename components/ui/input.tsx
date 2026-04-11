import * as React from "react"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react";

export interface InputProps
  extends React.ComponentProps<"input"> {
  StartIcon?: LucideIcon;
  EndIcon?: LucideIcon;
}

function Input({ className, type, StartIcon, EndIcon, ...props }: InputProps) {
  return (
    <div className="relative">
      {StartIcon && (
        <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2">
          <StartIcon size={18} />
        </div>
      )}

      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          StartIcon ? "pl-8" : "",
          EndIcon ? "pr-8" : "",
          className
        )}
        {...props}
      />

      {EndIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <EndIcon size={18} />
        </div>
      )}
    </div>

  )
}

export { Input }
