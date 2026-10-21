import { Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, PrintSettings, PrintSettingsTab } from "./settings";
import { printDocument, saveDocument } from "./export";

export default class PrintLayoutExportPlugin extends Plugin {
  settings: PrintSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new PrintSettingsTab(this.app, this));

    this.addRibbonIcon("printer", "Print note (layout export)", () => this.printActive());

    this.addCommand({
      id: "print-active-note",
      name: "Print active note",
      callback: () => this.printActive(),
    });

    this.addCommand({
      id: "export-active-note-html",
      name: "Export active note as HTML",
      callback: () => this.exportActive(),
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private getActiveNote(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("No active note.");
      return null;
    }
    if (file.extension !== "md") {
      new Notice("The active file is not a Markdown note.");
      return null;
    }
    return file;
  }

  private async printActive(): Promise<void> {
    const file = this.getActiveNote();
    if (!file) return;
    try {
      await printDocument(this.app, file, this.settings);
    } catch (err) {
      console.error("Print Layout Export:", err);
      new Notice("Print export failed. See the developer console.");
    }
  }

  private async exportActive(): Promise<void> {
    const file = this.getActiveNote();
    if (!file) return;
    try {
      const path = await saveDocument(this.app, file, this.settings);
      new Notice(`Saved ${path}`);
    } catch (err) {
      console.error("Print Layout Export:", err);
      new Notice("HTML export failed. See the developer console.");
    }
  }
}