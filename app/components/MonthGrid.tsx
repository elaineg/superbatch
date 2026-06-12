"use client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type YearMonth = { year: number; month: number }; // month 0-11

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function MonthGrid({
  view,
  ticked,
  disabled,
  onToggle,
  onChangeMonth,
}: {
  view: YearMonth;
  ticked: Set<string>;
  disabled: boolean;
  onToggle: (key: string) => void;
  onChangeMonth: (next: YearMonth) => void;
}) {
  const { year, month } = view;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    onChangeMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="text-sm font-semibold text-slate-800">
          {MONTH_NAMES[month]} {year}
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-xs font-medium text-slate-400">
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`blank-${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(dateKey(year, month, d))}
              aria-pressed={ticked.has(dateKey(year, month, d))}
              className={`rounded-md py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                ticked.has(dateKey(year, month, d))
                  ? "bg-teal-800 font-semibold text-white"
                  : "text-slate-700 hover:bg-teal-50"
              }`}
            >
              {d}
            </button>
          )
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Tick each date this client had a session — every tick adds an editable row below.
      </p>
    </div>
  );
}
