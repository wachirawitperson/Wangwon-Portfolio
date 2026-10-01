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
      file,
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
  if (!files || !files.length) return Promise.resolve([]);
  // For backwards compatibility, invoke importStudentImages
  return importStudentImages(files, { source: 'file-picker', allowDuplicates: true });
}

/**
 * Removes an image by ID and frees memory.
 * @param {string} id
 */
export function removeStudentImage(id) {
  let wasRemoved = false;
  projectStore.setState((state) => {
    const target = state.images.find((img) => img.id === id);
    if (target?.previewUrl) {
      revokePreviewUrl(target.previewUrl);
    }

    if (target) {
      wasRemoved = true;
    }

    const filtered = state.images
      .filter((img) => img.id !== id)
      .map((img, i) => ({ ...img, order: i + 1 }));

    return { images: filtered };
  });
  return wasRemoved;
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
 * Moves an image one position earlier (left/up).
 * @param {string} id
 */
export function moveImageEarlier(id) {
  projectStore.setState((state) => {
    const images = [...(state.images || [])];
    const idx = images.findIndex((img) => img.id === id);
    if (idx > 0) {
      const temp = images[idx];
      images[idx] = images[idx - 1];
      images[idx - 1] = temp;
    }
    return {
      images: images.map((img, i) => ({ ...img, order: i + 1 }))
    };
  });
}

/**
 * Moves an image one position later (right/down).
 * @param {string} id
 */
export function moveImageLater(id) {
  projectStore.setState((state) => {
    const images = [...(state.images || [])];
    const idx = images.findIndex((img) => img.id === id);
    if (idx !== -1 && idx < images.length - 1) {
      const temp = images[idx];
      images[idx] = images[idx + 1];
      images[idx + 1] = temp;
    }
    return {
      images: images.map((img, i) => ({ ...img, order: i + 1 }))
    };
  });
}

/**
 * Reorders an image from old index to new index.
 * @param {number} oldIndex
 * @param {number} newIndex
 */
export function reorderImageByIndex(oldIndex, newIndex) {
  projectStore.setState((state) => {
    const images = [...(state.images || [])];
    if (
      oldIndex < 0 ||
      oldIndex >= images.length ||
      newIndex < 0 ||
      newIndex >= images.length ||
      oldIndex === newIndex
    ) {
      return { images };
    }
    const [moved] = images.splice(oldIndex, 1);
    images.splice(newIndex, 0, moved);
    return {
      images: images.map((img, i) => ({ ...img, order: i + 1 }))
    };
  });
}

/**
 * Replaces an existing student image with a new file while keeping the same position/slot and ID.
 * Resets rotation to 0. Revokes old preview URL only after successful decoding.
 *
 * @param {string} id - ID of image to replace
 * @param {File} file - New image file
 * @returns {Promise<object>} The updated image item
 */
export async function replaceStudentImage(id, file) {
  if (!file) throw new Error('No file provided for replacement');

  if (!isSupportedImage(file)) {
    throw new Error('UNSUPPORTED_FORMAT');
  }

  let processableBlob = file;
  let effectiveFilename = file.name || 'replaced_image';
  let mimeType = file.type || 'image/jpeg';
  let outputExtension = getNormalizedExtension(effectiveFilename, mimeType);

  try {
    const decoded = await decodeHeicIfNeeded(file);
    processableBlob = decoded.blob;
    effectiveFilename = decoded.filename;
    mimeType = decoded.mimeType;
    outputExtension = getNormalizedExtension(effectiveFilename, mimeType);
  } catch (err) {
    throw new Error('CORRUPTED_FILE');
  }

  let dimensions;
  try {
    dimensions = await getImageDimensions(processableBlob);
  } catch (err) {
    throw new Error('CORRUPTED_FILE');
  }

  const quality = assessImageQuality(dimensions.width, dimensions.height);
  const newPreviewUrl = createPreviewUrl(processableBlob);
  const duplicateKey = buildDuplicateKey(file, dimensions);

  let updatedItem = null;

  projectStore.setState((state) => {
    const images = (state.images || []).map((img) => {
      if (img.id === id) {
        // Revoke old URL now that replacement is successful
        if (img.previewUrl) {
          revokePreviewUrl(img.previewUrl);
        }

        updatedItem = {
          ...img,
          originalFile: file,
          originalFilename: effectiveFilename,
          outputExtension,
          mimeType,
          rotation: 0,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
          fileSize: file.size || processableBlob.size || 0,
          previewUrl: newPreviewUrl,
          qualityStatus: quality.status,
          qualityWarning: quality.warning,
          duplicateKey
        };
        return updatedItem;
      }
      return img;
    });

    return { images };
  });

  return updatedItem;
}

/**
 * Duplicates a student image and inserts it immediately after the original image.
 * Uses an independent preview URL so deleting or modifying one duplicate never affects the other.
 *
 * @param {string} id - ID of image to duplicate
 * @returns {object|null} Duplicated image item
 */
export function duplicateStudentImage(id) {
  let duplicatedItem = null;

  projectStore.setState((state) => {
    const current = state.images || [];
    const targetIdx = current.findIndex((img) => img.id === id);
    if (targetIdx === -1) return { images: current };

    const target = current[targetIdx];
    const newId = `img_${Date.now()}_${nextImageId++}`;
    // Create independent preview URL from originalFile
    const previewUrl = target.originalFile ? createPreviewUrl(target.originalFile) : target.previewUrl;

    duplicatedItem = {
      ...target,
      id: newId,
      previewUrl
    };

    const newImages = [...current];
    newImages.splice(targetIdx + 1, 0, duplicatedItem);

    return {
      images: newImages.map((img, idx) => ({ ...img, order: idx + 1 }))
    };
  });

  return duplicatedItem;
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
