/**
 * Wangwon Portfolio - Draft Storage Engine (Phase 12)
 * Native IndexedDB wrapper for persistent, local-first project draft storage.
 *
 * Database Name: wangwon-portfolio-db
 * Store Name: drafts
 * Key: "default" (single active project)
 *
 * Stores raw binary Blobs/Files directly via structured clone.
 * Strips all session-bound Object URLs before saving and creates
 * fresh Object URLs upon rehydration.
 */

import { generatePdfFilename } from './filename-utils.js';
import { getDefaultAcademicYear } from './student-utils.js';

export const DB_NAME = 'wangwon-portfolio-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'drafts';
export const DRAFT_KEY = 'default';
export const SCHEMA_VERSION = 1;
export const APP_VERSION = '0.12.0';

/**
 * Opens or upgrades the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
export function openDraftDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open draft database.'));
    };

    request.onblocked = () => {
      console.warn('[DraftStorage] IndexedDB upgrade blocked by another open tab.');
    };
  });
}

/**
 * Checks if the current project state contains meaningful user modifications.
 * Avoids saving completely blank projects into IndexedDB.
 *
 * @param {object} state - projectStore state
 * @returns {boolean}
 */
export function hasMeaningfulProjectData(state) {
  if (!state) return false;

  const student = state.student || {};
  const hasStudentInfo =
    (student.firstName && student.firstName.trim().length > 0) ||
    (student.lastName && student.lastName.trim().length > 0) ||
    (student.grade && student.grade.trim().length > 0) ||
    (student.studentNumber && student.studentNumber.trim().length > 0) ||
    (student.academicYear && student.academicYear !== getDefaultAcademicYear());

  if (hasStudentInfo) return true;

  // Student photo present
  if (state.studentPhoto && (state.studentPhoto.file || state.studentPhoto.blob)) {
    return true;
  }

  // Any activity images imported
  if (Array.isArray(state.images) && state.images.length > 0) {
    return true;
  }

  // Non-default front cover
  const front = state.frontCover || {};
  if (front.mode === 'custom' || (front.templateId && front.templateId !== 'minimal-school')) {
    return true;
  }

  // Non-default back cover
  const back = state.backCover || {};
  if (back.mode === 'custom' || (back.templateId && back.templateId !== 'minimal-school')) {
    return true;
  }

  // Watermark enabled or configured
  const wm = state.watermark || {};
  if (wm.enabled === true || (wm.sourceType && wm.sourceType !== 'none')) {
    return true;
  }

  // Settings non-default
  const pdf = state.pdfSettings || {};
  if (
    (pdf.orientation && pdf.orientation !== 'portrait') ||
    (pdf.placement && pdf.placement !== 'fit') ||
    (pdf.quality && pdf.quality !== 'balanced')
  ) {
    return true;
  }

  return false;
}

/**
 * Serializes in-memory projectStore state into an IndexedDB-safe record.
 * Strips all blob: Object URLs and extracts pure Blobs/Files.
 *
 * @param {object} state - In-memory projectStore state
 * @returns {object} Serializable draft payload
 */
