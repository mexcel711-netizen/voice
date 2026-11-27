import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrayerTimesForDate, getNextPrayer } from './prayer';

test('calculatePrayerTimesForDate produces chronological daily prayer times for Lahore', () => {
  const day = calculatePrayerTimesForDate(
    31.5204,
    74.3587,
    new Date('2026-10-24T10:00:00Z'),
    'karachi',
    'hanafi'
  );
  assert.equal(day.date, '2026-10-24');
  assert.ok(day.fajr < day.sunrise);
  assert.ok(day.sunrise < day.zuhr);
  assert.ok(day.zuhr < day.asr);
  assert.ok(day.asr < day.maghrib);
  assert.ok(day.maghrib < day.isha);
  assert.ok(day.qiblaDegrees > 240 && day.qiblaDegrees < 280);
});

test('getNextPrayer selects the upcoming prayer after a given time', () => {
  const day = calculatePrayerTimesForDate(
    31.5204,
    74.3587,
    new Date('2026-10-24T00:00:00Z'),
    'karachi',
    'hanafi'
  );
  const justAfterZuhr = new Date(day.zuhr.getTime() + 60_000);
  const next = getNextPrayer(day, justAfterZuhr);
  assert.equal(next.key, 'asr');
  assert.ok(next.remainingMinutes >= 1);
});
