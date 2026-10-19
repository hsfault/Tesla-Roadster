// Live Texas time for the hero readout ("21:14:07 CDT").
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
});

export function texasTime(date = new Date()) {
  const parts = fmt.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('hour')}:${get('minute')}:${get('second')} ${get('timeZoneName')}`;
}

export function timecode(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
