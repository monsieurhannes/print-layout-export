import { App, TFile, normalizePath } from "obsidian";
import { buildCss } from "./css";
import { computeLayout } from "./layout";
import { renderNote } from "./render";
import type { PrintSettings } from "./settings";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds one complete, self-contained HTML document for the note. */
export async function buildDocument(app: App, file: TFile, s: PrintSettings): Promise<string> {
  const layout = computeLayout(s);
  const body = await renderNote(app, file, s, layout);
  const css = buildCss(s, layout);
  const title = escapeHtml(file.basename);
  const heading = s.showTitle ? `<h1>${title}</h1>\n` : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(s.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
${heading}${body.innerHTML}
</body>
</html>`;
}

/** Opens the system print dialog for the note. Choose "Save as PDF" there. */
export async function printDocument(app: App, file: TFile, s: PrintSettings): Promise<void> {
  const html = await buildDocument(app, file, s);

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "210mm",
    height: "297mm",
    border: "0",
  });

  const cleanup = () => frame.remove();

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    win.focus();
    win.print();
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);
  // Safety net in case "afterprint" never fires.
  window.setTimeout(() => { if (frame.isConnected) cleanup(); }, 10 * 60 * 1000);
}

/** Writes the note as a self-contained HTML file into the vault. */
export async function saveDocument(app: App, file: TFile, s: PrintSettings): Promise<string> {
  const html = await buildDocument(app, file, s);

  const folder = normalizePath(s.exportFolder.trim() || "Print exports");
  if (!app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder);
  }

  const path = normalizePath(`${folder}/${file.basename}.html`);
  await app.vault.adapter.write(path, html);
  return path;
}