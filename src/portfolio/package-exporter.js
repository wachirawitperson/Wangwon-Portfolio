/**
 * Wangwon Portfolio - Phase 11: PDF + รูปภาพ Package Export Engine
 *
 * Coordinates composition of Phase 9 (PDF Generation) and Phase 10 (Renamed Images)
 * into a single clean ZIP archive with a dedicated student folder structure:
 *
 * [studentBaseName]_Portfolio.zip
 * └── [studentBaseName]/
 *     ├── [studentBaseName].pdf
 *     ├── [studentBaseName]_01.jpg
 *     ├── [studentBaseName]_02.jpg
 *     └── ...
 *
 * Privacy & Architecture Guarantees:
 * - 100% in-browser client-side execution via local JSZip dependency.
 * - Zero external network requests, zero server uploads.
 * - Single PDF generation call and single image export pass per package job.
 * - Atomic package rule: Complete package or fail; no partial corrupted downloads.
 * - Excludes student profile photo and loose front/back covers from ZIP.
 * - Monotonic progress reporting: 0% -> 100%.
 */
import { generatePortfolioPdf } from './pdf-generator.js';
import { prepareAllActivityImageExports } from './image-exporter.js';
import {
  getStudentExportBaseName,
  getExportPackageFilename
} from '../core/filename-utils.js';

// Primary loading path: Local ESM build of JSZip
import JSZipESM from '../../vendor/jszip.esm.min.js';

/**
 * Helper to retrieve the JSZip constructor.
 * Uses the primary local ESM build, falling back to window.JSZip if needed.
 *
 * @returns {typeof import('jszip')}
 */
export function getJSZip() {
  if (JSZipESM) {
    return JSZipESM.default || JSZipESM;
  }
  if (typeof window !== 'undefined' && window.JSZip) {
    return window.JSZip;
  }
  if (typeof globalThis !== 'undefined' && globalThis.JSZip) {
    return globalThis.JSZip;
  }
  throw new Error('JSZip is not loaded. Please ensure vendor/jszip.min.js is accessible.');
}

/**
 * Generates a complete portfolio package ZIP containing the generated PDF
 * and renamed activity image copies.
 *
 * @param {object} projectState - Complete project state (e.g. projectStore.getState())
 * @param {object} [options]
 * @param {function} [options.onProgress] - Monotonic progress callback ({ percent, stage, message })
 * @param {AbortSignal} [options.signal] - Optional cancellation signal
 * @returns {Promise<{
 *   blob: Blob,
 *   filename: string,
 *   pdf: { filename: string, pageCount: number, blob: Blob },
 *   images: Array<{ imageId: string, sequence: number, filename: string, blob: Blob }>,
 *   fileCount: number
 * }>}
 */
