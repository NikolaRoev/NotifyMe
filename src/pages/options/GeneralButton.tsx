import clsx from "clsx";



type GeneralButtonProps = {
    children: string,
    className?: string,
    onClick?: React.MouseEventHandler
}

export default function GeneralButton({ children, className, onClick }: GeneralButtonProps) {
    return (
        <button
            className={clsx(
                "px-[3px] bg-neutral-50 border-[1px] border-neutral-600 rounded-[3px] text-[14px]",
                "hover:bg-neutral-300 active:bg-neutral-400",
                className
            )}
            onClick={onClick}
        >{children}</button>
    );
}
