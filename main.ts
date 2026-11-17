// Dip-Buy Bot v2 for make.fun btc-race-24h-20261117-0603.
//
// Strategy: long-only mean reversion on sharp one-hour drops of Coinbase
// Wrapped BTC (CBBTC) against USDC, traded minute by minute on the
// bars-replay harness.
//
//   - Entry: when the latest close is at least 1.0% below the close 60 bars
//     ago (a sharp one-hour drop), buy with all available cash. Two guards
//     keep it from catching a falling knife: no entry within 30 bars of a
//     stop-loss exit, and no entry while the 240-bar (4-hour) trend is
//     worse than -2.0%.
//   - Exit: sell the whole position when its value is 1.8% above its cost
//     (take profit) or 0.7% below its cost (stop loss).
//   - Every order caps slippage at 100 bps past the close it was decided on.
//   - No network, no wall clock, no environment reads: the only state is the
//     list of closes seen and the account the harness reports each batch, so
//     two executions on the same bars send the same orders.
//
// A full-size round trip pays about 26 bps in fees, slippage and price
// impact, so entries wait for a genuinely sharp drop rather than noise.

import { BPS, runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const DIP_BARS = 60;
const DIP_ENTRY_BPS = 100;
const TAKE_PROFIT_BPS = 180;
const STOP_LOSS_BPS = 70;
// No re-entry within this many bars of a stop-loss exit.
const COOLDOWN_BARS = 30;
// Skip entries while the trend over this many bars is worse than -TREND_MIN_BPS.
const TREND_BARS = 240;
const TREND_MIN_BPS = 200;
const MAX_SLIPPAGE_BPS = 100;
// Plain number copy of the SDK's bigint BPS, for the close comparison.
const BPS_NUM = 10000;

const closes: number[] = [];
// Bar index (closes.length) of the most recent stop-loss exit, for cooldown.
let lastSlBar = -100000;

await runBars({
  onBatch(state: BarsState, batch) {
    for (const bar of batch.bars) {
      if (bar.symbol === SYMBOL) closes.push(Number(bar.c));
    }
    if (state.warmingUp) return [];
    const held = state.positions.get(SYMBOL);
    if (held !== undefined) {
      const value = state.value(SYMBOL, held.qty);
      if (value * BPS >= held.cost * (BPS + BigInt(TAKE_PROFIT_BPS))) {
        const sell: SellInput = { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        return [sell];
      }
      if (value * BPS <= held.cost * (BPS - BigInt(STOP_LOSS_BPS))) {
        lastSlBar = closes.length;
        const sell: SellInput = { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        return [sell];
      }
      return [];
    }
    if (closes.length > DIP_BARS) {
      const now = closes[closes.length - 1];
      const then = closes[closes.length - 1 - DIP_BARS];
      const dipped = now * BPS_NUM <= then * (BPS_NUM - DIP_ENTRY_BPS);
      const cooledDown = closes.length - lastSlBar >= COOLDOWN_BARS;
      let trendOk = true;
      if (closes.length > TREND_BARS) {
        const trendThen = closes[closes.length - 1 - TREND_BARS];
        trendOk = now * BPS_NUM >= trendThen * (BPS_NUM - TREND_MIN_BPS);
      }
      if (dipped && cooledDown && trendOk) {
        const amount = state.cash;
        if (amount >= BigInt(state.hello.fees.min_notional_quote_units)) {
          const buy: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: MAX_SLIPPAGE_BPS };
          return [buy];
        }
      }
    }
    return [];
  },
});
