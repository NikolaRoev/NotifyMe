import { type ReactElement, useState } from "react";
import clsx from "clsx";



type TabProps = {
    title: string
    children: ReactElement | ReactElement[]
};

export function Tab(props: TabProps) {
    return <div className="p-[30px] flex flex-col grow">{props.children}</div>;
}


type TabsProps = {
    children: ReactElement<TabProps>[]
}

export function Tabs({ children }: TabsProps) {
    const [tabIndex, setIndex] = useState(0);


    const tabButtons = children.map((tab, index) =>
        <button
            key={index}
            role="tab"
            onClick={() => { setIndex(index); }}
            className={clsx(
                "w-[120px] h-[40px] text-base",
                { "hover:bg-neutral-300 active:bg-neutral-400": tabIndex !== index },
                { "bg-neutral-400": tabIndex === index }
            )}
        >{tab.props.title}</button>
    );

    return (
        <div className="h-full mx-[20vw] mt-[10vh] mb-[15vh] flex border-[1px] border-neutral-600 overflow-y-hidden">
            <div className="flex flex-col bg-neutral-50">{tabButtons}</div>
            {children[tabIndex]}
        </div>
    );
}
