
import type { PrintSettings } from "./settings";

/** Paper sizes in mm as [short side, long side]. */
const PAPER_MM: Record<PrintSettings["pageSize"], [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
};

/** Room under each image for its caption. */
const CAPTION_RESERVE_MM = 8;
/** Room in the bottom margin for page numbers. */
const PAGE_NUMBER_RESERVE_MM = 8;

export interface Layout {
  marginMm: number;
  marginBottomMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  textWidthMm: number;
  maxImageHeightMm: number;
  gapMm: number;
  portraitPerRow: number;
  landscapeWidthPercent: number;
}

export function computeLayout(s: PrintSettings): Layout {
  const [short, long] = PAPER_MM[s.pageSize];
  const portrait = s.orientation === "portrait";
  const pageWidthMm = portrait ? short : long;
  const pageHeightMm = portrait ? long : short;

  const marginBottomMm = s.marginMm + (s.pageNumbers ? PAGE_NUMBER_RESERVE_MM : 0);
  const textWidthMm = pageWidthMm - 2 * s.marginMm;
  const printableHeightMm = pageHeightMm - s.marginMm - marginBottomMm;

  // Upper limit for any single image, so it always fits on one page.
  const maxImageHeightMm =
    (printableHeightMm - CAPTION_RESERVE_MM) * (s.maxImageHeightPercent / 100);

  return {
    marginMm: s.marginMm,
    marginBottomMm,
    pageWidthMm,
    pageHeightMm,
    textWidthMm,
    maxImageHeightMm,
    gapMm: s.imageGapMm,
    portraitPerRow: s.portraitPerRow,
    landscapeWidthPercent: s.landscapeWidthPercent,
  };
}

/**
 * Width in mm for one image.
 * Portrait: $w = (W_{text} - g(n-1)) / n$. Landscape: a share of $W_{text}$.
 * If the height $w / aspect$ exceeds the limit, the width is reduced
 * so the aspect ratio is kept and the image fits on the page.
 */
export function imageWidthMm(aspect: number, landscape: boolean, L: Layout): number {
  let w = landscape
    ? L.textWidthMm * (L.landscapeWidthPercent / 100)
    : (L.textWidthMm - L.gapMm * (L.portraitPerRow - 1)) / L.portraitPerRow;

  if (w / aspect > L.maxImageHeightMm) {
    w = L.maxImageHeightMm * aspect;
  }
  return w;
}