import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(120deg,#2563EB,#7C3AED,#1D4ED8)] bg-[length:200%_200%] animate-[gradientPan_6s_ease_infinite] text-white shadow-sm hover:shadow-[0_0_18px_rgba(37,99,235,0.5)] hover:scale-[1.03]",
        secondary: "bg-white text-[#0F1419] border border-slate-200 hover:bg-slate-50 hover:shadow-md shadow-sm",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-50 hover:border-slate-300 text-[#0F1419]",
        ghost: "hover:bg-slate-100 text-[#0F1419]",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
        dark:
          "bg-[linear-gradient(120deg,#0F1419,#1E3A8A,#0F1419)] bg-[length:200%_200%] animate-[gradientPan_8s_ease_infinite] text-white hover:shadow-[0_0_18px_rgba(30,58,138,0.5)] hover:scale-[1.03]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
