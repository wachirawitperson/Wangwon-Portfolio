# Changelog

All notable changes to the Wangwon Portfolio application are documented in this file.

## v1.0.0 — Production Release (2026-10-01)

Wangwon Portfolio v1.0.0 is the official release of the browser-based student portfolio PDF generator for teachers at Ban Wangwon School.

---

### Workspace
- Designed the **Wangwon Soft Workspace** layout with responsive sidebars and intuitive 3-step workflow navigator.
- Enforced strict page sequence architecture: Locked Front Cover (Page 1) → Dynamic Student Activity Pages (Pages 2..N-1) → Locked Back Cover (Page N).
- Implemented accessible modal foundations (Focus Trap, ESC key dismissal, WAI-ARIA compliance) and responsive bottom action toolbar.
- Responsive reflow tested across viewports: Desktop (1440px/1280px), Tablet (1024px/768px), and Mobile (390px/375px/320px) with zero horizontal overflow.

### Student Information
- Reactive two-way binding form covering prefix, first name, last name, grade level (Kindergarten 1–3, Primary 1–6), student roll number, and academic year.
- Live Thai filename generation with reactive preview badge (e.g. `ด.ช.สมชาย_ใจดี.pdf`).
- Optional 4:5 student portrait photo upload with cropping preview, replace, and remove capabilities.
- Robust form validation with inline accessible error badges and action gating for PDF/ZIP export.

### Image Management
- Multi-format client-side image intake supporting JPG, PNG, WebP, BMP, and HEIC/HEIF.
- Flexible import channels: Multi-file picker, Drag & Drop with visual dropzone feedback, and Clipboard Paste (Ctrl/Cmd+V) with input guard.
- Automatic image quality assessment with low-resolution warning badges for images under 1,200px longest edge.
- Exact fingerprint duplicate detection with interactive resolution modal ("ข้ามภาพที่ซ้ำ" vs "นำเข้ารูปซ้ำทั้งหมด").
- Full card-level activity management: 90° clockwise rotation steps, reorder (Move Earlier / Later / drag), replace, duplicate, delete confirmation, and large Lightbox preview.
- Rigorous memory management revoking object URLs on image deletion, replacement, and workspace reset.

### Cover Generator
- HTML5 Canvas-based cover generation rendering print-ready A4 resolution (1240×1754 portrait, 1754×1240 landscape).
- 3 distinct official cover templates:
  - **Minimal School**: Formal academic layout with dark blue accents and official emblem.
  - **Modern Academic**: Contemporary grid layout with subtle geometric styling.
  - **Colorful Portfolio**: Vibrant creative layout designed for student activities.
- Custom Front Cover and Back Cover image upload support with aspect ratio mismatch warnings and independent reset to template generation.
- Dynamic Thai typography font scaling for long student names and automatic student photo / neutral silhouette fallback integration.

### Themes
- Persistent **Light** and **Dark** themes built on semantic CSS custom properties (Design Tokens).
- Synchronous zero-FOUC initialization script preventing theme flashing on page load.
- Independent Canvas rendering ensuring cover generation and export outputs remain unaffected by UI theme.
- Ban Wangwon School emblem preserved without color inversion or filter distortion across both themes.

### Watermark
- Configurable watermark engine supporting official school logo preset and custom watermark image upload.
- Full positioning controls across a 9-point grid (top-left, center, bottom-right, etc.).
- Fine-grained controls for opacity (10%–100%) and scale (10%–50%).
- Target scope selection: Activity images only (default), All pages, or Exclude covers.
- Page-relative positioning logic correctly handling rotated images.

### PDF Generation
- 100% client-side A4 PDF composition using `pdf-lib` ESM runtime and HTML5 Canvas.
- Strict paper sizing: 595.28 × 841.89 pt (portrait) and 841.89 × 595.28 pt (landscape).
- Image placement calculations for both **Fit** (aspect-ratio preservation) and **Fill** (edge-to-edge bleed).
- Configurable output quality tiers (small: 150 DPI, balanced: 200 DPI, high: 300 DPI).
- Official PDF metadata stamping (Title, Author: โรงเรียนบ้านวังวน, Subject, Creator).
- Export button progress feedback with real-time percentage indicators.

### Image Export
- Pure client-side batch exporter renaming student activity images into clean sequential filenames: `[StudentBaseName]_01.jpg`, `[StudentBaseName]_02.jpg`.
- Fast path preserving original bytes for unrotated JPG/PNG/WebP images.
- High-fidelity Canvas rotation for oriented images while maintaining dimensions and PNG transparency.
- BMP-to-JPEG conversion and strict exclusion of student profile photos and loose cover pages.

### PDF + Images Package
- Bundled ZIP package export engine utilizing local `JSZip` ESM runtime.
- Structured directory hierarchy: `[StudentBaseName]_Portfolio.zip` containing a dedicated student folder.
- Path traversal defense sanitizing internal archive file paths.
- Atomic packaging guarantee preventing partial or corrupt downloads.
- Mutual exclusion export lock preventing simultaneous heavy PDF and ZIP jobs.

### Draft Recovery
- Local-first persistence using browser `IndexedDB` (`wangwon-portfolio-db`, schema version 1).
- Debounced autosave triggering on form input and workspace mutations.
- Binary persistence storing Blobs directly without stale Object URLs.
- Startup Recovery Modal detecting existing drafts with summary preview and explicit user choice: "ทำงานต่อ" (Continue) or "เริ่มใหม่" (Start Fresh).
- Clean discard confirmation and workspace reset wiping draft data while preserving user theme preference.

### Privacy & QA
- **Zero outbound network calls**: 100% verified local-first operation without server dependencies.
- 171 automated test definitions (342 test executions across Desktop Chromium and Mobile Chrome) with 100% pass rate.
- Automated secret and real-data audit confirming zero sensitive information in codebase.
