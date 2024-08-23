import clsx from "clsx";



export default function GeneralButton({ children, className, ...props }: React.ComponentPropsWithoutRef<"button">) {
    return (
        <button
            className={clsx(
                "px-[3px] bg-neutral-50 border-[1px] border-neutral-600 rounded-[3px] text-[14px]",
                "hover:bg-neutral-300 active:bg-neutral-400",
                className
            )}
            {...props}
        >{children}</button>
    );
}
