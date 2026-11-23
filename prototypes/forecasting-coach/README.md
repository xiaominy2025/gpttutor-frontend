# Forecasting Coach local prototype

[Phase 2 scope and review](https://github.com/xiaominy2025/gpttutor-frontend/issues/16).

The [platform contract and project schema](PLATFORM-CONTRACT.md) describe local behavior and the pending shared account integration.

The [AI Management Advisor pilot plan](MANAGEMENT-ADVISOR-PILOT.md) describes the proposed shared API, approval sequence, and costs. Regular dev and production builds leave the Advisor inactive. Use `npm.cmd run dev -- --mode advisor-mock --port 4196 --strictPort` after stopping any server on that port to exercise the deterministic local mock.

From this directory, use Node.js 20.19+ or 22.12+.

```powershell
npm.cmd ci
npm.cmd run dev -- --port 4196 --strictPort
```

Open [http://127.0.0.1:4196/](http://127.0.0.1:4196/). Select **Upload Excel workbook**, or use **Try with sample data** to load 36 synthetic monthly demand observations. Generate a moving-average forecast and find Low, Base, and High immediately below the chart. Switch to **Linear Regression** for the multi-period forecast and read **Historical Patterns & Business Implications**. Open **Statistical Details** for the p-values, assumptions, and historical accuracy by lead time. Resize the browser with a forecast open and use the information icons with hover, tap, or keyboard.

Use **Show Data Table** to inspect the original observations before or after forecasting. A successful forecast collapses **Explore Historical Data**. The timeline in **Forecast** starts at the first forecast in a new or restored project. Use Home or End to move across actual observations and forecasts, or select a position with the pointer or touch. Collapse and reopen **Forecast** to check that the selected period stays in place. Use the **Save Project** and **Open Project** icons to restore a JSON project without the original workbook. **Export forecast results to Excel** downloads every forecast period, including Low and High where supported. Both formats preserve the text from **Communicate**.

## Student acceptance review

These workbooks should detect **Monthly** under Data Frequency. Use **Forecasting approach** to select a method directly or override a recommendation.

In **Define Goal**, check the detected frequency and the complete-observation count after choosing a forecast frequency and confirming any aggregation. In **Select Forecasting Approach**, choose **Moving Average** and compare the three lowest-MSE windows. In Manual mode, select a window outside the table and check that its MSE is shown below it. Switch to Auto and back to verify that the manual choice is remembered. A comparison with fewer than ten common forecasts shows a small-sample warning. If the comparison cannot score even five common forecasts, Moving Average does not select a window automatically.

- **Runs test workbook.** Select **Correlated sales Strong**, use columns A and B, and set **Observations begin on row** to 3. Choose **Linear Regression** and generate. Look for **Very Strong** runs-test evidence under **Historical Patterns & Business Implications**. Open **Statistical Details** to see 22 runs and a two-sided p-value near 0.0000125. Switch to **Correlated sales weak**, reset the first observation row to 3 if needed, and compare its 2 runs with essentially the same two-sided p-value.
- **Moving Average and Regression workbook.** Choose **OCT sale data**, columns A and B, first observation row 2. Select **Moving average**, then **Manual** and window 3. Expect January 2018 at about 2,862.250 and a single forecast row. Select **Linear regression** and check January 2018 at about 2,982.304 with six forecast periods by default.
- **Seasonal workbook.** Choose **Raw data**, columns A and B, first observation row 2. Select **Seasonal Forecasting** and confirm the 12-month default horizon. Check the highest and lowest estimated seasonal indices in **Interpret & Communicate**. In **Statistical Details**, compare the January–December indices and open **Seasonal calculation details** to check the single historical ratio used for each month. Accuracy is unavailable for this seasonal comparison with just 24 observed months.

Check that changing methods updates the interpretation with the same decision objective. Moving average compares the latest actual to the next-period forecast. Regression measures change across forecast endpoints, or from the latest fitted value for a one-period horizon. Enter a decision reflection and reopen the Excel export to verify the reflection, dates and chosen method.

## Validation

```powershell
$env:FORECASTING_WORKBOOK_DIR = 'C:/path/to/the/three/original/workbooks'
npm test
npm run build
```

The workbook tests read the original files from disk by their original names. Without the variable, the suite runs synthetic cases and skips the three workbook tests. Workbook files stay outside Git.

For the automated desktop and mobile checks, install the parent frontend's development dependencies and have Chrome installed. Run `node check-interface.cjs` from this directory. You can also set `PLAYWRIGHT_MODULE` to an existing Playwright installation and `FORECASTING_SCREENSHOT_DIR` to an existing output directory.

## Teaching methods and scope

- **Runs diagnostic.** Arithmetic mean, ties in the upper group, and one run plus sign changes. The workbook’s cumulative probability is shown as a normal CDF. The app adds a two-sided normal p-value when both groups exceed 10 and variance is positive. It uses a normal approximation with an absolute CDF error of about 8e-8 or less.
- **Moving average.** The student interface uses actuals for the next period only. Recursive values remain in the legacy workbook validation path. Auto selects the lowest one-period MSE on common targets, and Manual uses the same eligible set. Moving-average accuracy uses that same evaluation sample. Because Auto chooses a window using these errors, its reported MSE and MAE are descriptive rather than an independent assessment of the window selection. MSE is rounded only for display.
- **Regression.** OLS fits elapsed days for dates and the numeric coordinate for consecutive periods. On the Module 6 series, the unrounded January 2018 prediction is 2,982.304 versus 2,983.181 with the workbook’s printed coefficients. Both are in thousands. Coefficient rounding can also cause small differences in the seasonal forecasts.
- **Seasonal forecast.** Center two adjacent 12-month means and divide actuals by that centered mean. Average eligible ratios by calendar month and multiply the full-precision raw-sales trend by the corresponding factor. The app keeps factors unnormalized. The teaching sample has one usable ratio per month and no seasonal backtest origins.

## Limitations and improvements for review

Data Frequency is inferred from contiguous daily, weekly, monthly, quarterly, annual, or consecutive numeric observations. Coarser calendar periods require explicit aggregation and omit incomplete periods with a notice. Weekly observations stay weekly because a calendar boundary may split the source period. Irregular dated series require correction before forecasting. Series need at least three observations. Multiplicative seasonality needs at least 24 positive contiguous monthly actuals. Text dates must be ISO calendar dates. Formula results must already be cached in Excel. Excel formulas and macros are never executed. File size is limited to 10 MB and the selected series to 5,000 observations. The prototype does not preflight expanded archive size or parse in a worker. Review parser hardening and performance before public release.

Recommend starts with a moving average for one period when an eligible window exists, and linear regression otherwise. Students can choose seasonal forecasting when an annual pattern is relevant. The results show only errors for the selected method. Regression and seasonal error evaluations use up to 48 historical origins per lead time and need at least three known outcomes per lead. Longer forecast horizons can lack enough historical outcomes. Planning scenarios are illustrative forecast ± matching historical MAE, without probabilities or guaranteed bounds.

This standalone app runs without an API, authentication, paid AI, persistent storage, or cloud resources.
