# Real PDF Editor 📄✨

A production-grade, client-side PDF Editor built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **PDF.js**, and **pdf-lib**.

This is not a canvas screenshot tool or a UI mockup. It modifies and compiles **real binary PDF files** directly in the browser with 100% privacy (no server-side document upload required). Downloaded PDFs open flawlessly in Adobe Acrobat, Chrome PDF Viewer, Microsoft Edge, macOS Preview, and PDF.js.

---

## 🚀 Features

- **Real Binary PDF Editing**: Directly embeds text, annotations, shapes, images, signatures, and stamps into the PDF structure using `pdf-lib`.
- **Text Replacements**: Seamlessly cover original text with matching backgrounds and overlay new text in standard PDF fonts (Helvetica, Times Roman, Courier, etc.).
- **Interactive Move & Drag**:
  - Click & drag any text box or replacement anywhere on the canvas.
  - Floating `DRAG TO MOVE` visual handle badge.
  - Keyboard arrow nudge (`↑`, `↓`, `←`, `→` for 1 pt; `Shift + Arrow` for 10 pt).
  - Fine-grained numeric position inputs in the Properties panel.
- **Rotation Support**:
  - Instant page rotation (90° clockwise, 180° flip).
  - Handles rotated scanned PDFs with accurate coordinate mapping across 0°, 90°, 180°, and 270°.
- **High-DPI PDF Rendering**: High-fidelity canvas rendering powered by PDF.js.
- **Page Management**:
  - Drag-and-drop page reordering sidebar.
  - Add blank pages, duplicate pages, or delete pages.
- **Signatures & Images**: Draw or upload signatures and images with transparency support.
- **Shapes & Whiteout**: Add rectangles, circles, custom color fills, and whiteout boxes.
- **Undo / Redo & Keyboard Shortcuts**: Full snapshot history (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+S`, `Delete`, `Escape`).
- **Section 28 End-to-End Test Suite**: Automated verification script testing real text replacement, byte integrity, and PDF.js re-parsing.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **PDF Viewing & Text Extraction**: `pdfjs-dist`
- **PDF Manipulation & Compilation**: `pdf-lib`
- **Testing**: `tsx` + automated Section 28 verification script

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone git@github.com:vishurohilla319/PDF-EDITOR.git
cd PDF-EDITOR

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

### Running Automated Verification Tests

```bash
npm test
```

---

## 🔒 Privacy

All document processing, rendering, and PDF compilation take place **100% locally in your browser**. No document bytes are ever uploaded to an external server.

---

## 📄 License

MIT License.
