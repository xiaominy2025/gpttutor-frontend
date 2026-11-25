# Forecasting Coach Excel and PDF exports

Generate a forecast and then choose **Export Excel** or **Export PDF** in the project toolbar. Use your browser's **Save as PDF** destination for the report. Both exports run locally and use the current analysis. PDF includes only the Advisor draft associated with that forecast and business challenge.

An imported XLSX stays available for export in the current browser session. At export, Forecasting loads a fresh copy and appends its analysis sheets with collision-safe names. This retains worksheets, cells, formulas, cached values and formatting that ExcelJS supports. Features outside the ExcelJS round-trip model, such as some drawings, pivots or external link metadata, can be lost. Keep the original file.

JSON project files still contain selected observations and settings. Reopening a project recreates the forecast from those observations. Its Excel export documents that it includes selected data and analysis, with no original workbook available. The sample dataset also exports as an analysis-only workbook.

The Excel export distinguishes historical actuals, in-sample fitted values, rolling-origin errors and future forecasts. Only horizons with historical MAE have illustrative low and high planning estimates. The point forecast is the base estimate. The workbook contains results for the active method.

Scenario V0.92 supplied the browser print, conditional sections, stylesheet and toolbar icon patterns. Scenario V0.93 supplied the active-session workbook, collision handling and typed numeric export patterns. Forecasting uses its existing ExcelJS dependency and validated results.

For regression checks, run `node --test` from this directory. Set `FORECASTING_WORKBOOK_DIR` to the folder with the three teaching workbooks to include their reference checks.

The isolated Alpha release uses an explicit versioned HTML URL. The canonical Forecasting Alpha URL is its rollback destination. The export release requires no change to the AI alias, budget, credentials, routing, or live production workspace.
