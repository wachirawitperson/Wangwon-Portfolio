# Wangwon Portfolio v1.0.0

**Wangwon Portfolio v1.0.0** is the official production release of the dedicated student portfolio PDF generator for teachers at **Ban Wangwon School (โรงเรียนบ้านวังวน)**.

---

### What the Application Does
Wangwon Portfolio is a lightweight, local-first web application that allows teachers to easily compile student information, activity photos, and school cover templates into standardized, print-ready A4 PDF portfolios, or export combined ZIP packages with sequentially renamed image files.

---

### Key Features
- **Student Profile & Portrait**: Input form with live Thai filename preview, inline validation, and 4:5 student photo integration.
- **Dynamic Middle Workspace**: Drag-and-drop ordering, 90° image rotation, replacement, duplication, deletion, and lightbox preview.
- **3 Cover Templates**: Minimal School, Modern Academic, and Colorful Portfolio — with custom cover image upload support.
- **School Watermark**: 9-point placement grid, opacity and scale sliders, and targeting options.
- **Print-Ready PDF Generation**: Accurate A4 sizing (portrait/landscape), Fit/Fill modes, and quality settings (150/200/300 DPI).
- **PDF + Images Package**: Single-click ZIP export containing the portfolio PDF and sequentially renamed activity images (`[Name]_01.jpg`).
- **Auto Save & Recovery**: IndexedDB-backed draft storage with automatic debounced saving and startup recovery dialog.
- **Wangwon Soft Theme**: Thoughtfully designed Light and Dark modes with zero theme flash (FOUC).

---

### Privacy Model
- **100% Client-Side**: All image decoding, canvas composition, PDF generation, and ZIP compression occur entirely in the user's browser.
- **Zero Server Uploads**: Student photos and names are never transmitted to any external backend, cloud service, or AI provider.
- **Browser-Isolated Drafts**: Saved drafts reside in the browser's local IndexedDB on that specific machine; no external sync is performed.

---

### Supported Image Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`, including transparency)
- WebP (`.webp`)
- BMP (`.bmp`, converted to standard JPEG on export)
- HEIC / HEIF (`.heic`, `.heif`, with browser-native / fallback decoding)

---

### Export Options
1. **สร้างไฟล์ PDF (PDF Export)**: Generates `[StudentName].pdf` ready for printing or digital distribution.
2. **ส่งออก PDF + รูปภาพ (ZIP Package)**: Bundles the PDF and all activity photos into `[StudentName]_Portfolio.zip` with organized naming.

---

### Known Limitations
- Heavy batches (more than 50–100 high-resolution images) may consume noticeable browser RAM on low-spec hardware.
- Drafts are stored in the local browser's IndexedDB and do not synchronize across different computers.
