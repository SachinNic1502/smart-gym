"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectContextValue {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
}

const Select = ({ children, defaultValue, onValueChange, ...props }: SelectProps) => {
    const [value, setValue] = React.useState(defaultValue || "");
    const [open, setOpen] = React.useState(false);

    const handleValueChange = (newValue: string) => {
        setValue(newValue);
        if (onValueChange) onValueChange(newValue);
        setOpen(false); // Close on selection
    };

    return (
        <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
            <div className="relative inline-block w-full" {...props}>{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext);
        return (
            <button
                ref={ref}
                type="button"
                onClick={() => context?.setOpen(!context.open)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        );
    }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext);

        if (!context?.open) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 mt-1 w-full",
                    className
                )}
                {...props}
            >
                <div className="p-1">{children}</div>
            </div>
        );
    }
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
    ({ className, children, value, ...props }, ref) => {
        const context = React.useContext(SelectContext);
        return (
            <div
                ref={ref}
                onClick={(e) => {
                    e.stopPropagation();
                    context?.onValueChange(value);
                }}
                className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                    className
                )}
                {...props}
            >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {context?.value === value && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                </span>
                <span className="font-medium">{children}</span>
            </div>
        );
    }
);
SelectItem.displayName = "SelectItem";

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(
    ({ className, ...props }, ref) => {
        const context = React.useContext(SelectContext);
        return (
            <span
                ref={ref}
                className={cn("block truncate", className)}
                {...props}
            >
                {context?.value || props.placeholder}
            </span>
        );
    }
);
SelectValue.displayName = "SelectValue";

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
