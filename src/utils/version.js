/**
 * Learn-O-Pia Version System
 * Structure: YY.MM.DD.HH.MM
 * e.g. 26.10.22.05.08 (Year 26, Month 10, Day 22, Hour 05, Minute 08)
 */
export const APP_VERSION = '26.10.22.10.45';
export const APP_BUILD_DATE = '2026-10-22';
export const APP_CODENAME = 'Study Studio';

/**
 * Generates dynamic version string matching YY.MM.DD.HH.MM format
 */
export function getFormattedVersion(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yy}.${mm}.${dd}.${hh}.${min}`;
}
