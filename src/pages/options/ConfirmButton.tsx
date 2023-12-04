import { useState } from "react";



type ConfirmButtonProps = {
    initialText: string,
    confirmText: string,
    onClick: () => void,
    title: string
}

export default function ConfirmButton({ initialText, confirmText, onClick, title }: ConfirmButtonProps) {
    const [triggered, setTriggered] = useState(false);


    function handleClick() {
        if (!triggered) {
            setTriggered(true);

            setTimeout(() => {
                setTriggered(false);
            }, 1500);
        }
        else {
            onClick();
        }
    }


    return (
        <button
            className="min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-neutral-400 active:bg-neutral-500"
            onClick={handleClick}
            title={title}
        ><img src={triggered ? confirmText  : initialText} /></button>
    );
}
