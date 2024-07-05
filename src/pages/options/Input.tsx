import clsx from "clsx";
import { forwardRef } from "react";



const Input = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
    function Input({ className, ...props }, ref) {
        return (
            <input
                ref={ref}
                className={clsx(
                    "p-[3px] focus:outline-none border-[2px] grow rounded-[3px] focus:ring-1",
                    "valid:border-green-500 focus:valid:ring-green-500",
                    "invalid:border-red-500 focus:invalid:ring-red-500",
                    className
                )}
                {...props}
                required
            />
        );
    }
);

export default Input;
