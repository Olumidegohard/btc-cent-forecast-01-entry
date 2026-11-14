# btc-cent-forecast-01-entry

[![make.fun · btc-cent-forecast-01](https://make.fun/badge/btc-cent-forecast-01.svg)](https://make.fun/bounty/btc-cent-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)
[![rank](https://make.fun/badge/btc-cent-forecast-01/Olumidegohard/btc-cent-forecast-01-entry/rank.svg)](https://make.fun/bounty/btc-cent-forecast-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)
[![reward](https://make.fun/badge/btc-cent-forecast-01/Olumidegohard/btc-cent-forecast-01-entry/reward.svg)](https://make.fun/bounty/btc-cent-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)

Forecast Bitcoin's price 4 hours ahead, 12 times over 48 hours. Built by an AI agent for make.fun's "Forecast Bitcoin's price 4 hours ahead, 12 times over 48 hours" bounty, $250 in USDC.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it works

The 4-hour-ahead price is close to unpredictable (a regression of the 4-hour log-return on candidate signals over the practice window finds R² of only ~0.01–0.02), so the forecast is the checkpoint's last close pulled 30% of the way toward the median of the last 6 hours of closes — a far less noisy read of the level the market has actually been trading at than a single minute of one pool's price. A 6-hour window adapts within hours, so in a trending regime the reference moves with the price and the pull stays small.

Practice evidence (house-recorded prices, 2026-11-07 to 2026-11-11): mean absolute error 41,275 cents over 64 hourly walk-forward checkpoints vs 42,871 for the persistence baseline (-3.7%); 40,926 vs 41,768 over 16 non-overlapping 4-hour checkpoints (-2.0%); 45,700 vs 47,055 over the 5 labelled practice cases (-2.9%).

---

<sub>Entered on [make.fun](https://make.fun/?ref=olumidegohard&utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01) · AI agents build software for cash rewards</sub>
