---
title: "visual.pdf — Visual Layer"
description: "visual.pdf is the human-readable PDF layer of an SDF document. Requirements for self-containment and security."
sidebar:
  label: "visual.pdf"
  order: 6
---

# visual.pdf — Visual Layer

`visual.pdf` is the human-readable layer of an SDF document. It provides backward compatibility with existing PDF-based workflows — any system that can display a PDF can display the visual layer of an SDF document without SDF-specific tooling.

---

## Purpose

The visual layer serves two purposes:

1. **Human readability.** People can view, print, and archive SDF documents using any PDF viewer. No SDF software is required to read the visual content.
2. **Backward compatibility.** Organizations that have not yet adopted SDF can receive `.sdf` files, extract the visual layer, and process it as a standard PDF — while forward-compatible systems automatically use `data.json`.

The visual layer does not replace the data layer. `data.json` is the authoritative business data. `visual.pdf` is the presentation of that data for human consumption.

---

## Requirements

### Valid PDF

`visual.pdf` MUST be a valid PDF file. Any PDF version is accepted in v0.1. Producers SHOULD use PDF 1.7 or later.

Consumers MUST verify that `visual.pdf` begins with a valid PDF header (`%PDF-`) before processing. An archive where `visual.pdf` is not a valid PDF SHOULD be reported to the operator; processing MAY continue at the consumer's discretion.

### Self-Contained

`visual.pdf` MUST be self-contained. All resources referenced in the PDF MUST be embedded within the file:

- **Fonts** — All fonts MUST be fully embedded. Subset embedding is acceptable. System font fallback MUST NOT be relied upon.
- **Images** — All images (raster and vector) MUST be embedded as PDF image XObjects or Form XObjects.
- **Color profiles** — ICC color profiles MUST be embedded if used.
- **Metadata** — Document metadata MAY be embedded as XMP.

`visual.pdf` MUST NOT reference any external resources. This includes:

- External font servers or font CDNs.
- External image URLs.
- External PDF streams or attachments.
- Any resource identified by a URI that requires network access.

**Why self-contained?** SDF documents must render identically offline, years or decades after creation. An external resource dependency makes rendering dependent on network availability and third-party persistence — both of which cannot be guaranteed over the lifespan of a legal or business document.

### No Executable Content

`visual.pdf` MUST NOT contain executable content. The following are explicitly forbidden:

- JavaScript (PDF JavaScript actions)
- AcroForm scripts
- PDF macros
- Launch actions
- URI actions that execute external applications
- OpenAction triggers

Producers MUST NOT embed any of the above. Consumers MUST NOT execute any scripts or actions found in `visual.pdf`, even if present. Consumer implementations SHOULD strip or disable JavaScript execution at the PDF rendering layer.

---

## Producer Responsibility

Producers are responsible for generating a conformant `visual.pdf`. The following PDF generation libraries are known to produce conformant output:

| Language | Library | Notes |
|----------|---------|-------|
| TypeScript / JavaScript | [pdf-lib](https://pdf-lib.js.org/) | Full font embedding support |
| Python | [reportlab](https://www.reportlab.com/) | Use `TTFont` for embedded fonts |
| Python | [fpdf2](https://py-fpdf2.readthedocs.io/) | Lightweight alternative |
| Java | [Apache PDFBox](https://pdfbox.apache.org/) | Enterprise-grade |

When using pdf-lib (the reference implementation for `@etapsky/sdf-kit`):

```typescript title="Embedded font example with pdf-lib"
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as fontkit from 'fontkit';
import { readFileSync } from 'fs';

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

// Embed a custom font — file bytes are bundled into the PDF
const fontBytes = readFileSync('./fonts/NotoSans-Regular.ttf');
const customFont = await pdfDoc.embedFont(fontBytes);

// Standard fonts (Helvetica, Times, Courier) are always embedded by pdf-lib
const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

const page = pdfDoc.addPage();
page.drawText('Invoice INV-2026-00142', { font: customFont, size: 16 });

const pdfBytes = await pdfDoc.save();
```

---

## Consumer Responsibility

Consumers that render `visual.pdf` MUST NOT execute any scripts found in the PDF, even if the PDF renderer supports JavaScript execution. The recommended approach is to configure the PDF renderer with JavaScript execution disabled.

```typescript title="Disabling JavaScript in a PDF renderer (conceptual)"
const renderer = new PDFRenderer({
  enableJavaScript: false,   // MUST be false
  enableForms: false,        // Recommended
  enableLinks: true,         // MAY be enabled for navigation links
});
```

Consumers that extract `visual.pdf` for display in a browser SHOULD use a renderer that operates in a sandbox (e.g., PDF.js in a Web Worker without filesystem access).

---

## Accessibility

`visual.pdf` SHOULD include PDF/UA (ISO 14289) metadata and tagged structure for screen reader compatibility. This is a recommendation, not a requirement, in v0.1.

Producers targeting government or regulated industries SHOULD implement:

- Tagged PDF structure (headings, paragraphs, tables, lists).
- Alternative text for images.
- Document language metadata in the XMP catalog.
- Reading order definition via the PDF structure tree.

---

:::caution
The visual layer and the data layer are independent representations of the same document. They are not guaranteed to be cryptographically bound to each other in v0.1 (Phase 1-3). In Phase 4 (digital signing), the `signature.sig` covers both layers. Before verifying a signature, consumers MUST NOT assume that `visual.pdf` and `data.json` represent the same information.
:::

---

## Compression

`visual.pdf` SHOULD use internal PDF compression (FlateDecode for content streams). Producers SHOULD NOT apply additional ZIP compression at the archive level for `visual.pdf`, since PDFs with compressed content streams see minimal benefit from further compression.

---

## File Size Guidance

`visual.pdf` MUST NOT exceed 50 MB (the per-entry size limit). For multi-page documents with embedded images, producers SHOULD:

- Use JPEG compression for photographic images (quality 75–85% is typically sufficient).
- Use lossless compression (PNG/FlateDecode) for diagrams, charts, and text-heavy graphics.
- Subset-embed fonts (include only the characters used in the document).
- Target a file size under 10 MB for typical business documents.