export async function generatePortfolioPackage(projectState = {}, { onProgress, signal } = {}) {
  if (signal?.aborted) {
    throw new DOMException('Export aborted by user', 'AbortError');
  }

  const reportProgress = (percent, stage, message) => {
    if (typeof onProgress === 'function') {
      onProgress({
        percent: Math.min(100, Math.max(0, Math.round(percent))),
        stage,
        message
      });
    }
  };

  // Stage 1: Validation and preparation (0% - 5%)
  reportProgress(2, 'preparing', 'กำลังเตรียมข้อมูล...');

  const student = projectState?.student || {};
  const firstName = (student.firstName || '').trim();
  if (!firstName) {
    throw new Error('กรุณาระบุชื่อนักเรียนก่อนทำการส่งออก');
  }

  const studentFolder = getStudentExportBaseName(student);
  const packageFilename = getExportPackageFilename(student);

  if (signal?.aborted) {
    throw new DOMException('Export aborted by user', 'AbortError');
  }

  // Stage 2: Generate PDF (5% - 55%)
  reportProgress(5, 'pdf', 'กำลังสร้าง PDF...');

  let pdfResult;
  try {
    pdfResult = await generatePortfolioPdf(projectState, {
      signal,
      onProgress: ({ percent }) => {
        // Map PDF progress 0-100% into package progress 5-55%
        const mapped = 5 + (percent * 0.50);
        reportProgress(mapped, 'pdf', `กำลังสร้าง PDF (${percent}%)...`);
      }
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(`ไม่สามารถสร้าง PDF สำหรับแพ็กเกจได้: ${err.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
  }

  if (signal?.aborted) {
    throw new DOMException('Export aborted by user', 'AbortError');
  }

  // Stage 3: Prepare activity images (55% - 80%)
  const totalImages = (projectState?.images || []).length;
  reportProgress(55, 'images', totalImages > 0 ? `กำลังเตรียมรูปภาพ (0/${totalImages})...` : 'ตรวจสอบรูปภาพ...');

  let exportedImages = [];
  try {
    exportedImages = await prepareAllActivityImageExports(projectState, {
      onProgress: ({ current, total, percentage, filename }) => {
        // Map image preparation progress 0-100% into package progress 55-80%
        const mapped = 55 + (percentage * 0.25);
        reportProgress(mapped, 'images', `กำลังเตรียมรูปภาพ ${current} / ${total}...`);
      }
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(`ไม่สามารถเตรียมรูปภาพสำหรับแพ็กเกจได้: ${err.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
  }

  if (signal?.aborted) {
    throw new DOMException('Export aborted by user', 'AbortError');
  }

  // Stage 4: Package into ZIP (80% - 97%)
  reportProgress(80, 'packaging', 'กำลังรวมไฟล์ลงในโฟลเดอร์...');

  const JSZipClass = getJSZip();
  const zip = new JSZipClass();

  // Create top-level student folder
  const folder = zip.folder(studentFolder);
  if (!folder) {
    throw new Error('ไม่สามารถสร้างโฟลเดอร์ภายในไฟล์ ZIP ได้');
  }

  // 1. Insert PDF into student folder (sanitizing entry name)
  const safePdfName = (pdfResult.filename || 'portfolio.pdf').replace(/^.*[\\/]/, '');
  folder.file(safePdfName, pdfResult.blob, { binary: true });

  // 2. Insert renamed activity images in Portfolio order (sanitizing entry name)
  for (const img of exportedImages) {
    const safeImgName = (img.filename || 'image.jpg').replace(/^.*[\\/]/, '');
    folder.file(safeImgName, img.blob, { binary: true });
  }

  reportProgress(88, 'compressing', 'กำลังบีบอัดและสร้างไฟล์ ZIP...');

  let zipBlob;
  try {
    zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        mimeType: 'application/zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 5 }
      },
      (metadata) => {
        // Map ZIP compression 0-100% into package progress 88-97%
        const mapped = 88 + (metadata.percent * 0.09);
        reportProgress(mapped, 'compressing', `กำลังสร้างไฟล์ดาวน์โหลด (${Math.round(metadata.percent)}%)...`);
      }
    );
  } catch (err) {
    throw new Error(`ไม่สามารถรวมไฟล์สำหรับดาวน์โหลดได้: ${err.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
  }

  if (signal?.aborted) {
    throw new DOMException('Export aborted by user', 'AbortError');
  }

  // Stage 5: Finalizing (100%)
  reportProgress(100, 'done', 'เสร็จเรียบร้อย');

  return {
    blob: zipBlob,
    filename: packageFilename,
    pdf: {
      filename: pdfResult.filename,
      pageCount: pdfResult.pageCount,
      blob: pdfResult.blob
    },
    images: exportedImages,
    fileCount: 1 + exportedImages.length
  };
}

/**
 * Triggers a client-side download of a generated package ZIP Blob.
 *
 * @param {object} params
 * @param {Blob} params.blob - The package ZIP Blob
 * @param {string} params.filename - The download filename
 */
export function downloadPortfolioPackage({ blob, filename }) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid package Blob provided for download');
  }
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid package filename provided for download');
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Safely clean up DOM and revoke Object URL after delay
  setTimeout(() => {
    if (anchor.parentNode) {
      document.body.removeChild(anchor);
    }
    URL.revokeObjectURL(url);
  }, 1000);
}
