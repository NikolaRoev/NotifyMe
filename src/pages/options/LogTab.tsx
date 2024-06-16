import { type LogMessage, Severity } from "../../log";
import { useEffect, useState } from "react";
import type { Message } from "../../message";
import { Virtuoso } from "react-virtuoso";
import clsx from "clsx";
import { formatISO9075 } from "date-fns";



function useLog() {
    const [log, setLog] = useState<LogMessage[]>([]);
  
    const getLog = () => {
        const message: Message = { type: "GetLog" };
        chrome.runtime.sendMessage(message).then((log: LogMessage[]) => {
            setLog(log);
        }).catch((reason) => { console.error(`Failed to get log: ${reason}.`); });
    };

    useEffect(() => {
        getLog();
    }, []);
  
    return { log };
}


function LogLine({ logMessage }: { logMessage: LogMessage }) {
    function lineColor(severity: Severity) {
        switch (severity) {
            case Severity.INFO: {
                return clsx("text-green-600");
            }
            case Severity.WARN: {
                return clsx("text-yellow-500");
            }
            case Severity.ERROR: {
                return clsx("text-red-600");
            }
            default: {
                const unreachable: never = severity;
                console.error(`Invalid log severity '${JSON.stringify(unreachable)}'.`);
                return clsx("text-purple-600");
            }
            
        }
    }


    return (
        <span className={clsx("p-[5px] text-[14px]", lineColor(logMessage.severity))}>
            [{formatISO9075(logMessage.timestamp)}][{logMessage.severity}]: {logMessage.message}
        </span>
    );
}


interface FilterButtonProps {
    className: string,
    text: string,
    toggled: boolean,
    setToggled: () => void
}

function FilterButton({ className, text, toggled, setToggled }: FilterButtonProps) {
    return (
        <button
            className={clsx(
                "px-[4px] hover:bg-neutral-200 active:bg-neutral-300 rounded",
                { "ring-1 ring-inset ring-neutral-700": toggled },
                className
            )}
            type="button"
            onClick={() => { setToggled(); }}
        >{text}</button>
    );
}


export default function LogTab() {
    const { log } = useLog();
    const [filter, setFilter] = useState({ info: false, warn: false, error: false });
    const nums = log.reduce((acc, curr) => {
        switch (curr.severity) {
            case Severity.INFO: {
                return { ...acc, info: ++acc.info };
            }
            case Severity.WARN: {
                return { ...acc, warn: ++acc.warn };
            }
            case Severity.ERROR: {
                return { ...acc, error: ++acc.error };
            }
            default: {
                const unreachable: never = curr.severity;
                throw new Error(`Invalid log severity when counting '${JSON.stringify(unreachable)}'.`);
            }
        }
    }, { info: 0, warn: 0, error: 0 });


    const logItems = log.filter((logMessage) => {
        if (!filter.info && !filter.warn && !filter.error) {
            return true;
        }
        else if (filter.info) {
            return logMessage.severity === Severity.INFO;
        }
        else if (filter.warn) {
            return logMessage.severity === Severity.WARN;
        }
        else if (filter.error) {
            return logMessage.severity === Severity.ERROR;
        }

        return true;
    });


    return (
        <>
            <div className="p-[5px] flex gap-x-[5px] border border-neutral-700 border-b-0">
                <FilterButton
                    className="text-green-600"
                    text={`${nums.info} Info`}
                    toggled={filter.info}
                    setToggled={() => { setFilter({ ...filter, info: !filter.info }); }}
                />
                <FilterButton
                    className="text-yellow-500"
                    text={`${nums.warn} Warn`}
                    toggled={filter.warn}
                    setToggled={() => { setFilter({ ...filter, warn: !filter.warn }); }}
                />
                <FilterButton
                    className="text-red-600"
                    text={`${nums.error} Error`}
                    toggled={filter.error}
                    setToggled={() => { setFilter({ ...filter, error: !filter.error }); }}
                />
            </div>
            <Virtuoso
                className="border border-neutral-700"
                data={logItems}
                initialTopMostItemIndex={logItems.length - 1}
                computeItemKey={(_, logMessage) => logMessage.timestamp}
                itemContent={(_, logMessage) => (
                    <LogLine logMessage={logMessage}/>
                )}
                followOutput
            />
        </>
    );
}
