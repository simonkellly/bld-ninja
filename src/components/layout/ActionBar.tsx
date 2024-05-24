import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";
import { Button, ButtonProps } from "../ui/button";
import { LucideIcon, LucideProps } from "lucide-react";

export const ActionIcon = forwardRef<SVGSVGElement, LucideProps & { icon: LucideIcon }>(({ ...props }, ref) => (
  <props.icon
    className={cn("h-4 w-4", props.className)}
    ref={ref}
  />
));

export const ActionButton = forwardRef<HTMLButtonElement, ButtonProps & { icon?: LucideIcon }>(
  ({ children, className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size={null}
      className={cn('h-full aspect-square p-1', className)}
      onClick={e => {
        e.currentTarget.blur();
        if (props.onClick) {
          props.onClick(e);
        }
      }}
      {...props}
    >
      {children || (props.icon && <ActionIcon icon={props.icon} />)}  
    </Button>
  )
);

export const ActionStart = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div
    className={cn("flex flex-row h-full basis-1/3", props.className)}
    ref={ref}
    {...props}
  />
));

export const ActionMiddle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div
    className={cn("flex flex-row h-full basis-1/3 grow justify-center", props.className)}
    ref={ref}
    {...props}
  />
));

export const ActionEnd = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div
    className={cn("flex flex-row-reverse h-full basis-1/3", props.className)}
    ref={ref}
    {...props}
  />
));

export const ActionBar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div
    className={cn("bg-card rounded-lg border w-full h-12 p-1 relative", props.className)}
    ref={ref}
    {...props}
  >
    <div className="h-full flex justify-between">
      {children}
    </div>
  </div>
));
