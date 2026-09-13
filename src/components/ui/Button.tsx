import { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "accent" | "tertiary";
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    className,
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center neo-button disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[var(--primary)] text-[#0b100c] hover:bg-[var(--primary-strong)]",
        secondary: "border-[var(--line)] bg-[var(--surface-soft)] text-white hover:border-[var(--primary)] hover:bg-white/10",
        accent: "bg-[var(--accent)] text-[#0b100c] hover:bg-[var(--primary)]",
        tertiary: "bg-[var(--tertiary)] text-[#0b100c] hover:brightness-110",
    };

    const sizes = {
        sm: "px-3 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
