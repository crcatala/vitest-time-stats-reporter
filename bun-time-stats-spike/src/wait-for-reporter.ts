export {};

const readyUrl = process.env.BUN_TIME_STATS_READY_URL;
if (readyUrl) await fetch(readyUrl);
