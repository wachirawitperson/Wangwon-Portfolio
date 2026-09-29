/**
 * Student Image Manager
 * Handles middle pages (student activity and work images).
 * Maintains image list order, rotation, previews, and clean memory disposal.
 */
import { projectStore } from './portfolio-state.js';
import {
  createPreviewUrl,
  revokePreviewUrl,
  normalizeRotation,
  getImageDimensions,
  assessImageQuality,
  buildDuplicateKey,
  decodeHeicIfNeeded
} from '../core/image-utils.js';
import { isSupportedImage, getNormalizedExtension } from '../core/file-utils.js';

let nextImageId = 1;

/**
 * Robust image import pipeline for student portfolio images.
 * Validates formats, decodes HEIC if necessary, reads dimensions,
 * checks resolution quality, identifies duplicates against existing state and current batch,
 * and allows optional inclusion or skipping of duplicates.
 *
 * @param {FileList|File[]} files - Incoming file objects
 * @param {object} [options]
 * @param {'file-picker'|'drag-drop'|'clipboard'} [options.source='file-picker'] - Source of files
 * @param {boolean} [options.allowDuplicates=false] - Whether to import identified duplicates
 * @returns {Promise<{
 *   imported: object[],
 *   unsupported: string[],
 *   corrupted: string[],
 *   duplicates: { file: File, existingName: string, name: string }[],
 *   lowResolution: object[]
 * }>}
 */
export async function importStudentImages(files, options = {}) {
  const { source = 'file-picker', allowDuplicates = false } = options;
  if (!files || !files.length) {
    return { imported: [], unsupported: [], corrupted: [], duplicates: [], lowResolution: [] };
  }

  const fileList = Array.from(files);
  const currentState = projectStore.getState();
  const existingImages = currentState.images || [];

  // Track existing duplicate keys
  const existingKeys = new Map();
  existingImages.forEach((img) => {
    if (img.duplicateKey) {
      existingKeys.set(img.duplicateKey, img.originalFilename);
    }
  });

  const imported = [];
  const unsupported = [];
  const corrupted = [];
  const duplicates = [];
  const lowResolution = [];

  const seenInBatch = new Set();

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const filename = file.name || `image_${i + 1}`;

    // 1. Format check
    if (!isSupportedImage(file)) {
      unsupported.push(filename);
      continue;
    }

    // 2. HEIC / HEIF decoding
    let processableBlob = file;
    let effectiveFilename = filename;
    let mimeType = file.type || 'image/jpeg';
    let outputExtension = getNormalizedExtension(filename, mimeType);

    try {
      const decoded = await decodeHeicIfNeeded(file);
      processableBlob = decoded.blob;
      effectiveFilename = decoded.filename;
      mimeType = decoded.mimeType;
      outputExtension = getNormalizedExtension(effectiveFilename, mimeType);
    } catch (err) {
      corrupted.push(filename);
      continue;
    }

    // 3. Read dimensions and verify file integrity
    let dimensions;
    try {
      dimensions = await getImageDimensions(processableBlob);
    } catch (err) {
      corrupted.push(filename);
      continue;
    }

    // 4. Duplicate fingerprint check
    const duplicateKey = buildDuplicateKey(file, dimensions);
    const isExistingDuplicate = existingKeys.has(duplicateKey);
    const isBatchDuplicate = seenInBatch.has(duplicateKey);

    if (isExistingDuplicate || isBatchDuplicate) {
      const matchedName = existingKeys.get(duplicateKey) || filename;
      duplicates.push({
        file,
        name: filename,
        existingName: matchedName,
        dimensions,
        duplicateKey,
        processableBlob,
        effectiveFilename,
        mimeType,
        outputExtension
      });

      if (!allowDuplicates) {
        continue;
      }
    } else {
      seenInBatch.add(duplicateKey);
      existingKeys.set(duplicateKey, filename);
    }

    // 5. Quality assessment (longest edge < 1200 or < 1000x1000)
    const quality = assessImageQuality(dimensions.width, dimensions.height);

    const id = `img_${Date.now()}_${nextImageId++}`;
    const previewUrl = createPreviewUrl(processableBlob);

    const imageItem = {
      id,
      originalFile: file,
      originalFilename: filename,
      outputExtension,
      mimeType,
      order: existingImages.length + imported.length + 1,
      rotation: 0,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: dimensions.aspectRatio,
      fileSize: file.size || processableBlob.size || 0,
      previewUrl,
      source,
      qualityStatus: quality.status,
      qualityWarning: quality.warning,
      duplicateKey
    };

    if (quality.status === 'low') {
      lowResolution.push(imageItem);
    }

    imported.push(imageItem);
  }

  // Commit imported images to store
  if (imported.length > 0) {
    projectStore.setState((state) => {
      const current = state.images || [];
      const updated = [...current, ...imported].map((img, idx) => ({
        ...img,
        order: idx + 1
      }));
      return { images: updated };
    });
  }

  return {
    imported,
    unsupported,
    corrupted,
    duplicates,
    lowResolution
  };
}

/**
 * Adds new image files to the student portfolio workspace (Legacy fallback / wrapper).
 * Always placed sequentially between Front Cover and Back Cover.
 *
 * @param {FileList|File[]} files
 */
export function addStudentImages(files) {
  if (!files || !files.length) return [];
  // For backwards compatibility, invoke importStudentImages
  importStudentImages(files, { source: 'file-picker', allowDuplicates: true });
}

/**
 * Removes an image by ID and frees memory.
 * @param {string} id
 */
export function removeStudentImage(id) {
  projectStore.setState((state) => {
    const target = state.images.find((img) => img.id === id);
    if (target?.previewUrl) {
      revokePreviewUrl(target.previewUrl);
    }

    const filtered = state.images
      .filter((img) => img.id !== id)
      .map((img, i) => ({ ...img, order: i + 1 }));

    return { images: filtered };
  });
}

/**
 * Rotates an image clockwise by 90 degrees.
 * @param {string} id
 */
export function rotateStudentImage(id) {
  projectStore.setState((state) => {
    const images = state.images.map((img) => {
      if (img.id === id) {
        return {
          ...img,
          rotation: normalizeRotation((img.rotation || 0) + 90)
        };
      }
      return img;
    });

    return { images };
  });
}

/**
 * Reorders images by new ID sequence.
 * @param {string[]} orderedIds
 */
export function reorderStudentImages(orderedIds) {
  projectStore.setState((state) => {
    const map = new Map(state.images.map((img) => [img.id, img]));
    const reordered = [];

    orderedIds.forEach((id, idx) => {
      const item = map.get(id);
      if (item) {
        reordered.push({ ...item, order: idx + 1 });
        map.delete(id);
      }
    });

    // Add any remaining items that weren't in the list
    map.forEach((item) => {
      reordered.push({ ...item, order: reordered.length + 1 });
    });

    return { images: reordered };
  });
}

/**
 * Clears all student images and revokes all active preview URLs.
 */
export function clearAllStudentImages() {
  const currentImages = projectStore.getState().images || [];
  currentImages.forEach((img) => {
    if (img.previewUrl) {
      revokePreviewUrl(img.previewUrl);
    }
  });
  projectStore.setState({ images: [] });
}
