"use client";

import React from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "bottom" | "right";
  showCloseButton?: boolean;
}

/**
 * ResponsiveModal - Renders a Modal on desktop and a Drawer on mobile
 * Automatically adapts to the screen size using the useIsMobile hook
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  size = "md",
  position = "bottom",
  showCloseButton = true,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  // Define size classes for desktop dialogs
  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[525px]",
    lg: "sm:max-w-[640px]",
    xl: "sm:max-w-[800px]",
    full: "sm:max-w-[90vw] sm:h-[85vh]",
  };

  // If mobile, use Drawer component
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction={position}>
        <DrawerContent className={cn("max-h-[85vh]", className)}>
          {(title || description) && (
            <DrawerHeader className="relative">
              {showCloseButton && (
                <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DrawerClose>
              )}
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && (
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </DrawerHeader>
          )}
          <div className={cn("px-4 pb-4", contentClassName)}>{children}</div>
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  // If desktop, use Dialog component
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          size === "full" && "flex flex-col",
          className
        )}
      >
        {(title || description) && (
          <DialogHeader className="relative">
            {showCloseButton && (
              <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => onOpenChange(false)}
                />
                <span className="sr-only">Close</span>
              </div>
            )}
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <div className="text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </DialogHeader>
        )}
        <div className={cn(size === "full" && "flex-1 overflow-auto", contentClassName)}>
          {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Example usage:
// import { Button } from "@/components/ui/button";
//
// function MyComponent() {
//   const [isOpen, setIsOpen] = useState(false);
//   
//   return (
//     <ResponsiveModal
//       open={isOpen}
//       onOpenChange={setIsOpen}
//       title="Edit Profile"
//       footer={
//         <div className="flex justify-end gap-2">
//           <Button variant="outline" onClick={() => setIsOpen(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleSave}>Save Changes</Button>
//         </div>
//       }
//     >
//       <form className="space-y-4">
//         Form content goes here
//       </form>
//     </ResponsiveModal>
//   );
// } 