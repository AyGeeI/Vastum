import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            loading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary:
                "bg-primary text-void-black hover:bg-primary-bright hover:shadow-[0_0_20px_rgba(102,252,241,0.4)] focus:ring-primary",
            secondary:
                "bg-background-elevated border border-border text-foreground hover:border-primary hover:text-primary focus:ring-primary",
            danger:
                "bg-danger text-white hover:bg-danger/80 hover:shadow-[0_0_20px_rgba(195,7,63,0.4)] focus:ring-danger",
            ghost:
                "bg-transparent text-foreground-muted hover:text-primary hover:bg-background-elevated/50 focus:ring-primary",
        };

        const sizes = {
            sm: "text-xs px-3 py-1.5 rounded",
            md: "text-sm px-4 py-2 rounded-md",
            lg: "text-base px-6 py-3 rounded-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
