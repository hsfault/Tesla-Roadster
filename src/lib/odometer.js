// Odometer maths: per-digit roll positions with carry, so a continuously changing value rolls like a real counter.

/**
 * @param {number} value      the number to show
 * @param {number} intDigits  number of integer digit columns
 * @param {number} decimals   number of decimal digit columns
 * @returns {number[]} roll position (0–10) for each column, most significant first
 */
export function rollPositions(value, intDigits, decimals) {
  const total = intDigits + decimals;
  const scaled = Math.max(0, value) * Math.pow(10, decimals);
  const out = new Array(total);
  let lower = 0;
  for (let i = 0; i < total; i++) {
    const x = scaled / Math.pow(10, i);
    const d = Math.floor(x) % 10;
    const pos = i === 0 ? d + (x - Math.floor(x)) : d + Math.max(0, lower - 9);
    out[total - 1 - i] = pos;
    lower = pos;
  }
  return out;
}

export function formatNumber(value, decimals = 0) {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
