import clsx from "clsx";
import { useState } from "react";



interface ConfirmButtonProps extends React.ComponentPropsWithoutRef<"button"> {
    initialSrc: string,
    confirmSrc: string
}

export default function ConfirmButton({ initialSrc, confirmSrc, onClick, ...props }: ConfirmButtonProps) {
    const [triggered, setTriggered] = useState(false);

    return (
        <button
            className={clsx(
                "min-w-[32px] min-h-[32px] flex items-center justify-center",
                "hover:bg-neutral-400 active:bg-neutral-500"
            )}
            onClick={(event) => {
                if (!triggered) {
                    setTriggered(true);
                    setTimeout(() => { setTriggered(false); }, 1500);
                }
                else {
                    onClick?.(event);
                }
            }}
            {...props}
        ><img src={triggered ? confirmSrc : initialSrc} /></button>
    );
}
