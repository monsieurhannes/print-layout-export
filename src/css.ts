import type { PrintSettings } from "./settings";
import type { Layout } from "./layout";

/** Static styles for every Markdown element Obsidian can produce. */
const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: #222;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

/* Headings and text */
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.2em 0 0.4em; }
h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }
h4, h5, h6 { font-size: 1.05em; }
p { margin: 0.6em 0; }
hr { border: 0; border-top: 1px solid #ccc; margin: 1.5rem 0; }
sup { font-size: 0.75em; line-height: 0; }

/* Links */
a { color: #5b4bc4; text-decoration: underline; text-underline-offset: 2px; }
a.internal-link, span.internal-link {
  color: inherit; text-decoration: none; border-bottom: 1px dotted #999;
}
a.tag {
  background: #ece9fb; color: #4a3fb0; padding: 0 0.35em;
  border-radius: 4px; text-decoration: none; font-size: 0.9em;
}

/* Highlights (==text==) */
mark { background: #fff3a3; color: inherit; padding: 0 0.15em; border-radius: 3px; }

/* Lists and task lists */
ul, ol { padding-left: 1.6em; margin: 0.4em 0; }
li { margin: 0.2em 0; }
li > ul, li > ol { margin: 0.15em 0; }
ul.contains-task-list { padding-left: 0.2em; }
li.task-list-item { list-style: none; }
input[type="checkbox"] { margin: 0 0.4em 0 0; vertical-align: middle; }

/* Tables */
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.95em; }
thead { display: table-header-group; }
th, td { border: 1px solid #d0d7de; padding: 0.4em 0.6em; text-align: left; vertical-align: top; }
th { background: #f6f8fa; font-weight: 600; }
tbody tr:nth-child(even) td { background: #fbfbfd; }

/* Code */
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.88em; background: #f3f3f5; padding: 0.1em 0.3em; border-radius: 4px;
}
pre {
  background: #f6f8fa; border: 1px solid #d0d7de; border-left: 4px solid #5b4bc4;
  border-radius: 6px; padding: 0.8rem 1rem; overflow-x: auto;
  font-size: 0.85em; line-height: 1.45; white-space: pre;
}
pre code { background: none; padding: 0; font-size: 1em; border-radius: 0; }
.copy-code-button { display: none; }

/* Blockquotes */
blockquote {
  margin: 1.2rem 0; padding: 0.8rem 1.2rem; background: #f7f5fd;
  border-left: 4px solid #5b4bc4; border-radius: 0 6px 6px 0;
  color: #333; font-style: italic;
}
blockquote p { margin: 0.4em 0; }
blockquote > :first-child { margin-top: 0; }
blockquote > :last-child { margin-bottom: 0; }
blockquote blockquote { background: #f0eef9; margin: 0.8rem 0 0; }

/* Callouts: > [!type] */
.callout {
  --c: #5b4bc4; --bg: #f7f5fd;
  border-left: 4px solid var(--c); background: var(--bg); border-radius: 6px;
  padding: 0.6rem 1rem; margin: 1rem 0; color: #222;
}
.callout-title { display: flex; align-items: center; gap: 0.4em; font-weight: 600; color: var(--c); }
.callout-icon { display: inline-flex; width: 1.1em; height: 1.1em; flex: 0 0 auto; }
.callout-icon svg { width: 100%; height: 100%; stroke: currentColor; }
.callout-content { margin-top: 0.4em; }
.callout-content > :first-child { margin-top: 0; }
.callout-content > :last-child { margin-bottom: 0; }
.callout[data-callout="note"], .callout[data-callout="info"], .callout[data-callout="todo"]
  { --c: #2f6fd6; --bg: #eef4fd; }
.callout[data-callout="tip"], .callout[data-callout="hint"], .callout[data-callout="important"]
  { --c: #0f8a7a; --bg: #eaf8f5; }
.callout[data-callout="success"], .callout[data-callout="check"], .callout[data-callout="done"]
  { --c: #2e8b3d; --bg: #eef8ef; }
.callout[data-callout="question"], .callout[data-callout="help"], .callout[data-callout="faq"]
  { --c: #b07a00; --bg: #fdf7e6; }
.callout[data-callout="warning"], .callout[data-callout="caution"], .callout[data-callout="attention"]
  { --c: #d9730d; --bg: #fdf0e4; }
.callout[data-callout="failure"], .callout[data-callout="danger"],
.callout[data-callout="error"], .callout[data-callout="bug"]
  { --c: #c0392b; --bg: #fdeeee; }
.callout[data-callout="example"] { --c: #7048c4; --bg: #f3effc; }
.callout[data-callout="quote"], .callout[data-callout="cite"] { --c: #666; --bg: #f5f5f5; }

/* Embedded notes (![[note]]) */
.markdown-embed {
  display: block; border-left: 3px solid #ccc; padding-left: 0.8rem; margin: 0.8rem 0;
}

/* Footnotes */
.footnotes {
  font-size: 0.85em; color: #555; margin-top: 2em; border-top: 1px solid #ddd; padding-top: 0.5em;
}

/* Math (MathJax output from Obsidian) */
mjx-container { max-width: 100%; overflow-x: auto; overflow-y: hidden; }
mjx-container[display="true"] { display: block; margin: 1em 0; text-align: center; }

/* Images and captions */
.caption {
  margin: 0.3rem 0 0; font-size: 0.85rem; color: #444; text-align: center;
}
.caption:empty::before {
  content: attr(data-placeholder); color: #aaa; font-style: italic;
}
.newpage { margin-top: 2.5rem; }
`;

export function buildCss(s: PrintSettings, L: Layout): string {
  const pageNumberRule = s.pageNumbers
    ? `
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: #666;
  }`
    : "";

  const linkUrlRule = s.showLinkUrls
    ? `
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.85em;
    color: #555;
    overflow-wrap: anywhere;
  }`
    : "";

  return `${BASE_CSS}
/* Image layout, generated from the plugin settings */
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${L.gapMm}mm;
  margin: 1rem 0 1.5rem;
}
.fig { margin: 0; max-width: 100%; }
.fig img { display: block; width: 100%; height: auto; border-radius: 6px; }
img.inline-img { display: inline-block; max-width: 100%; height: auto; border-radius: 6px; vertical-align: middle; }

/* Page setup */
@page {
  size: ${s.pageSize} ${s.orientation};
  margin: ${L.marginMm}mm ${L.marginMm}mm ${L.marginBottomMm}mm ${L.marginMm}mm;${pageNumberRule}
}

@media print {
  body { max-width: none; margin: 0; padding: 0; font-size: ${s.fontSizePt}pt; }
  .row { margin: 4mm 0; }
  .fig img, img.inline-img { border-radius: 0; }
  .caption:empty, .copy-code-button { display: none; }

  .newpage { break-before: page; page-break-before: always; margin-top: 0; }

  /* Never split images, figures, rows, code, quotes, callouts, tables or formulas */
  .row, .fig, pre, blockquote, .callout, table, tr, .math,
  mjx-container[display="true"] {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }

  pre { white-space: pre-wrap; overflow-wrap: anywhere; }
  blockquote { background: none; border-left: 3px solid #888; color: #000; }
  a { color: inherit; }
  a[href^="http"] { color: #1a4fbf; text-decoration: underline; }
  ${linkUrlRule}
}
`;
}