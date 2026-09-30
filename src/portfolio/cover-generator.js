/**
 * Local Cover Template Generator (Phase 6)
 * Renders high-resolution, print-ready A4 Front and Back portfolio covers
 * completely in-browser using HTML5 Canvas 2D API.
 *
 * Zero external network requests, zero AI image generation.
 */
import { getCoverTemplate } from './cover-manager.js';

// Logical A4 Dimensions at print-ready ~150 DPI
export const A4_PORTRAIT_WIDTH = 1240;
export const A4_PORTRAIT_HEIGHT = 1754;
export const A4_LANDSCAPE_WIDTH = 1754;
export const A4_LANDSCAPE_HEIGHT = 1240;

// Local Asset Cache
let cachedSchoolEmblemImg = null;
const imageObjectCache = new Map();

/**
 * Loads and caches an image from an absolute or relative URL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement|null>}
 */
export async function loadCachedImage(src) {
  if (!src) return null;
  if (imageObjectCache.has(src)) {
    const cached = imageObjectCache.get(src);
    if (cached.complete && cached.naturalWidth > 0) {
      return cached;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjectCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Preloads the official Ban Wangwon School logo.
 */
export async function preloadSchoolLogo() {
  if (cachedSchoolEmblemImg && cachedSchoolEmblemImg.naturalWidth > 0) {
    return cachedSchoolEmblemImg;
  }
  const img = await loadCachedImage('./assets/branding/ban-wangwon-logo.png');
  cachedSchoolEmblemImg = img;
  return img;
}

/**
 * Helper to draw an image centered with `object-fit: cover` into a destination rectangle.
 */
function drawImageCover(ctx, img, dx, dy, dw, dh, radius = 0) {
  if (!img || img.naturalWidth === 0) return;

  ctx.save();
  if (radius > 0) {
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, dh, radius);
    ctx.clip();
  }

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = dw / dh;
  let sx, sy, sw, sh;

  if (srcRatio > dstRatio) {
    sh = img.naturalHeight;
    sw = sh * dstRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / dstRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

/**
 * Helper to draw a neutral silhouette portrait placeholder when no photo exists.
 */
function drawStudentPhotoPlaceholder(ctx, dx, dy, dw, dh, radius = 16, accentColor = '#cbd5e1') {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(dx, dy, dw, dh, radius);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.setLineDash([12, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw neutral silhouette icon
  const cx = dx + dw / 2;
  const cy = dy + dh / 2 - 20;

  // Head circle
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(cx, cy - 25, 45, 0, Math.PI * 2);
  ctx.fill();

  // Shoulder arc
  ctx.beginPath();
  ctx.arc(cx, cy + 95, 75, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineTo(cx + 65, cy + 85);
  ctx.arc(cx, cy + 85, 65, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Placeholder Thai label
  ctx.font = '500 28px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('พื้นที่รูปถ่ายนักเรียน', cx, dy + dh - 40);

  ctx.restore();
}

/**
 * Measures text and wraps it gracefully into 1 or 2 lines without overflowing maxWidth.
 */
function fitTextLines(ctx, text, maxWidth, initialSize = 52, minSize = 36) {
  let size = initialSize;
  ctx.font = `700 ${size}px "Sarabun", "Noto Sans Thai", sans-serif`;

  if (ctx.measureText(text).width <= maxWidth) {
    return { size, lines: [text] };
  }

  // Try breaking into words/space if possible
  const parts = text.split(' ');
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2);
    const line1 = parts.slice(0, mid).join(' ');
    const line2 = parts.slice(mid).join(' ');

    while (size > minSize) {
      ctx.font = `700 ${size}px "Sarabun", "Noto Sans Thai", sans-serif`;
      if (ctx.measureText(line1).width <= maxWidth && ctx.measureText(line2).width <= maxWidth) {
        return { size, lines: [line1, line2] };
      }
      size -= 2;
    }
    return { size: minSize, lines: [line1, line2] };
  }

  // Single long word without spaces
  while (size > minSize) {
    ctx.font = `700 ${size}px "Sarabun", "Noto Sans Thai", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) {
      return { size, lines: [text] };
    }
    size -= 2;
  }

  return { size: minSize, lines: [text] };
}

// ============================================================================
// TEMPLATE 1: MINIMAL SCHOOL
// Calm, official, school-document friendly. Clean white/ivory, Wangwon Navy,
// crisp typography, official emblem, 4:5 student portrait.
// ============================================================================

async function renderMinimalSchoolFront(ctx, w, h, data) {
  const { student, studentPhotoImg, schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Subtle outer border & top header bar
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, w, 24);

  // Bottom color ribbon (Navy, Sky, Yellow, Pink)
  const ribbonH = 14;
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, h - ribbonH, w * 0.4, ribbonH);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(w * 0.4, h - ribbonH, w * 0.3, ribbonH);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(w * 0.7, h - ribbonH, w * 0.15, ribbonH);
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(w * 0.85, h - ribbonH, w * 0.15, ribbonH);

  // 1. School Header & Emblem
  const emblemSize = 130;
  const emblemY = 90;
  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, (w - emblemSize) / 2, emblemY, emblemSize, emblemSize);
  }

  ctx.font = '700 34px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, emblemY + emblemSize + 48);

  // 2. Titles
  ctx.font = '900 76px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('PORTFOLIO', w / 2, emblemY + emblemSize + 155);

  ctx.font = '600 38px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('แฟ้มสะสมผลงานนักเรียน', w / 2, emblemY + emblemSize + 215);

  // Thin separator rule
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, emblemY + emblemSize + 245);
  ctx.lineTo(w / 2 + 120, emblemY + emblemSize + 245);
  ctx.stroke();

  // 3. Student Photo (4:5 Ratio Frame)
  const photoW = 400;
  const photoH = 500;
  const photoX = (w - photoW) / 2;
  const photoY = 620;

  if (studentPhotoImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 20);
    ctx.fill();
    ctx.restore();

    drawImageCover(ctx, studentPhotoImg, photoX, photoY, photoW, photoH, 20);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 20);
    ctx.stroke();
  } else {
    drawStudentPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, 20, '#cbd5e1');
  }

  // 4. Student Identity
  const fullName = `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim() || 'ชื่อ-นามสกุล นักเรียน';
  const nameY = 1210;
  const { size: nameSize, lines: nameLines } = fitTextLines(ctx, fullName, w - 240, 56, 40);

  ctx.font = `700 ${nameSize}px "Sarabun", "Noto Sans Thai", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';

  if (nameLines.length === 1) {
    ctx.fillText(nameLines[0], w / 2, nameY);
  } else {
    ctx.fillText(nameLines[0], w / 2, nameY - 18);
    ctx.fillText(nameLines[1], w / 2, nameY + 44);
  }

  // Class & Student Number (exact preservation without zero padding)
  const gradeText = student.grade || 'ระดับชั้น';
  const numberText = student.studentNumber ? `  |  เลขที่ ${student.studentNumber}` : '';
  const gradeLine = `${gradeText}${numberText}`;

  ctx.font = '600 36px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(gradeLine, w / 2, 1330);

  // Academic Year
  const yearText = `ปีการศึกษา ${student.academicYear || '2569'}`;
  ctx.font = '500 32px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(yearText, w / 2, 1390);

  // Bottom School Label
  ctx.font = '600 30px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, h - 60);
}

async function renderMinimalSchoolBack(ctx, w, h, data) {
  const { schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Top header bar
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, w, 24);

  // Center Content
  const emblemSize = 160;
  const centerY = h / 2 - 70;

  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, (w - emblemSize) / 2, centerY - 100, emblemSize, emblemSize);
  }

  ctx.font = '700 46px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, centerY + 120);

  // Clean accent line
  ctx.save();
  const grad = ctx.createLinearGradient(w / 2 - 100, 0, w / 2 + 100, 0);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.5, '#0284c7');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(w / 2 - 100, centerY + 155, 200, 6, 3);
  ctx.fill();
  ctx.restore();

  // Bottom ribbon
  const ribbonH = 14;
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, h - ribbonH, w * 0.4, ribbonH);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(w * 0.4, h - ribbonH, w * 0.3, ribbonH);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(w * 0.7, h - ribbonH, w * 0.15, ribbonH);
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(w * 0.85, h - ribbonH, w * 0.15, ribbonH);
}

// ============================================================================
// TEMPLATE 2: COLORFUL PORTFOLIO
// Cheerful, youthful, disciplined. Soft pastel curves and organic geometric
// shapes, vibrant ocean blue, soft yellow, warm coral.
// ============================================================================

async function renderColorfulPortfolioFront(ctx, w, h, data) {
  const { student, studentPhotoImg, schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Decorative Soft Pastel Background Curves
  ctx.save();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(w + 100, -80, 480, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(-60, 160, 420, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe4e6';
  ctx.beginPath();
  ctx.arc(w / 2, h + 200, 600, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 1. School Header & Emblem (Top Center)
  const emblemSize = 120;
  const emblemY = 80;
  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, (w - emblemSize) / 2, emblemY, emblemSize, emblemSize);
  }

  ctx.font = '700 32px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, emblemY + emblemSize + 42);

  // 2. Titles with Pill Badge
  ctx.save();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 180, emblemY + emblemSize + 80, 360, 64, 32);
  ctx.fill();
  ctx.font = '900 44px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PORTFOLIO', w / 2, emblemY + emblemSize + 126);
  ctx.restore();

  ctx.font = '700 40px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('แฟ้มสะสมผลงานนักเรียน', w / 2, emblemY + emblemSize + 195);

  // 3. Student Photo Frame (Rounded Pill Frame with vibrant border)
  const photoW = 420;
  const photoH = 520;
  const photoX = (w - photoW) / 2;
  const photoY = 600;

  ctx.save();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(photoX - 8, photoY - 8, photoW + 16, photoH + 16, 28);
  ctx.fill();
  ctx.restore();

  if (studentPhotoImg) {
    drawImageCover(ctx, studentPhotoImg, photoX, photoY, photoW, photoH, 24);
  } else {
    drawStudentPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, 24, '#38bdf8');
  }

  // 4. Student Details
  const fullName = `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim() || 'ชื่อ-นามสกุล นักเรียน';
  const nameY = 1220;
  const { size: nameSize, lines: nameLines } = fitTextLines(ctx, fullName, w - 240, 56, 40);

  ctx.font = `700 ${nameSize}px "Sarabun", "Noto Sans Thai", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';

  if (nameLines.length === 1) {
    ctx.fillText(nameLines[0], w / 2, nameY);
  } else {
    ctx.fillText(nameLines[0], w / 2, nameY - 18);
    ctx.fillText(nameLines[1], w / 2, nameY + 44);
  }

  // Class & Student Number
  const gradeText = student.grade || 'ระดับชั้น';
  const numberText = student.studentNumber ? `  •  เลขที่ ${student.studentNumber}` : '';
  const gradeLine = `${gradeText}${numberText}`;

  ctx.font = '600 36px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText(gradeLine, w / 2, 1340);

  // Academic Year Badge
  const yearText = `ปีการศึกษา ${student.academicYear || '2569'}`;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 160, 1390, 320, 56, 28);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '600 30px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(yearText, w / 2, 1430);
  ctx.restore();

  // Bottom School Label
  ctx.font = '600 28px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, h - 50);
}

async function renderColorfulPortfolioBack(ctx, w, h, data) {
  const { schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Soft organic curves
  ctx.save();
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.2, 400, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe4e6';
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.75, 450, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center Emblem
  const emblemSize = 160;
  const centerY = h / 2 - 60;
  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, (w - emblemSize) / 2, centerY - 90, emblemSize, emblemSize);
  }

  ctx.font = '700 46px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('โรงเรียนบ้านวังวน', w / 2, centerY + 130);

  // Colorful dot cluster
  const colors = ['#0284c7', '#f59e0b', '#fb7185', '#10b981'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(w / 2 - 45 + i * 30, centerY + 175, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// TEMPLATE 3: MODERN ACADEMIC
// Structured, editorial, geometric. Deep navy, crisp cobalt, structured column
// accents, clean high-clarity typography.
// ============================================================================

async function renderModernAcademicFront(ctx, w, h, data) {
  const { student, studentPhotoImg, schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Left Navy Accent Column (140px width)
  const colW = 140;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, colW, h);

  // Vertical text along left column: "BAN WANGWON SCHOOL"
  ctx.save();
  ctx.translate(colW / 2 + 10, h - 140);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '700 28px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'left';
  ctx.fillText('BAN WANGWON SCHOOL', 0, 0);
  ctx.restore();

  // Top emblem in left column
  const colEmblemSize = 80;
  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, (colW - colEmblemSize) / 2, 60, colEmblemSize, colEmblemSize);
  }

  // Right Content Area
  const contentX = colW + 70;
  const contentW = w - contentX - 70;

  // Top Label & Year
  ctx.font = '700 28px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2563eb';
  ctx.fillText('โรงเรียนบ้านวังวน', contentX, 100);

  ctx.font = '900 84px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('PORTFOLIO', contentX, 195);

  ctx.font = '600 36px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('แฟ้มสะสมผลงานนักเรียน', contentX, 250);

  // Horizontal editorial rule
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(contentX, 290);
  ctx.lineTo(contentX + 160, 290);
  ctx.stroke();

  // Student Photo Frame
  const photoW = 440;
  const photoH = 550;
  const photoX = contentX + 60;
  const photoY = 360;

  // Offset shadow backplate
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(photoX + 16, photoY + 16, photoW, photoH);
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX + 16, photoY + 16, photoW, photoH);

  if (studentPhotoImg) {
    drawImageCover(ctx, studentPhotoImg, photoX, photoY, photoW, photoH, 0);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  } else {
    drawStudentPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, 0, '#2563eb');
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  }

  // Student Name
  const fullName = `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim() || 'ชื่อ-นามสกุล นักเรียน';
  const nameY = 1010;
  const { size: nameSize, lines: nameLines } = fitTextLines(ctx, fullName, contentW, 54, 38);

  ctx.font = `700 ${nameSize}px "Sarabun", "Noto Sans Thai", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';

  if (nameLines.length === 1) {
    ctx.fillText(nameLines[0], contentX, nameY);
  } else {
    ctx.fillText(nameLines[0], contentX, nameY - 14);
    ctx.fillText(nameLines[1], contentX, nameY + 44);
  }

  // Academic Information Grid Box
  const boxY = 1100;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(contentX, boxY, contentW, 160);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(contentX, boxY, contentW, 160);

  // Left side: Grade & Number
  const gradeText = student.grade || 'ระดับชั้น';
  const numberText = student.studentNumber ? ` (เลขที่ ${student.studentNumber})` : '';

  ctx.font = '500 26px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ระดับชั้น', contentX + 36, boxY + 54);

  ctx.font = '700 36px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${gradeText}${numberText}`, contentX + 36, boxY + 110);

  // Right side: Year
  ctx.font = '500 26px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ปีการศึกษา', contentX + contentW - 240, boxY + 54);

  ctx.font = '700 36px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#2563eb';
  ctx.fillText(student.academicYear || '2569', contentX + contentW - 240, boxY + 110);
}

async function renderModernAcademicBack(ctx, w, h, data) {
  const { schoolLogoImg } = data;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Left Navy Column (matches front cover)
  const colW = 140;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, colW, h);

  // Content Center in remaining area
  const contentX = colW + (w - colW) / 2;
  const centerY = h / 2 - 40;

  const emblemSize = 160;
  if (schoolLogoImg) {
    ctx.drawImage(schoolLogoImg, contentX - emblemSize / 2, centerY - 90, emblemSize, emblemSize);
  }

  ctx.font = '700 46px "Sarabun", "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('โรงเรียนบ้านวังวน', contentX, centerY + 130);

  // Cobalt accent rule
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(contentX - 60, centerY + 165, 120, 4);
}

// ============================================================================
// MAIN GENERATOR DISPATCHER
// ============================================================================

/**
 * Generates an HTML5 Canvas containing the specified Front or Back cover.
 *
 * @param {object} options
 * @param {'front'|'back'} options.type - Whether to generate front or back cover
 * @param {string} [options.templateId='minimal-school'] - Template identifier
 * @param {object} options.student - Student state object
 * @param {object|null} [options.studentPhoto] - Student photo state { previewUrl, ... }
 * @param {'portrait'|'landscape'} [options.orientation='portrait'] - Page orientation
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function generateCoverCanvas(options = {}) {
  const {
    type = 'front',
    templateId = 'minimal-school',
    student = {},
    studentPhoto = null,
    orientation = 'portrait'
  } = options;

  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? A4_LANDSCAPE_WIDTH : A4_PORTRAIT_WIDTH;
  const height = isLandscape ? A4_LANDSCAPE_HEIGHT : A4_PORTRAIT_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Load required assets in parallel
  const [schoolLogoImg, studentPhotoImg] = await Promise.all([
    preloadSchoolLogo(),
    studentPhoto?.previewUrl ? loadCachedImage(studentPhoto.previewUrl) : Promise.resolve(null)
  ]);

  const renderData = {
    student,
    studentPhotoImg,
    schoolLogoImg
  };

  // Dispatch to template renderer
  switch (templateId) {
    case 'colorful-portfolio':
      if (type === 'front') {
        await renderColorfulPortfolioFront(ctx, width, height, renderData);
      } else {
        await renderColorfulPortfolioBack(ctx, width, height, renderData);
      }
      break;

    case 'modern-academic':
      if (type === 'front') {
        await renderModernAcademicFront(ctx, width, height, renderData);
      } else {
        await renderModernAcademicBack(ctx, width, height, renderData);
      }
      break;

    case 'minimal-school':
    default:
      if (type === 'front') {
        await renderMinimalSchoolFront(ctx, width, height, renderData);
      } else {
        await renderMinimalSchoolBack(ctx, width, height, renderData);
      }
      break;
  }

  return canvas;
}

/**
 * Generates an image data URL (PNG) of the rendered cover.
 *
 * @param {object} options - Arguments matching `generateCoverCanvas`
 * @returns {Promise<string>}
 */
export async function generateCoverDataUrl(options = {}) {
  const canvas = await generateCoverCanvas(options);
  return canvas.toDataURL('image/png');
}

/**
 * Generates a Blob representing the cover image.
 *
 * @param {object} options - Arguments matching `generateCoverCanvas`
 * @returns {Promise<Blob>}
 */
export async function generateCoverBlob(options = {}) {
  const canvas = await generateCoverCanvas(options);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}