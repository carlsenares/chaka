export type PriorityScoreRange = {
  min: number;
  max: number;
};

export const PRIORITY_COLOR_STOPS = [
  "#2f855a",
  "#66a861",
  "#c6b44b",
  "#d9822b",
  "#b83232",
] as const;

export const PRIORITY_GRADIENT_CSS = `linear-gradient(90deg, ${PRIORITY_COLOR_STOPS.join(", ")})`;

export function getPriorityScoreRange(scores: number[]): PriorityScoreRange {
  const finiteScores = scores.filter(Number.isFinite);

  if (finiteScores.length === 0) {
    return { min: 0, max: 100 };
  }

  return {
    min: Math.min(0, ...finiteScores),
    max: Math.max(100, ...finiteScores),
  };
}

export function priorityColor(score: number, range: PriorityScoreRange) {
  const normalized = normalizePriorityScore(score, range);
  const palettePosition = (1 - normalized) * (PRIORITY_COLOR_STOPS.length - 1);
  const lowerIndex = Math.floor(palettePosition);
  const upperIndex = Math.min(PRIORITY_COLOR_STOPS.length - 1, lowerIndex + 1);
  const mixAmount = palettePosition - lowerIndex;

  return interpolateHexColor(
    PRIORITY_COLOR_STOPS[lowerIndex],
    PRIORITY_COLOR_STOPS[upperIndex],
    mixAmount,
  );
}

export function priorityTextColor(score: number, range: PriorityScoreRange) {
  const color = hexToRgb(priorityColor(score, range));
  const relativeLuminance =
    (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;

  return relativeLuminance > 0.58 ? "#18231d" : "#ffffff";
}

export function priorityTint(score: number, range: PriorityScoreRange, opacity = 0.16) {
  const color = hexToRgb(priorityColor(score, range));
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(opacity)})`;
}

export function priorityOutlineColor(score: number, range: PriorityScoreRange) {
  return darkenHexColor(priorityColor(score, range), 0.28);
}

function normalizePriorityScore(score: number, range: PriorityScoreRange) {
  if (range.max === range.min) {
    return clamp(score / 100);
  }

  return clamp((score - range.min) / (range.max - range.min));
}

function interpolateHexColor(from: string, to: string, amount: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);

  return rgbToHex({
    r: Math.round(start.r + (end.r - start.r) * amount),
    g: Math.round(start.g + (end.g - start.g) * amount),
    b: Math.round(start.b + (end.b - start.b) * amount),
  });
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function darkenHexColor(hex: string, amount: number) {
  const color = hexToRgb(hex);
  const multiplier = 1 - clamp(amount);

  return rgbToHex({
    r: Math.round(color.r * multiplier),
    g: Math.round(color.g * multiplier),
    b: Math.round(color.b * multiplier),
  });
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}