export function serializeProjectState(state) {
  if (!state) return null;

  // 1. Student info
  const student = {
    prefix: state.student?.prefix || 'ด.ช.',
    firstName: state.student?.firstName || '',
    lastName: state.student?.lastName || '',
    grade: state.student?.grade || '',
    studentNumber: state.student?.studentNumber || '',
    academicYear: state.student?.academicYear || getDefaultAcademicYear()
  };

  // 2. Student photo
  let studentPhoto = null;
  if (state.studentPhoto) {
    const rawPhoto = state.studentPhoto.file || state.studentPhoto.blob;
    if (rawPhoto) {
      studentPhoto = {
        blob: rawPhoto,
        originalName: state.studentPhoto.originalName || rawPhoto.name || 'student-photo.jpg',
        mimeType: state.studentPhoto.mimeType || rawPhoto.type || 'image/jpeg',
        width: state.studentPhoto.width || 0,
        height: state.studentPhoto.height || 0
      };
    }
  }

  // 3. Activity images (preserving exact array order, rotation, dimensions)
  const images = (state.images || []).map((img) => {
    const rawBlob = img.file || img.blob;
    return {
      id: img.id,
      blob: rawBlob,
      originalName: img.originalFilename || img.originalName || rawBlob?.name || 'activity-image.jpg',
      mimeType: img.mimeType || rawBlob?.type || 'image/jpeg',
      width: img.width || 0,
      height: img.height || 0,
      rotation: img.rotation || 0,
      qualityStatus: img.qualityStatus || 'normal',
      sizeBytes: img.sizeBytes || rawBlob?.size || 0
    };
  });

  // 4. Front & Back covers
  const serializeCover = (cover) => {
    if (!cover) {
      return {
        mode: 'generated',
        source: 'template',
        templateId: 'minimal-school',
        customBlob: null,
        customOriginalName: null,
        customMimeType: null,
        isLocked: true
      };
    }
    const rawCustom = cover.customFile || cover.customBlob;
    return {
      mode: cover.mode || 'generated',
      source: cover.source || 'template',
      templateId: cover.templateId || 'minimal-school',
      customBlob: rawCustom || null,
      customOriginalName: cover.customOriginalName || rawCustom?.name || null,
      customMimeType: cover.customMimeType || rawCustom?.type || null,
      isLocked: true
    };
  };

  const frontCover = serializeCover(state.frontCover);
  const backCover = serializeCover(state.backCover);

  // 5. Watermark settings
  const wm = state.watermark || {};
  let customWatermark = null;
  if (wm.custom) {
    const rawCustomWm = wm.custom.file || wm.custom.blob;
    if (rawCustomWm) {
      customWatermark = {
        blob: rawCustomWm,
        originalName: wm.custom.originalName || rawCustomWm.name || 'custom-watermark.png',
        mimeType: wm.custom.mimeType || rawCustomWm.type || 'image/png',
        width: wm.custom.width || 0,
        height: wm.custom.height || 0
      };
    }
  }

  const watermark = {
    enabled: !!wm.enabled,
    sourceType: wm.sourceType || (wm.enabled ? 'school-logo' : 'none'),
    custom: customWatermark,
    opacity: wm.opacity !== undefined ? wm.opacity : 0.18,
    scale: wm.scale !== undefined ? wm.scale : 0.18,
    position: wm.position || 'bottom-right',
    applyTo: wm.applyTo || 'activity-only'
  };

  // 6. PDF settings
  const pdfSettings = {
    paperSize: state.pdfSettings?.paperSize || 'A4',
    orientation: state.pdfSettings?.orientation || 'portrait',
    placement: state.pdfSettings?.placement || 'fit',
    margin: state.pdfSettings?.margin || 'none',
    quality: state.pdfSettings?.quality || 'balanced'
  };

  return {
    student,
    studentPhoto,
    images,
    frontCover,
    backCover,
    watermark,
    pdfSettings
  };
}

/**
 * Saves project state into IndexedDB.
 * Returns the saved draft record.
 *
 * @param {object} projectState - In-memory projectStore state
 * @returns {Promise<object>}
 */
