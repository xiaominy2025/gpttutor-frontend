import { advisorMockPlugin } from "./advisor-mock.js";

export default ({ command, mode, isPreview }) => {
  const alpha = (command === "build" || isPreview) && ["alpha-workspace", "advisor-alpha"].includes(mode);
  const home = alpha ? "/engent-alpha/" : "https://www.engentlabs.com/";
  const explore = alpha ? "/explore" : "https://www.engentlabs.com/explore";
  return {
    base: alpha ? "/engent-alpha/forecasting/" : "/",
    css: { postcss: { plugins: [] } },
    plugins: [{
      name: "forecasting-platform-links",
      transformIndexHtml: { order: "pre", handler: html => html
        .replaceAll("%VITE_FORECASTING_HOME%", home)
        .replaceAll("%VITE_FORECASTING_EXPLORE%", explore) }
    }, ...(command === "serve" && mode === "advisor-mock" ? [advisorMockPlugin()] : [])]
  };
};
