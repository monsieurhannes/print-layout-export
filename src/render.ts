import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { Layout, imageWidthMm } from "./layout";
import type { PrintSettings } from "./settings";

const IMAGE_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
};

/** Renders the note with Obsidian's renderer and prepares the DOM for print. */
export async function renderNote(
  app: App,
  file: TFile,
  s: PrintSettings,
  layout: Layout,
): Promise<HTMLElement> {
  const source = await app.vault.read(file);
  const markdown = stripComments(stripFrontmatter(source));

  const host = document.createElement("div");
  const component = new Component();
  component.load();
  try {
    await MarkdownRenderer.render(app, markdown, host, file.path, component);
  } finally {
    component.unload();
  }

  flattenInternalLinks(host);
  await inlineImages(app, host, file.path);
  groupImages(host, s, layout);

  // Images that stayed in a text line keep their place and are limited by width only.
  host.querySelectorAll("img").forEach((img) => {
    if (!img.closest(".fig")) img.classList.add("inline-img");
  });

  return host;
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/** Obsidian comments (%%...%%) must not appear in print. */
function stripComments(md: string): string {
  return md.replace(/%%[\s\S]*?%%/g, "");
}

/** Internal [[links]] have no target in a static file, so they become plain styled text. */
function flattenInternalLinks(root: HTMLElement): void {
  root.querySelectorAll("a.internal-link").forEach((a) => {
    const span = document.createElement("span");
    span.className = "internal-link";
    span.textContent = a.textContent;
    a.replaceWith(span);
  });
}

/** Replaces vault images with data URIs and records each image's aspect ratio. */
async function inlineImages(app: App, root: HTMLElement, sourcePath: string): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));

  for (const img of imgs) {
    const file = findImageFile(app, img, sourcePath);
    const mime = file ? IMAGE_MIME[file.extension.toLowerCase()] : undefined;

    if (file && mime) {
      const data = await app.vault.readBinary(file);
      img.src = `data:${mime};base64,${arrayBufferToBase64(data)}`;
      img.removeAttribute("srcset");
      img.dataset.caption = captionFor(img, file);
    }

    if (!img.dataset.aspect) {
      const dims = await measure(img.src);
      if (dims) img.dataset.aspect = String(dims.w / dims.h);
    }
  }
}

function findImageFile(app: App, img: HTMLImageElement, sourcePath: string): TFile | null {
  // 1) Obsidian keeps the link text on the embed wrapper, e.g. <span class="internal-embed" src="photo.jpg">
  const link = img.closest(".internal-embed")?.getAttribute("src");
  if (link) {
    const target = link.split("|")[0].split("#")[0];
    const file = app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (file) return file;
  }

  // 2) Fall back to the app:// URL, which contains the vault path.
  try {
    const path = decodeURIComponent(new URL(img.getAttribute("src") ?? "").pathname).replace(/^\//, "");
    const file = app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) return file;
  } catch {
    // Not a vault URL, so it is not a vault file.
  }
  return null;
}

/** Caption from the alias: ![[photo.jpg|My caption]]. Sizes and file names are ignored. */
function captionFor(img: HTMLImageElement, file: TFile): string {
  const alt = (img.getAttribute("alt") ?? "").trim();
  if (!alt || alt === file.name || alt === file.basename || /^\d+(x\d+)?$/.test(alt)) return "";
  return alt;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function measure(src: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      const w = probe.naturalWidth;
      const h = probe.naturalHeight;
      resolve(w > 0 && h > 0 ? { w, h } : null);
    };
    probe.onerror = () => resolve(null);
    probe.src = src;
  });
}

/**
 * Turns image-only paragraphs into rows of figures.
 * Consecutive image blocks share one row. A heading after an image row can start a new page.
 */
function groupImages(parent: Element, s: PrintSettings, layout: Layout): void {
  let row: HTMLElement | null = null;
  let afterImages = false;

  for (const child of Array.from(parent.children)) {
    if (isImageBlock(child)) {
      if (!row) {
        row = parent.ownerDocument.createElement("div");
        row.className = "row";
        parent.insertBefore(row, child);
      }
      for (const img of Array.from(child.querySelectorAll("img"))) {
        row.appendChild(makeFigure(img, layout));
      }
      child.remove();
      afterImages = true;
      continue;
    }

    if (afterImages && s.newPageBeforeHeading && /^H[1-6]$/.test(child.tagName)) {
      child.classList.add("newpage");
    }

    row = null;
    afterImages = false;
    groupImages(child, s, layout);
  }
}

/** True if the block holds only images, line breaks and whitespace. */
function isImageBlock(el: Element): boolean {
  if (el.tagName !== "P" && el.tagName !== "DIV") return false;
  if (!el.querySelector("img")) return false;

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) return false;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;

    const tag = (node as Element).tagName;
    const cls = (node as Element);
    if (tag === "BR" || tag === "IMG") continue;
    if (tag === "SPAN" && cls.classList.contains("internal-embed") &&
        !cls.textContent?.trim() && cls.querySelector("img")) continue;
    return false;
  }
  return true;
}

function makeFigure(img: HTMLImageElement, layout: Layout): HTMLElement {
  const doc = img.ownerDocument;
  const aspect = Number(img.dataset.aspect) || 1;
  const landscape = aspect > 1;
  const width = imageWidthMm(aspect, landscape, layout);

  const fig = doc.createElement("figure");
  fig.className = landscape ? "fig landscape" : "fig";
  fig.style.width = `${width.toFixed(1)}mm`;

  img.removeAttribute("class");
  fig.appendChild(img);

  const caption = doc.createElement("figcaption");
  caption.className = "caption";
  caption.dataset.placeholder = "Caption";
  if (img.dataset.caption) caption.textContent = img.dataset.caption;
  fig.appendChild(caption);

  return fig;
}