import clsx from "clsx";
import { useState } from "react";



interface FeedsListProps {
    data: (filter: string) => React.ReactNode,
}

export default function FeedsList(props: FeedsListProps) {
    const [filter, setFilter] = useState("");

    return (
        <>
            <input
                className={clsx(
                    "mt-[30px] text-[14px] px-[5px] py-[2px]",
                    "border border-neutral-600 border-b-0 overflow-ellipsis",
                    "focus:outline-none focus:shadow-[inset_0px_-2px_2px_-2px_#404040]"
                )}
                placeholder="Find"
                type="search"
                name="feeds-search-input"
                value={filter}
                onChange={(event) => { setFilter(event.target.value); }}
            />
            <div className="flex flex-col grow overflow-y-auto border-[1px] border-neutral-600">
                {props.data(filter)}
            </div>
        </>
    );
}
