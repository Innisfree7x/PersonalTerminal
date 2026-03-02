import { addMonths, format } from 'date-fns';

export interface TimelineGridLine {
  monthOffset: number;
  offsetPercent: number;
  isMajor: boolean;
  quarterLabel: string;
  monthLabel: string;
}

export interface TimelineTick {
  monthOffset: number;
  offsetPercent: number;
  label: string;
}

export interface TimelineQuarterSegment {
  startPercent: number;
  endPercent: number;
  quarter: 1 | 2 | 3 | 4;
  label: string;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function getMonthLabelFormat(horizonMonths: number): string {
  return horizonMonths >= 18 ? 'MM.yy' : "MMM ''yy";
}

export function buildMonthGridLines(
  timelineStart: Date,
  horizonMonths: number,
  monthLabelFormat: string
): TimelineGridLine[] {
  const safeHorizon = Math.max(1, horizonMonths);

  return Array.from({ length: safeHorizon + 1 }, (_, monthOffset) => {
    const tickDate = addMonths(timelineStart, monthOffset);
    const quarter = Math.floor(tickDate.getMonth() / 3) + 1;
    const isQuarterBoundary = tickDate.getMonth() % 3 === 0;

    return {
      monthOffset,
      offsetPercent: clampPercent((monthOffset / safeHorizon) * 100),
      isMajor: isQuarterBoundary || monthOffset === 0 || monthOffset === safeHorizon,
      quarterLabel: `Q${quarter} '${format(tickDate, 'yy')}`,
      monthLabel: format(tickDate, monthLabelFormat),
    };
  });
}

export function selectTicksWithMinGap<T extends { offsetPercent: number }>(
  ticks: T[],
  minGapPercent: number,
  options?: {
    alwaysKeepFirst?: boolean;
    alwaysKeepLast?: boolean;
  }
): T[] {
  if (ticks.length <= 2) return ticks;

  const alwaysKeepFirst = options?.alwaysKeepFirst ?? true;
  const alwaysKeepLast = options?.alwaysKeepLast ?? true;

  const filtered: T[] = [];

  if (alwaysKeepFirst && ticks[0]) {
    filtered.push(ticks[0]);
  }

  const startIndex = alwaysKeepFirst ? 1 : 0;
  const endIndex = alwaysKeepLast ? ticks.length - 1 : ticks.length;

  for (let i = startIndex; i < endIndex; i += 1) {
    const tick = ticks[i];
    if (!tick) continue;

    const previousAccepted = filtered[filtered.length - 1];
    if (!previousAccepted || tick.offsetPercent - previousAccepted.offsetPercent >= minGapPercent) {
      filtered.push(tick);
    }
  }

  if (alwaysKeepLast && ticks[ticks.length - 1]) {
    const last = ticks[ticks.length - 1] as T;
    const previousAccepted = filtered[filtered.length - 1];

    if (previousAccepted && last.offsetPercent - previousAccepted.offsetPercent < minGapPercent) {
      if (filtered.length > 1) {
        filtered.pop();
      }
    }

    if (!filtered.length || filtered[filtered.length - 1] !== last) {
      filtered.push(last);
    }
  }

  return filtered;
}

export function buildTimelineRuler(timelineStart: Date, horizonMonths: number): {
  monthGridLines: TimelineGridLine[];
  quarterSegments: TimelineQuarterSegment[];
  monthLabelTicks: TimelineTick[];
} {
  const safeHorizon = Math.max(1, horizonMonths);
  const monthLabelFormat = getMonthLabelFormat(safeHorizon);
  const monthGridLines = buildMonthGridLines(timelineStart, safeHorizon, monthLabelFormat);

  const majorLines = monthGridLines.filter((line) => line.isMajor);
  const quarterSegments: TimelineQuarterSegment[] = [];

  for (let i = 0; i < majorLines.length - 1; i += 1) {
    const start = majorLines[i];
    const end = majorLines[i + 1];
    if (!start || !end) continue;

    const startDate = addMonths(timelineStart, start.monthOffset);
    const quarter = (Math.floor(startDate.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;

    quarterSegments.push({
      startPercent: start.offsetPercent,
      endPercent: end.offsetPercent,
      quarter,
      label: `Q${quarter} '${format(startDate, 'yy')}`,
    });
  }

  const step = safeHorizon <= 12 ? 1 : safeHorizon <= 24 ? 2 : 3;

  const monthTicksRaw: TimelineTick[] = monthGridLines
    .filter(
      (line) =>
        line.monthOffset === 0 ||
        line.monthOffset === safeHorizon ||
        line.monthOffset % step === 0
    )
    .map((line) => ({
      monthOffset: line.monthOffset,
      offsetPercent: line.offsetPercent,
      label: line.monthLabel,
    }));

  const monthLabelTicks = selectTicksWithMinGap(monthTicksRaw, 7, {
    alwaysKeepFirst: true,
    alwaysKeepLast: true,
  });

  return {
    monthGridLines,
    quarterSegments,
    monthLabelTicks,
  };
}
