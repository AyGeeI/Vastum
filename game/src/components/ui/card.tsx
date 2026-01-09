import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "bordered";
    glow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", glow = false, children, ...props }, ref) => {
        const variants = {
            default: "bg-background-elevated",
            glass: "glass",
            bordered: "bg-background-elevated border border-border",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg p-4 transition-all duration-200",
                    variants[variant],
                    glow && "animate-pulse-glow",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex flex-col space-y-1.5 pb-4 border-b border-border", className)}
            {...props}
        />
    )
);

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("text-lg font-display font-semibold tracking-wider uppercase text-gradient", className)}
            {...props}
        />
    )
);

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-sm text-foreground-muted", className)}
            {...props}
        />
    )
);

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("pt-4", className)} {...props} />
    )
);

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center pt-4 border-t border-border", className)}
            {...props}
        />
    )
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
