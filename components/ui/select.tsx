"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectContextValue {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
}

const Select = ({ children, value: controlledValue, defaultValue, onValueChange, ...props }: SelectProps) => {
    const [value, setValue] = React.useState(controlledValue ?? defaultValue ?? "");
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue);
            return;
        }

        if (defaultValue !== undefined) {
            setValue(defaultValue);
        }
    }, [controlledValue, defaultValue]);

    React.useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            const inTrigger = containerRef.current?.contains(target);
            const inContent = contentRef.current?.contains(target);
            if (!inTrigger && !inContent) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleValueChange = (newValue: string) => {
        if (controlledValue === undefined) {
            setValue(newValue);
        }
        if (onValueChange) onValueChange(newValue);
        setOpen(false); // Close on selection
    };

    return (
        <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, triggerRef, contentRef }}>
            <div ref={containerRef} className="relative inline-block w-full" {...props}>
                {children}
            </div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext);

        const setRefs = (node: HTMLButtonElement | null) => {
            if (context) context.triggerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        };

        return (
            <button
                ref={setRefs}
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

        const [mounted, setMounted] = React.useState(false);
        const [pos, setPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

        React.useEffect(() => {
            setMounted(true);
        }, []);

        React.useEffect(() => {
            if (!context?.open) return;

            const updatePos = () => {
                const trigger = context.triggerRef.current;
                if (!trigger) return;
                const rect = trigger.getBoundingClientRect();
                setPos({
                    top: rect.bottom + window.scrollY + 6,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            };

            updatePos();
            window.addEventListener("resize", updatePos);
            window.addEventListener("scroll", updatePos, true);
            return () => {
                window.removeEventListener("resize", updatePos);
                window.removeEventListener("scroll", updatePos, true);
            };
        }, [context?.open, context?.triggerRef]);

        if (!context?.open) return null;

        const setRefs = (node: HTMLDivElement | null) => {
            if (context) context.contentRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        };

        if (!mounted || typeof document === "undefined") return null;

        const triggerRect = context.triggerRef.current?.getBoundingClientRect();
        const computedTop = triggerRect ? triggerRect.bottom + window.scrollY + 6 : pos.top;
        const computedLeft = triggerRect ? triggerRect.left + window.scrollX : pos.left;
        const computedWidth = triggerRect ? triggerRect.width : pos.width;

        return createPortal(
            <div
                ref={setRefs}
                style={{ top: computedTop, left: computedLeft, width: computedWidth }}
                data-select-portal="true"
                className={cn(
                    "absolute z-[1000] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 max-h-60 overflow-y-auto",
                    className
                )}
                {...props}
            >
                <div className="p-1">{children}</div>
            </div>,
            document.body
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
