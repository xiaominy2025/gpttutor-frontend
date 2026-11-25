import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const office = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const relationships = "http://schemas.openxmlformats.org/package/2006/relationships";
const types = "http://schemas.openxmlformats.org/package/2006/content-types";
const descendants = (node, name) => Array.from(node.getElementsByTagNameNS("*", name));

function append(parent, name, attributes = {}, value) {
  const child = parent.ownerDocument.createElementNS(parent.namespaceURI, name);
  for (const [key, entry] of Object.entries(attributes)) child.setAttribute(key, entry);
  if (value !== undefined) child.textContent = value;
  parent.append(child);
  return child;
}

export function appendWorkbookAnalysis(bytes, analysis) {
  let expanded = 0;
  const parts = unzipSync(new Uint8Array(bytes), { filter: ({ originalSize }) => {
    expanded += originalSize;
    if (expanded > 64 * 1024 * 1024) throw Error("Workbook exceeds the Excel export expansion limit.");
    return true;
  } });
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  function parse(path) {
    if (!parts[path]) throw Error("Missing workbook part.");
    const xml = parser.parseFromString(strFromU8(parts[path]), "application/xml");
    if (descendants(xml, "parsererror").length) throw Error("Invalid workbook XML.");
    return xml;
  }
  const write = (path, xml) => { parts[path] = strToU8(serializer.serializeToString(xml)); };
  const workbookPath = "xl/workbook.xml";
  const relPath = "xl/_rels/workbook.xml.rels";
  const contentPath = "[Content_Types].xml";
  const workbook = parse(workbookPath);
  const rels = parse(relPath);
  const content = parse(contentPath);
  const sheets = descendants(workbook, "sheets")[0];
  const existing = descendants(sheets, "sheet");
  const names = new Set(existing.map(sheet => sheet.getAttribute("name").toLowerCase()));
  const relIds = new Set(descendants(rels, "Relationship").map(rel => rel.getAttribute("Id")));
  let next = Math.max(0, ...existing.map(sheet => Number(sheet.getAttribute("sheetId")))) + 1;
  const date1904 = ["1", "true"].includes(descendants(workbook, "workbookPr")[0]?.getAttribute("date1904"));
  const styleTarget = descendants(rels, "Relationship").find(rel => rel.getAttribute("Type").endsWith("/styles"))?.getAttribute("Target");
  let styles, stylePath, dateStyle;
  function dateStyleIndex() {
    if (dateStyle !== undefined) return dateStyle;
    stylePath = styleTarget?.startsWith("/") ? styleTarget.slice(1) : "xl/" + (styleTarget ?? "styles.xml");
    if (!parts[stylePath]) {
      if (styleTarget) throw Error("Missing workbook styles.");
      styles = parser.parseFromString(
        '<styleSheet xmlns="' + main + '"><fonts count="1"><font/></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>', "application/xml");
      let id = "rIdForecastStyles";
      while (relIds.has(id)) id += "_";
      relIds.add(id);
      append(rels.documentElement, "Relationship", { Id: id, Type: office + "/styles", Target: "styles.xml" });
      append(content.documentElement, "Override", { PartName: "/xl/styles.xml",
        ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" });
    } else {
      styles = parse(stylePath);
    }
    const xfs = descendants(styles, "cellXfs")[0];
    dateStyle = xfs.children.length;
    append(xfs, "xf", { numFmtId: 14, fontId: 0, fillId: 0, borderId: 0, xfId: 0, applyNumberFormat: 1 });
    xfs.setAttribute("count", xfs.children.length);
    return dateStyle;
  }
  for (const sheet of analysis.worksheets) {
    let name = sheet.name;
    for (let i = 2; names.has(name.toLowerCase()); i++) name = sheet.name + " (" + i + ")";
    names.add(name.toLowerCase());
    while (parts["xl/worksheets/sheet" + next + ".xml"] || relIds.has("rIdForecastReport" + next)) next++;
    const id = "rIdForecastReport" + next;
    const target = "worksheets/sheet" + next + ".xml";
    append(sheets, "sheet", { name, sheetId: next++ }).setAttributeNS(office, "r:id", id);
    append(rels.documentElement, "Relationship", { Id: id, Type: office + "/worksheet", Target: target });
    append(content.documentElement, "Override", { PartName: "/xl/" + target,
      ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" });
    const xml = document.implementation.createDocument(main, "worksheet");
    const root = xml.documentElement;
    if (sheet.views.length && descendants(workbook, "workbookView").length) {
      const view = append(append(root, "sheetViews"), "sheetView", { workbookViewId: 0 });
      append(view, "pane", { ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" });
    }
    const cols = append(root, "cols");
    sheet.columns.forEach(({ width }, i) => append(cols, "col", { min: i + 1, max: i + 1, width: width ?? 20, customWidth: 1 }));
    const data = append(root, "sheetData");
    sheet.eachRow(row => {
      const owner = append(data, "row", { r: row.number });
      row.eachCell(cell => {
        const value = cell.value;
        const output = append(owner, "c", { r: cell.address });
        if (value instanceof Date) {
          output.setAttribute("s", dateStyleIndex());
          append(output, "v", {}, value.getTime() / 86400000 + (date1904 ? 24107 : 25569));
        } else if (typeof value === "number" && Number.isFinite(value)) {
          append(output, "v", {}, value);
        } else if (typeof value === "boolean") {
          output.setAttribute("t", "b");
          append(output, "v", {}, Number(value));
        } else if (typeof value === "string") {
          output.setAttribute("t", "inlineStr");
          const text = append(append(output, "is"), "t", {}, value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""));
          text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
        }
      });
    });
    write("xl/" + target, xml);
  }
  if (styles) write(stylePath, styles);
  write(workbookPath, workbook);
  write(relPath, rels);
  write(contentPath, content);
  return zipSync(parts);
}
