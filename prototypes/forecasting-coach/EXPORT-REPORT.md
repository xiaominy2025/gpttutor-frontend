# Forecasting Coach Excel and PDF exports

Generate a forecast and then choose **Export Excel** or **Export PDF** in the project toolbar. Use your browser's **Save as PDF** destination for the report. Both exports run locally and use the current analysis. PDF includes only the Advisor draft associated with that forecast and business challenge.

An imported XLSX stays available for export in the current browser session. Forecasting appends its analysis sheets directly to the XLSX package with collision-safe names. It preserves the original worksheet and table files, formulas, cached values, and formatting definitions. It updates the workbook sheet list, relationships, content types, and adds a date format when needed. Keep the original file if it is digitally signed, since changing a signed package invalidates its signature.

JSON project files still contain selected observations and settings. Reopening a project recreates the forecast from those observations. Its Excel export documents that it includes selected data and analysis, with no original workbook available. The sample dataset also exports as an analysis-only workbook.

The Excel export distinguishes historical actuals, in-sample fitted values, rolling-origin errors and future forecasts. Only horizons with historical MAE have illustrative low and high planning estimates. The point forecast is the base estimate. The workbook contains results for the active method.

Scenario V0.92 supplied the browser print, conditional sections, stylesheet and toolbar icon patterns. Scenario V0.93 supplied the workbook package append, collision handling and typed numeric export patterns. Forecasting uses ExcelJS for import and analysis-only exports.

For regression checks, run `node --test` from this directory. Set `FORECASTING_WORKBOOK_DIR` to the folder with the three teaching workbooks to include their reference checks.

The isolated Alpha release uses an explicit versioned HTML URL. The canonical Forecasting Alpha URL is its rollback destination. The export release requires no change to the AI alias, budget, credentials, routing, or live production workspace.
