/**
 * PDF Generation Engine (Phase 9)
 *
 * Fully client-side A4 PDF composition engine using pdf-lib and HTML5 Canvas.
 * Produces crisp, print-ready student portfolio documents with:
 * - Page 1: Front Cover (generated template or custom)
 * - Pages 2..N-1: Student Activity Pages (with rotation, fit/fill, watermark)
 * - Page N: Back Cover (generated template or custom)
 *
 * Zero external network requests, zero server uploads. Complete privacy preservation.
 */
import {
  PDF_PAGE_POINTS,
  getPagePixelDimensions,
  renderActivityPageCanvas,
  renderCoverPageCanvas
} from './page-renderer.js';
import { loadWatermarkImage } from './watermark-renderer.js';
import { generatePdfFilename } from '../core/filename-utils.js';
import { getStudentDisplayName } from '../core/student-utils.js';

export { PDF_PAGE_POINTS };

/**
 * Helper to retrieve the global PDFLib object.
 * Falls back to global window.PDFLib or self.PDFLib provided by vendor/pdf-lib.min.js.
 */
function getPdfLib() {
  if (typeof window !== 'undefined' && window.PDFLib) {
    return window.PDFLib;
  }
  if (typeof self !== 'undefined' && self.PDFLib) {
    return self.PDFLib;
  }
  if (typeof globalThis !== 'undefined' && globalThis.PDFLib) {
    return globalThis.PDFLib;
  }
  throw new Error('PDFLib is not loaded. Please ensure vendor/pdf-lib.min.js is included.');
}

/**
 * Converts a Canvas to a JPEG or PNG Uint8Array.
 * Uses JPEG for maximum compression efficiency at selected quality, or PNG if specified.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} [format='image/jpeg']
 * @param {number} [quality=0.85]
 * @returns {Promise<Uint8Array>}
 */
export async function canvasToBytes(canvas, format = 'image/jpeg', quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          return reject(new Error('Failed to create Blob from page canvas'));
        }
        try {
          const arrayBuffer = await blob.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        } catch (err) {
          reject(err);
        }
      },
      format,
      quality
    );
  });
}

/**
 * Triggers a client-side download of a generated PDF Blob.
 *
 * @param {object} params
 * @param {Blob} params.blob - The PDF Blob
 * @param {string} params.filename - The download filename
 */
export function downloadGeneratedPdf({ blob, filename }) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid Blob provided to downloadGeneratedPdf');
  }

  const safeFilename = filename || 'portfolio-นักเรียน.pdf';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();

  // Defer cleanup to allow browser download pipeline to capture stream
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Generates the complete Portfolio PDF document from projectState.
 *
 * @param {object} projectState - Complete PortfolioProject state from store
 * @param {object} [options={}] - Options & callbacks
 * @param {function} [options.onProgress] - Progress callback: ({ phase, percent, current, total, message })
 * @param {AbortSignal} [options.signal] - Cancellation signal
 * @returns {Promise<{ bytes: Uint8Array, blob: Blob, filename: string, pageCount: number }>}
 */
