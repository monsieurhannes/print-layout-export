# Print Layout Export

An Obsidian plugin that prints or exports the active note as a print-ready page.

- Images are sized by their own proportions and are never split across pages.
- Portrait images sit two per row. Landscape images span the full text width.
- Page size, orientation, margins, font size and image rules are adjustable.
- External links stay clickable in the saved PDF.
- Page numbers appear at the bottom of each page ("2 / 5").
- A heading that follows an image can start a new page.
- Captions come from the image alias: `![[photo.jpg|Caption text]]`.

## Installation

### From a GitHub release (manual)

1. Go to the [latest release](https://github.com/your-user/print-layout-export/releases/latest).
2. Download `main.js`, `manifest.json` and `styles.css`.
3. Create the folder `<your vault>/.obsidian/plugins/print-layout-export/` and copy the three files in.
4. In Obsidian, open **Settings → Community plugins**, turn off Restricted mode, and enable **Print Layout Export**.

### From the community plugin list

Once the plugin is approved, search for "Print Layout Export" under **Settings → Community plugins → Browse**.

> Desktop only. Printing uses the desktop print dialog.

## Usage

| Action | How |
| --- | --- |
| Print the active note | Click the printer icon in the left ribbon, or run the command **Print active note** |
| Save the note as an HTML file | Run the command **Export active note as HTML**. The file goes to the folder set in the settings. |

### Saving as PDF

1. Run **Print active note**.
2. In the print dialog, set **Destination** to **Save as PDF**.
3. Set **Paper size** to **Default** and **Margins** to **Default**. The plugin sets both.
4. Turn **Headers and footers** off, so the browser's date and URL don't appear.
5. Turn **Background graphics** on, so callout and code colours print.

The PDF keeps its links. Open it in a PDF reader to check them.

## Settings

| Setting | Default | Effect |
| --- | --- | --- |
| Page size | A4 | A4, A5, US Letter or US Legal |
| Orientation | Portrait | Portrait or landscape |
| Margin (mm) | 15 | Margin on all sides. The bottom gets 8 mm more when page numbers are on. |
| Font size (pt) | 11 | Body text size in print |
| Portrait images per row | 2 | 1 or 2 portrait images side by side |
| Landscape width (% of text width) | 100 | 100 spans the width of two portrait images |
| Gap between images (mm) | 6 | Space between images in a row |
| Max image height (% of printable height) | 90 | Upper limit for any image, so it stays on one page |
| Page numbers | On | "page / total" at the bottom centre |
| New page before a heading that follows an image | On | Starts a new printed page before that heading |
| Show note title | On | Prints the note name as the first heading |
| Show link URLs in print | Off | Adds the URL after each external link |
| Document language | en | `lang` attribute of the HTML, used for hyphenation and spell checking |
| HTML export folder | Print exports | Vault folder for the HTML export |

## How the image layout works

- **Text width:** $W_{text} = W_{page} - 2m$, with $m$ as the margin.
- **Portrait image:** $w = \dfrac{W_{text} - g(n-1)}{n}$, with $g$ as the gap and $n$ as images per row.
- **Landscape image:** $w = W_{text} \cdot p$, with $p$ as the landscape percentage.
- **Height limit:** $H_{max} = (H_{page} - m - m_{bottom} - 8\text{ mm}) \cdot q$, with $q$ as the max-height percentage and 8 mm reserved for the caption.
- **Final width:** if $w / a > H_{max}$, where $a$ is the aspect ratio, then $w = H_{max} \cdot a$. The image is smaller, but it keeps its proportions and fits on one page.

Images, rows, code blocks, quotes, callouts, tables and formulas all have `break-inside: avoid`.

## Markdown support

| Obsidian syntax | Output |
| --- | --- |
| `# Heading` to `###### Heading` | `<h1>` to `<h6>` |
| `**bold**`, `*italic*`, `~~strike~~` | Standard inline formatting |
| `==highlight==` | `<mark>` with a yellow background |
| `#tag` | `a.tag` badge |
| `[[Note]]`, `[[Note\|alias]]` | Styled text. Static files have no note targets. |
| `[text](https://…)` and bare URLs | Clickable links, kept in the PDF |
| `![[image.jpg]]` | Embedded image, sized and placed by the layout rules |
| `![[image.jpg\|Caption]]` | Same, with the caption under the image |
| `![[image.jpg\|300]]` | Size values are ignored. Layout comes from the settings. |
| `![[OtherNote]]` | Rendered inline, styled as `.markdown-embed` |
| `- [ ]` / `- [x]` | Task lists with checkboxes, no bullets |
| `1. item` and nested lists | Standard ordered and unordered lists |
| Tables | Bordered tables. The header repeats on each page. |
| `` `inline code` `` | `<code>` |
| Fenced code blocks | `<pre><code>`, with scrolling for long lines in the browser. In print, long lines wrap. |
| `> quote` | Blockquote with a coloured left border |
| `> [!note]`, `> [!warning]`, … | Callout, coloured per type. Common types: note, info, tip, success, question, warning, failure, danger, example, quote. |
| `$x^2$` and `$$…$$` | Math rendered by Obsidian's MathJax |
| `[^1]` footnotes | Footnote markup, with a separator line |
| `---` | Horizontal rule |
| YAML frontmatter | Removed |
| `%%comment%%` | Removed |

## Captions

Put the caption after a pipe in the embed:

```markdown
![[IMG_20251110_080159.jpg|Ipren i sminkväskan]]
```

The caption is also placed in the `<figcaption>` element, so you can edit it in the exported HTML file. Empty captions show nothing in print.

## Known limitations

- **Desktop only.** The plugin uses the desktop print dialog and writes files to the vault.
- **Page numbers depend on the browser engine.** They need CSS margin boxes, which Chromium supports from version 131. If the numbers are missing in Obsidian's print dialog, export the HTML and print that file from Chrome, Edge or Firefox.
- **Light theme only.** The export does not use your Obsidian theme.
- **Internal links are not clickable.** A static file has no other notes to link to.
- **Very tall code blocks or callouts** can still break across pages, because a block that is taller than a page must split.
- **Mermaid diagrams, Canvas, PDF embeds and plugin-specific blocks** are not supported.
- **Remote images** are loaded from the web when the document opens.
- **Image size values** like `|300` are ignored.

## Development

Requires Node.js 18 or newer.

```bash
git clone https://github.com/your-user/print-layout-export.git
cd print-layout-export
npm install
npm run dev        # rebuild on change
npm run build      # type check and production build
```

To test in a vault, link the folder into `<vault>/.obsidian/plugins/print-layout-export`. Use a test vault if the real vault is synced.

### Project layout

| File | Purpose |
| --- | --- |
| `src/main.ts` | Plugin entry point, commands, ribbon icon |
| `src/settings.ts` | Settings type, defaults and the settings tab |
| `src/layout.ts` | Paper sizes and image size calculations |
| `src/css.ts` | Print and screen CSS, generated from the settings |
| `src/render.ts` | Note rendering, image inlining and image grouping |
| `src/export.ts` | HTML document, print dialog and HTML file export |

## Releasing

1. Update `version` in `manifest.json` and `package.json`.
2. Add the new version to `versions.json`, for example `"1.1.0": "1.4.0"`.
3. Commit, tag and push. The tag must match the version exactly, without a `v`.

```bash
git add .
git commit -m "Release 1.1.0"
git tag 1.1.0
git push origin main --tags
```

The GitHub Action in `.github/workflows/release.yml` builds the plugin and attaches `main.js`, `manifest.json` and `styles.css` to the release.

## License

MIT