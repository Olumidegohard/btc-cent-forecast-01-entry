// btc-cent-forecast-01 entry (Node 22, standard library only).
//
// Forecast Bitcoin's price 240 minutes after each checkpoint.
//
// Model: the 4-hour-ahead price is close to unpredictable — a regression of
// the 4-hour log-return on candidate signals over the practice window finds
// R^2 of only ~0.01-0.02, so the honest forecast is the checkpoint price
// pulled part-way toward the level the market has actually been trading at.
// The pull is toward the median of the last 6 hours of closes:
//
//   guess = last + 0.30 * (median(last 360 closes) - last)
//
// Why the 6-hour median, and why 0.30:
//   - The checkpoint close is a single minute of one pool's price, read
//     every 2 seconds; a large trade can displace it for a moment, and the
//     median of the last 6 hours is a far less noisy read of the level.
//   - A 6-hour window adapts within hours, so in a trending regime the
//     reference falls (or rises) with the price and the pull stays small;
//     a 24-hour median lags a full day and, on the practice cases, pulls
//     the wrong way through a trend day.
//   - 0.30 sits on the regression estimate: an OLS of the 4-hour log-return
//     on log(median6 / last) over hourly walk-forward checkpoints in the
//     practice window gives a coefficient of 0.34, and 0.30 is the
//     mean-absolute-error plateau just below it (0.25-0.35 all score within
//     ~0.5% of each other; the sharper 0.5 peak on this one 4-day window
//     is not trusted). No other signal tested adds anything once this one
//     is in: the median 4-hour return over the window, 1-hour momentum and
//     the 24-hour deviation all have ~zero incremental R^2.
//
// Walk-forward evidence (practice window 2026-11-07 to 2026-11-11, prices
// the house recorded; the 5 labelled practice cases' actuals are the next
// case's checkpoint close, which the 6-case baseline's published loss of
// 44521.576667 cents corroborates):
//   - 64 hourly checkpoints:  MAE 41275 cents vs persistence 42871 (-3.7%)
//   - 16 non-overlapping 4h checkpoints: 40926 vs 41768 (-2.0%)
//   - 5 labelled practice cases p00-p04: 45700 vs 47055 (-2.9%)
//   Persistence ties the house baseline exactly and a tie takes no prize,
//   so a forecast must move; this one moves on the only signal that beats
//   persistence on every one of those three cuts.
//
// The program is a pure function of the case's prices: no network, no
// randomness, no clock reads, so two runs of a case write identical bytes.
// It reads $MAKEFUN_INPUT_DIR (else /input) and writes $MAKEFUN_OUTPUT_DIR
// (else /output), one <id>.out per <id>.in, exactly as the starter does:
//
//   mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The smallest positive price on the grid: one unit of its 5 decimals. */
const MIN_PRICE = 0.00001;
/** The largest grid price below the scorer's exclusive 10,000,000-dollar cap. */
const MAX_PRICE = 9_999_999.99999;

/** How many recent closes define the level: 6 hours of 1-minute closes. */
const LEVEL_WINDOW = 360;
/** Fraction of the gap between the last close and the level to close. */
const PULL = 0.3;

interface CaseMarket {
  id: string;
  prices: number[];
}

interface Case {
  markets: CaseMarket[];
}

/** x kept on the grid's 5 decimals and inside the scorer's (0, 10,000,000). */
const price5 = (x: number): number => Math.round(Math.min(MAX_PRICE, Math.max(MIN_PRICE, x)) * 1e5) / 1e5;

/** Median of a numeric array (sorted copy; the array is short). */
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) throw new Error('median of no prices');
  const mid = n >> 1;
  return n % 2 === 1 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/** The forecast for one market: last close pulled toward its 6-hour median. */
function forecast(m: CaseMarket): number {
  if (!Array.isArray(m.prices) || m.prices.length === 0) throw new Error(`market ${m.id} has no prices`);
  const last = m.prices[m.prices.length - 1] as number;
  if (typeof last !== 'number' || !Number.isFinite(last)) throw new Error(`market ${m.id}'s last price is not a finite number`);
  // Only the closes the level is taken from need to be finite: a single
  // non-finite close anywhere in the window would otherwise poison the
  // median into NaN and the output into an invalid case, silently. Fail
  // loudly instead, exactly as a missing or empty market does.
  const window = m.prices.slice(-LEVEL_WINDOW);
  for (const x of window) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error(`market ${m.id} has a non-finite price in its level window`);
  }
  const level = median(window);
  return price5(last + PULL * (level - last));
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Every case file, in name order, so two runs write the same bytes.
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (!Array.isArray(c.markets) || c.markets.length !== 1) throw new Error(`${file} does not hold exactly one market`);
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts: [{ case: id, price: forecast(c.markets[0] as CaseMarket) }] })}\n`);
}
