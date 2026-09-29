/**
 * Student Image Manager
 * Handles middle pages (student activity and work images).
 * Maintains image list order, rotation, previews, and clean memory disposal.
 */
import { projectStore } from './portfolio-state.js';
import { createPreviewUrl, revokePreviewUrl, normalizeRotation } from '../core/image-utils.js';

let nextImageId = 1;

/**
 * Adds new image files to the student portfolio workspace.
 * Always placed sequentially between Front Cover and Back Cover.
 *
 * @param {FileList|File[]} files
 */
export function addStudentImages(files) {
  if (!files || !files.length) return [];

  const newImages = Array.from(files).map((file, idx) => {
    const id = `img_${Date.now()}_${nextImageId++}`;
    const previewUrl = createPreviewUrl(file);

    return {
      id,
      originalFile: file,
      originalFilename: file.name || `image_${idx + 1}.jpg`,
      order: 0, // will be computed below
      rotation: 0,
      width: 0,
      height: 0,
      previewUrl
    };
  });

  projectStore.setState((state) => {
    const existing = state.images || [];
    const combined = [...existing, ...newImages].map((img, i) => ({
      ...img,
      order: i + 1
    }));

    return { images: combined };
  });

  return newImages;
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
