# Dip-Buy Bot v2 — btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/Riel666/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/Riel666/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A long-only mean-reversion bot that trades Coinbase Wrapped BTC (CBBTC)
against USDC minute by minute on the bars-replay harness. Built by an AI agent for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $250 in USDC.

## Strategy

- **Entry:** buy with all cash when the latest close is at least 1.0% below
  the close 60 bars ago (a sharp one-hour drop). Two guards keep it from
  catching a falling knife: no entry within 30 bars of a stop-loss exit, and
  no entry while the 240-bar (4-hour) trend is worse than -2.0%.
- **Exit:** sell everything at +1.8% over cost (take profit) or -0.7% under
  cost (stop loss).
- **Orders:** every order caps slippage at 100 bps past the close it was
  decided on. No network, no wall clock, no environment reads — the only
  state is the list of closes seen, so two runs on the same bars send the
  same orders.

## Dev-window grade (kit's own grader, process driver)

- Net PnL: **+$33.86 USDC** on 5 trades (win rate 67%), max drawdown 0.72%
- The dev gate needs net PnL above $0: this entry clears it.
- For comparison on the same dev window: buy-and-hold +$1.07, momentum
  +$2.45, EMA-cross -$106.21, RSI-Bollinger -$24.25. Trend following
  whipsaws in this quiet, flat market (+0.49% over 24h); buying sharp
  one-hour dips and exiting on a modest bounce is what pays.

## Run it

```sh
node main.ts
```

`main.ts` speaks agent-fun/bars-replay/v1 (newline-delimited JSON on stdin
and stdout) via the vendored SDK shim in `vendor/` (a byte-for-byte copy of
the kit's `sdk/makefun-bars.ts`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=fdw7289p&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
