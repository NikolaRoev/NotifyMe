/**
 * Creates a relative time format string for a timestamp and a reference point. Up to weeks.
 * 
 * @param timestamp The relative Unix timestamp.
 * @param reference The reference Unit timestamp. Defaults to now.
 * @returns Relative time format.
 */
export function relativeTime(timestamp: number, reference: number = Date.now()): string {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const units: { compare: number, unit: Intl.RelativeTimeFormatUnit, divisor: number }[] = [
        { compare: 60_000,                   unit: "second", divisor: 1_000       },
        { compare: 3_600_000,                unit: "minute", divisor: 60_000      },
        { compare: 86_400_000,               unit: "hour",   divisor: 3_600_000   },
        { compare: 604_800_000,              unit: "day",    divisor: 86_400_000  },
        { compare: Number.POSITIVE_INFINITY, unit: "week",   divisor: 604_800_000 }
    ];

    const elapsed = timestamp - reference;
    const difference = Math.abs(elapsed);

    for (const { compare, unit, divisor } of units) {
        if (difference < compare) {
            return rtf.format(Math.trunc(elapsed / divisor), unit);
        }
    }

    return "UNKNOWN";
}
