import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';
import type { AsrMethod, PrayerCalculationMethod } from '../types/db';

export interface CityPreset {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { city: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
  { city: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { city: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi' },
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { city: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
];

export interface CalculatedPrayerDay {
  date: string;
  fajr: Date;
  sunrise: Date;
  zuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  qiblaDegrees: number;
}

function toAdhanMethod(method: PrayerCalculationMethod) {
  switch (method) {
    case 'mwl':
      return CalculationMethod.MuslimWorldLeague();
    case 'isna':
      return CalculationMethod.NorthAmerica();
    case 'egypt':
      return CalculationMethod.Egyptian();
    case 'makkah':
      return CalculationMethod.UmmAlQura();
    case 'karachi':
    default:
      return CalculationMethod.Karachi();
  }
}

export function calculatePrayerTimesForDate(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: PrayerCalculationMethod = 'karachi',
  asrMethod: AsrMethod = 'hanafi'
): CalculatedPrayerDay {
  const coords = new Coordinates(latitude, longitude);
  const params = toAdhanMethod(method);
  params.madhab = asrMethod === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const pt = new PrayerTimes(coords, date, params);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    zuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    qiblaDegrees: Math.round(Qibla(coords)),
  };
}

export type PrayerSlotKey = 'fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha';

export interface NextPrayerInfo {
  key: PrayerSlotKey;
  label: string;
  urduLabel: string;
  time: Date;
  remainingMinutes: number;
  remainingSeconds: number;
}

const PRAYER_META: Array<{ key: PrayerSlotKey; label: string; urduLabel: string }> = [
  { key: 'fajr', label: 'Fajr', urduLabel: 'فجر' },
  { key: 'zuhr', label: 'Dhuhr', urduLabel: 'ظہر' },
  { key: 'asr', label: 'Asr', urduLabel: 'عصر' },
  { key: 'maghrib', label: 'Maghrib', urduLabel: 'مغرب' },
  { key: 'isha', label: 'Isha', urduLabel: 'عشاء' },
];

export function getNextPrayer(day: CalculatedPrayerDay, now: Date = new Date()): NextPrayerInfo {
  for (const slot of PRAYER_META) {
    const time = day[slot.key];
    if (time.getTime() > now.getTime()) {
      const diffSec = Math.max(0, Math.floor((time.getTime() - now.getTime()) / 1000));
      return {
        key: slot.key,
        label: slot.label,
        urduLabel: slot.urduLabel,
        time,
        remainingMinutes: Math.floor(diffSec / 60),
        remainingSeconds: diffSec,
      };
    }
  }
  // Wrap to tomorrow Fajr (+24h estimate if next day isn't passed)
  const tomorrowFajr = new Date(day.fajr.getTime() + 24 * 60 * 60 * 1000);
  const diffSec = Math.max(0, Math.floor((tomorrowFajr.getTime() - now.getTime()) / 1000));
  return {
    key: 'fajr',
    label: 'Fajr (Tomorrow)',
    urduLabel: 'فجر',
    time: tomorrowFajr,
    remainingMinutes: Math.floor(diffSec / 60),
    remainingSeconds: diffSec,
  };
}