export async function generatePortfolioPdf(projectState, options = {}) {
  const { onProgress, signal } = options;

  function reportProgress(phase, percent, current, total, message) {
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        phase,
        percent: Math.min(100, Math.max(0, Math.round(percent))),
        current: current || 0,
        total: total || 0,
        message: message || ''
      });
    }
  }

  function checkAborted() {
    if (signal && signal.aborted) {
      const err = new Error('PDF generation was cancelled');
      err.name = 'AbortError';
      throw err;
    }
  }

  checkAborted();
  reportProgress('preparing', 2, 0, 0, 'เตรียมความพร้อมเอกสาร...');

  const PDFLib = getPdfLib();
  const pdfDoc = await PDFLib.PDFDocument.create();

  // Extract settings from state
  const student = projectState?.student || {};
  const studentPhoto = projectState?.studentPhoto || null;
  const frontCover = projectState?.frontCover || { mode: 'generated', templateId: 'minimal-school' };
  const backCover = projectState?.backCover || { mode: 'generated', templateId: 'minimal-school' };
  const images = Array.isArray(projectState?.images) ? projectState.images : [];
  const watermark = projectState?.watermark || { enabled: false, sourceType: 'none' };
  const pdfSettings = projectState?.pdfSettings || {};

  const orientation = pdfSettings.orientation === 'landscape' ? 'landscape' : 'portrait';
  const placement = pdfSettings.placement === 'fill' ? 'fill' : 'fit';
  const quality = pdfSettings.quality || 'balanced';

  // Target PDF points & Canvas Pixel Dimensions
  const pointDims = PDF_PAGE_POINTS[orientation];
  const pixelDims = getPagePixelDimensions({ orientation, quality });

  // Preload watermark image once if enabled
  let preloadedWatermarkImg = null;
  if (watermark.enabled && watermark.sourceType !== 'none') {
    try {
      preloadedWatermarkImg = await loadWatermarkImage(watermark);
    } catch (wmErr) {
      console.warn('[Wangwon PDF] Watermark image failed to load, proceeding without watermark:', wmErr);
    }
  }

  checkAborted();

  // Total pages: Front Cover (1) + Activities (images.length) + Back Cover (1)
  const totalPages = 1 + images.length + 1;
  let currentPageIndex = 0;

  // Helper to embed and add a rendered canvas as a PDF page
  async function addCanvasToPdf(canvas) {
    checkAborted();
    // Convert to high-efficiency JPEG bytes
    const imgBytes = await canvasToBytes(canvas, 'image/jpeg', pixelDims.jpegQuality);
    checkAborted();

    const embeddedImage = await pdfDoc.embedJpg(imgBytes);
    const pdfPage = pdfDoc.addPage([pointDims.width, pointDims.height]);

    pdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pointDims.width,
      height: pointDims.height
    });

    // Explicitly release canvas memory
    canvas.width = 1;
    canvas.height = 1;
  }

  // 1. PAGE 1: FRONT COVER
  currentPageIndex++;
  const frontPercent = Math.round((currentPageIndex / totalPages) * 85);
  reportProgress('rendering-cover', frontPercent, currentPageIndex, totalPages, 'กำลังเรนเดอร์หน้าปกหน้า...');

  const frontCanvas = await renderCoverPageCanvas({
    type: 'front',
    coverState: frontCover,
    student,
    studentPhoto,
    orientation,
    pageWidth: pixelDims.width,
    pageHeight: pixelDims.height,
    watermarkState: watermark,
    watermarkImage: preloadedWatermarkImg
  });

  await addCanvasToPdf(frontCanvas);

  // 2. PAGES 2..N-1: ACTIVITY PAGES
  for (let i = 0; i < images.length; i++) {
    checkAborted();
    currentPageIndex++;
    const pageNum = i + 1;
    const progressPercent = Math.round((currentPageIndex / totalPages) * 85);
    reportProgress(
      'rendering-page',
      progressPercent,
      currentPageIndex,
      totalPages,
      `กำลังเรนเดอร์รูปผลงานที่ ${pageNum} จาก ${images.length}...`
    );

    const activityCanvas = await renderActivityPageCanvas({
      imageItem: images[i],
      pageWidth: pixelDims.width,
      pageHeight: pixelDims.height,
      placement,
      watermarkState: watermark,
      watermarkImage: preloadedWatermarkImg
    });

    await addCanvasToPdf(activityCanvas);
  }

  // 3. PAGE N: BACK COVER
  checkAborted();
  currentPageIndex++;
  const backPercent = Math.round((currentPageIndex / totalPages) * 85);
  reportProgress('rendering-cover', backPercent, currentPageIndex, totalPages, 'กำลังเรนเดอร์หน้าปกหลัง...');

  const backCanvas = await renderCoverPageCanvas({
    type: 'back',
    coverState: backCover,
    student,
    studentPhoto,
    orientation,
    pageWidth: pixelDims.width,
    pageHeight: pixelDims.height,
    watermarkState: watermark,
    watermarkImage: preloadedWatermarkImg
  });

  await addCanvasToPdf(backCanvas);

  // 4. METADATA & ASSEMBLY
  checkAborted();
  reportProgress('assembling', 90, totalPages, totalPages, 'กำลังใส่ข้อมูลเอกสารและประกอบไฟล์ PDF...');

  const studentName = getStudentDisplayName(student);
  const gradeText = student.grade ? ` ชั้น ${student.grade}` : '';
  const title = `แฟ้มสะสมผลงาน (Portfolio) - ${studentName}${gradeText}`;

  pdfDoc.setTitle(title);
  pdfDoc.setAuthor('โรงเรียนบ้านวังวน');
  pdfDoc.setSubject('แฟ้มสะสมผลงานนักเรียน โรงเรียนบ้านวังวน (Ban Wangwon School)');
  pdfDoc.setCreator('Wangwon Portfolio (ระบบสร้าง Portfolio นักเรียน โรงเรียนบ้านวังวน)');
  pdfDoc.setProducer('pdf-lib (https://github.com/Hopding/pdf-lib)');
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  // 5. SERIALIZE BYTES & BLOB
  checkAborted();
  reportProgress('finalizing', 96, totalPages, totalPages, 'กำลังบันทึกไฟล์ PDF...');

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = generatePdfFilename(student);

  reportProgress('completed', 100, totalPages, totalPages, 'สร้างไฟล์ PDF เสร็จสมบูรณ์!');

  return {
    bytes: pdfBytes,
    blob: pdfBlob,
    filename,
    pageCount: totalPages
  };
}