export async function saveDraft(projectState) {
  const db = await openDraftDb();

  const serializedProject = serializeProjectState(projectState);
  const draftRecord = {
    id: DRAFT_KEY,
    schemaVersion: SCHEMA_VERSION,
    savedAt: Date.now(),
    appVersion: APP_VERSION,
    project: serializedProject
  };

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(draftRecord);

      request.onsuccess = () => {
        resolve(draftRecord);
      };

      request.onerror = (event) => {
        const error = event.target.error;
        reject(error || new Error('Failed to save project draft.'));
      };

      transaction.onabort = () => {
        reject(new Error('Draft transaction was aborted.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Loads the saved draft record from IndexedDB.
 * Returns null if no draft exists.
 *
 * @returns {Promise<object|null>}
 */
export async function loadDraft() {
  const db = await openDraftDb();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DRAFT_KEY);

      request.onsuccess = () => {
        const record = request.result;
        if (!record || !record.project) {
          return resolve(null);
        }
        resolve(migrateDraftRecord(record));
      };

      request.onerror = (event) => {
        reject(event.target.error || new Error('Failed to load project draft.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Checks whether a saved draft currently exists in IndexedDB.
 * @returns {Promise<boolean>}
 */
export async function hasDraft() {
  try {
    const draft = await loadDraft();
    return draft !== null && draft.project !== null;
  } catch (err) {
    console.warn('[DraftStorage] hasDraft check error:', err);
    return false;
  }
}

/**
 * Deletes the saved draft from IndexedDB.
 * @returns {Promise<boolean>}
 */
export async function deleteDraft() {
  const db = await openDraftDb();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(DRAFT_KEY);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error || new Error('Failed to delete project draft.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Schema migration entry point.
 * Ensures forward/backward compatibility for future schema iterations.
 *
 * @param {object} record
 * @returns {object} Migrated record
 */
export function migrateDraftRecord(record) {
  if (!record) return null;

  // Schema v1 is current baseline
  if (!record.schemaVersion || record.schemaVersion === 1) {
    return record;
  }

  // If a future version is encountered that this version does not know how to handle:
  if (record.schemaVersion > SCHEMA_VERSION) {
    console.warn(`[DraftStorage] Draft schema version ${record.schemaVersion} is newer than current ${SCHEMA_VERSION}.`);
  }

  return record;
}

/**
 * Rehydrates a serialized draft record into a fully functional in-memory project state:
 * - Generates fresh blob: URLs for all Blobs
 * - Constructs File objects where required by existing modules
 * - Recalculates output filename
 *
 * @param {object} draftRecord - Draft record returned from loadDraft()
 * @returns {object} Ready-to-hydrate projectState object
 */
export function rehydrateDraftState(draftRecord) {
  if (!draftRecord || !draftRecord.project) {
    throw new Error('Invalid draft record provided for rehydration.');
  }

  const proj = draftRecord.project;

  // 1. Student details
  const student = {
    prefix: proj.student?.prefix || 'ด.ช.',
    firstName: proj.student?.firstName || '',
    lastName: proj.student?.lastName || '',
    grade: proj.student?.grade || '',
    studentNumber: proj.student?.studentNumber || '',
    academicYear: proj.student?.academicYear || getDefaultAcademicYear()
  };

  // 2. Student photo
  let studentPhoto = null;
  if (proj.studentPhoto && proj.studentPhoto.blob) {
    const rawBlob = proj.studentPhoto.blob;
    const originalName = proj.studentPhoto.originalName || 'student-photo.jpg';
    const mimeType = proj.studentPhoto.mimeType || rawBlob.type || 'image/jpeg';
    const file = rawBlob instanceof File ? rawBlob : new File([rawBlob], originalName, { type: mimeType });
    const previewUrl = URL.createObjectURL(rawBlob);

    studentPhoto = {
      file,
      blob: rawBlob,
      previewUrl,
      originalName,
      mimeType,
      width: proj.studentPhoto.width || 0,
      height: proj.studentPhoto.height || 0
    };
  }

  // 3. Activity images (preserving order & rotation)
  const images = (proj.images || []).map((img) => {
    const rawBlob = img.blob;
    const originalName = img.originalName || img.originalFilename || 'activity-image.jpg';
    const mimeType = img.mimeType || rawBlob?.type || 'image/jpeg';
    const file = rawBlob instanceof File ? rawBlob : new File([rawBlob], originalName, { type: mimeType });
    const previewUrl = rawBlob ? URL.createObjectURL(rawBlob) : '';

    return {
      id: img.id,
      file,
      previewUrl,
      originalFilename: originalName,
      originalName,
      mimeType,
      sizeBytes: img.sizeBytes || rawBlob?.size || 0,
      width: img.width || 0,
      height: img.height || 0,
      rotation: img.rotation || 0,
      qualityStatus: img.qualityStatus || 'normal'
    };
  });

  // 4. Front Cover
  let frontCover = {
    mode: proj.frontCover?.mode || 'generated',
    source: proj.frontCover?.source || (proj.frontCover?.mode === 'custom' ? 'custom' : 'template'),
    templateId: proj.frontCover?.templateId || 'minimal-school',
    customFile: null,
    customPreviewUrl: null,
    isLocked: true
  };
  if (proj.frontCover?.customBlob) {
    const rawBlob = proj.frontCover.customBlob;
    const originalName = proj.frontCover.customOriginalName || 'custom-front-cover.jpg';
    const mimeType = proj.frontCover.customMimeType || rawBlob.type || 'image/jpeg';
    const file = rawBlob instanceof File ? rawBlob : new File([rawBlob], originalName, { type: mimeType });
    const previewUrl = URL.createObjectURL(rawBlob);

    frontCover.customFile = file;
    frontCover.customPreviewUrl = previewUrl;
    frontCover.customOriginalName = originalName;
    frontCover.customMimeType = mimeType;
  }

  // 5. Back Cover
  let backCover = {
    mode: proj.backCover?.mode || 'generated',
    source: proj.backCover?.source || (proj.backCover?.mode === 'custom' ? 'custom' : 'template'),
    templateId: proj.backCover?.templateId || 'minimal-school',
    customFile: null,
    customPreviewUrl: null,
    isLocked: true
  };
  if (proj.backCover?.customBlob) {
    const rawBlob = proj.backCover.customBlob;
    const originalName = proj.backCover.customOriginalName || 'custom-back-cover.jpg';
    const mimeType = proj.backCover.customMimeType || rawBlob.type || 'image/jpeg';
    const file = rawBlob instanceof File ? rawBlob : new File([rawBlob], originalName, { type: mimeType });
    const previewUrl = URL.createObjectURL(rawBlob);

    backCover.customFile = file;
    backCover.customPreviewUrl = previewUrl;
    backCover.customOriginalName = originalName;
    backCover.customMimeType = mimeType;
  }

  // 6. Watermark
  const wm = proj.watermark || {};
  let customWmObj = {
    file: null,
    previewUrl: null,
    mimeType: null,
    width: null,
    height: null
  };
  if (wm.custom && wm.custom.blob) {
    const rawBlob = wm.custom.blob;
    const originalName = wm.custom.originalName || 'custom-watermark.png';
    const mimeType = wm.custom.mimeType || rawBlob.type || 'image/png';
    const file = rawBlob instanceof File ? rawBlob : new File([rawBlob], originalName, { type: mimeType });
    const previewUrl = URL.createObjectURL(rawBlob);

    customWmObj = {
      file,
      previewUrl,
      mimeType,
      width: wm.custom.width || null,
      height: wm.custom.height || null,
      originalName
    };
  }

  const watermark = {
    enabled: !!wm.enabled,
    sourceType: wm.sourceType || 'none',
    custom: customWmObj,
    opacity: wm.opacity !== undefined ? wm.opacity : 0.18,
    scale: wm.scale !== undefined ? wm.scale : 0.18,
    position: wm.position || 'bottom-right',
    applyTo: wm.applyTo || 'activity-only'
  };

  // 7. PDF Settings
  const pdfSettings = {
    paperSize: proj.pdfSettings?.paperSize || 'A4',
    orientation: proj.pdfSettings?.orientation || 'portrait',
    placement: proj.pdfSettings?.placement || 'fit',
    margin: proj.pdfSettings?.margin || 'none',
    quality: proj.pdfSettings?.quality || 'balanced'
  };

  // 8. Output filename
  const output = {
    filename: generatePdfFilename(student)
  };

  return {
    student,
    studentPhoto,
    images,
    frontCover,
    backCover,
    watermark,
    pdfSettings,
    output
  };
}
