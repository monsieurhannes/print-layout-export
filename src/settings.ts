import { App, PluginSettingTab, Setting } from "obsidian";
import type PrintLayoutExportPlugin from "./main";

export type PageSize = "A4" | "A5" | "Letter" | "Legal";
export type Orientation = "portrait" | "landscape";

export interface PrintSettings {
  pageSize: PageSize;
  orientation: Orientation;
  marginMm: number;
  fontSizePt: number;
  pageNumbers: boolean;
  portraitPerRow: 1 | 2;
  landscapeWidthPercent: number;
  imageGapMm: number;
  maxImageHeightPercent: number;
  newPageBeforeHeading: boolean;
  showTitle: boolean;
  showLinkUrls: boolean;
  lang: string;
  exportFolder: string;
}

export const DEFAULT_SETTINGS: PrintSettings = {
  pageSize: "A4",
  orientation: "portrait",
  marginMm: 15,
  fontSizePt: 11,
  pageNumbers: true,
  portraitPerRow: 2,
  landscapeWidthPercent: 100,
  imageGapMm: 6,
  maxImageHeightPercent: 90,
  newPageBeforeHeading: true,
  showTitle: true,
  showLinkUrls: false,
  lang: "en",
  exportFolder: "Print exports",
};

export class PrintSettingsTab extends PluginSettingTab {
  plugin: PrintLayoutExportPlugin;

  constructor(app: App, plugin: PrintLayoutExportPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const save = () => this.plugin.saveSettings();

    const slider = (name: string, desc: string, min: number, max: number,
                    step: number, value: number, set: (v: number) => void) =>
      new Setting(containerEl).setName(name).setDesc(desc).addSlider((sl) =>
        sl.setLimits(min, max, step).setValue(value).setDynamicTooltip()
          .onChange(async (v) => { set(v); await save(); }));

    const toggle = (name: string, desc: string, value: boolean, set: (v: boolean) => void) =>
      new Setting(containerEl).setName(name).setDesc(desc).addToggle((t) =>
        t.setValue(value).onChange(async (v) => { set(v); await save(); }));

    const text = (name: string, desc: string, value: string, set: (v: string) => void) =>
      new Setting(containerEl).setName(name).setDesc(desc).addText((t) =>
        t.setValue(value).onChange(async (v) => { set(v); await save(); }));

    containerEl.createEl("h3", { text: "Paper" });

    new Setting(containerEl).setName("Page size").addDropdown((d) =>
      d.addOption("A4", "A4")
        .addOption("A5", "A5")
        .addOption("Letter", "US Letter")
        .addOption("Legal", "US Legal")
        .setValue(s.pageSize)
        .onChange(async (v) => { s.pageSize = v as PageSize; await save(); }));

    new Setting(containerEl).setName("Orientation").addDropdown((d) =>
      d.addOption("portrait", "Portrait")
        .addOption("landscape", "Landscape")
        .setValue(s.orientation)
        .onChange(async (v) => { s.orientation = v as Orientation; await save(); }));

    slider("Margin (mm)", "Applied to all sides. The bottom gets extra room for page numbers.",
      5, 30, 1, s.marginMm, (v) => { s.marginMm = v; });

    slider("Font size (pt)", "Body text size in print.", 8, 14, 0.5, s.fontSizePt,
      (v) => { s.fontSizePt = v; });

    containerEl.createEl("h3", { text: "Images" });

    new Setting(containerEl).setName("Portrait images per row").addDropdown((d) =>
      d.addOption("1", "1")
        .addOption("2", "2")
        .setValue(String(s.portraitPerRow))
        .onChange(async (v) => { s.portraitPerRow = Number(v) as 1 | 2; await save(); }));

    slider("Landscape width (% of text width)",
      "100 means a landscape image spans the width of two portrait images.",
      30, 100, 5, s.landscapeWidthPercent, (v) => { s.landscapeWidthPercent = v; });

    slider("Gap between images (mm)", "Horizontal and vertical space between images.",
      0, 15, 1, s.imageGapMm, (v) => { s.imageGapMm = v; });

    slider("Max image height (% of printable height)",
      "Images never exceed this share of the page, so they cannot split across pages.",
      50, 100, 1, s.maxImageHeightPercent, (v) => { s.maxImageHeightPercent = v; });

    containerEl.createEl("h3", { text: "Pages, text and links" });

    toggle("Page numbers", "Show \"page / total\" at the bottom centre.", s.pageNumbers,
      (v) => { s.pageNumbers = v; });

    toggle("New page before a heading that follows an image",
      "Keeps the image above the heading on the previous page.", s.newPageBeforeHeading,
      (v) => { s.newPageBeforeHeading = v; });

    toggle("Show note title", "Print the note name as the first heading.", s.showTitle,
      (v) => { s.showTitle = v; });

    toggle("Show link URLs in print", "Print external links as \"text (URL)\".", s.showLinkUrls,
      (v) => { s.showLinkUrls = v; });

    text("Document language", "Language code for the HTML, e.g. sv or en.", s.lang,
      (v) => { s.lang = v.trim() || "en"; });

    text("HTML export folder", "Vault folder for \"Export as HTML\". Created if it does not exist.",
      s.exportFolder, (v) => { s.exportFolder = v; });

    containerEl.createEl("p", {
      cls: "print-layout-export-warning",
      text: "Page numbers need a recent Chromium engine. If they are missing in Obsidian's print " +
        "dialog, use \"Export as HTML\" and print that file from Chrome, Edge or Firefox.",
    });
  }
}