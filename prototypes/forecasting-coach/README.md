# Forecasting Coach local prototype

[Phase 2 scope and review](https://github.com/xiaominy2025/gpttutor-frontend/issues/16).

From this directory, use Node.js 20.19+ or 22.12+.

```powershell
npm ci
npm run dev
```

Open Vite’s loopback URL. Load a worksheet with headers on row 1 and one column each for time and numeric actuals. Select the cadence and first observation row. Generate a forecast, compare available methods, and export an Excel workbook with the historical series, selected forecast, diagnostic and available accuracy metrics. For a teaching example, choose **OCT sale data** in the Moving Average and Regression workbook. For monthly seasonality, enable **Consider monthly seasonality** and choose **Seasonal forecast** under Forecasting method.

## Validation

```powershell
$env:FORECASTING_WORKBOOK_DIR = 'C:/path/to/the/three/original/workbooks'
npm test
npm run build
```

The workbook tests read the original files from disk by their original names. Without the variable, the suite runs synthetic cases and skips the three workbook tests. Workbook files stay outside Git.

## Teaching methods and scope

- **Runs diagnostic.** Arithmetic mean, ties in the upper group, and one run plus sign changes. The workbook’s cumulative probability is shown as a normal CDF. The app adds a two-sided normal p-value when both groups exceed 10 and variance is positive. It uses a normal approximation with an absolute CDF error of about 8e-8 or less.
- **Moving average.** Previous actuals for one-step forecasting and recursive values for later steps. Tests reproduce the workbook’s common-window 2/3/4-period one-step MSEs. The live comparison uses common rolling forecast origins at the selected horizon, capped at the most recent 48 with at least three required. It ranks by MAE and also reports MSE. There is no model tuning or prediction interval.
- **Regression.** OLS fits elapsed days for dates and the numeric coordinate for consecutive periods. On the Module 6 series, the unrounded January 2018 prediction is 2,982.304 versus 2,983.181 with the workbook’s printed coefficients. Both are in thousands. Coefficient rounding can also cause small differences in the seasonal forecasts.
- **Seasonal forecast.** Center two adjacent 12-month means and divide actuals by that centered mean. Average eligible ratios by calendar month and multiply the full-precision raw-sales trend by the corresponding factor. The app keeps factors unnormalized. The teaching sample has one usable ratio per month and no seasonal backtest origins.

## Limitations and improvements for review

Monthly dates are normalized to the first of each month. Daily, weekly and consecutive numeric periods require contiguous values. Series need at least three observations. Multiplicative seasonality needs at least 24 positive contiguous monthly actuals. Text dates must be ISO calendar dates. Formula results must already be cached in Excel. Excel formulas and macros are never executed. File size is limited to 10 MB and the selected series to 5,000 observations. The prototype does not preflight expanded archive size or parse in a worker. Review parser hardening and performance before public release.

The comparison can be unavailable at long horizons or when an eligible seasonal method leaves too few shared origins. Shorter horizons and additional history can help. A future version could add horizon-specific error summaries and accessible interactive chart inspection.

This standalone app runs without an API, authentication, paid AI, persistent storage, or cloud resources.
