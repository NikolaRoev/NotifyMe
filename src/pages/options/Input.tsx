import clsx from "clsx";
import { forwardRef } from "react";



type InputProps = {
    id?: string,
    className?: string,
    type?: React.HTMLInputTypeAttribute,
    min?: string | number,
    step?: string | number,
    value?: string | number | readonly string[],
    onInput?: React.FormEventHandler<HTMLInputElement>
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
    return (
        <input
            id={props.id}
            ref={ref}
            className={clsx(
                "p-[3px] focus:outline-none border-[2px] grow rounded-[3px] focus:ring-1",
                "valid:border-green-500 focus:valid:ring-green-500",
                "invalid:border-red-500 focus:invalid:ring-red-500",
                props.className
            )}
            type={props.type}
            min={props.min}
            step={props.step}
            value={props.value}
            onInput={props.onInput}
            required
        />
    );
});

export default Input;
