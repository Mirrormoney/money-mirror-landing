// PATCH NOTE: Replace any `array.at(-1)` with:
// `arr.length ? arr[arr.length - 1] : 0`
// This prevents TS lib mismatch on Vercel builds.
// Example:
//   const lastAdjusted = adjustedTimeline.values.length ? adjustedTimeline.values[adjustedTimeline.values.length - 1] : 0;
//   <strong>{formatEUR(lastAdjusted)}</strong>
