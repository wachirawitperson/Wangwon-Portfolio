/**
 * Wangwon Portfolio - Auto-Save Manager (Phase 12)
 * Orchestrates debounced project state persistence, serialization queues,
 * status emission, and browser lifecycle event flushes.
 */

import {
  saveDraft,
  hasMeaningfulProjectData
} from './draft-storage.js';

export const DEFAULT_DEBOUNCE_MS = 750;

/**
 * State of the autosave manager:
 * - status: 'idle' | 'saving' | 'saved' | 'error'
 * - lastSavedAt: number | null (timestamp)
 * - lastError: Error | null
 */
class AutosaveManager {
  constructor() {
    this.debounceMs = DEFAULT_DEBOUNCE_MS;
    this.timerId = null;
    this.isSaving = false;
    this.pendingState = null;
    this.isPaused = false;
    this.generation = 0;

    this.status = 'idle';
    this.lastSavedAt = null;
    this.lastError = null;

    this.listeners = new Set();
    this.lastErrorToastTime = 0;

    this.initLifecycleListeners();
  }

  /**
   * Registers a listener callback for autosave status changes.
   * @param {function({ status: string, lastSavedAt: number|null, formattedTime: string, error: Error|null }): void} listener
   * @returns {function(): void} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.getStatusPayload());
    return () => this.listeners.delete(listener);
  }

  emit() {
    const payload = this.getStatusPayload();
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[AutosaveManager] Listener error:', err);
      }
    });
  }

  getStatusPayload() {
    let formattedTime = '';
    if (this.lastSavedAt) {
      const d = new Date(this.lastSavedAt);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      formattedTime = `${hours}:${mins}`;
    }

    return {
      status: this.status,
      lastSavedAt: this.lastSavedAt,
      formattedTime,
      error: this.lastError
    };
  }

  setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    if (status === 'saved') {
      this.lastSavedAt = Date.now();
    }
    this.emit();
  }

  /**
   * Temporarily pauses autosave (e.g. during project hydration or reset).
   */
  pause() {
    this.isPaused = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.pendingState = null;
  }

  /**
   * Resumes autosave tracking.
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Schedules a debounced autosave operation.
   * @param {object} state - In-memory projectStore state
   */
  scheduleSave(state) {
    if (this.isPaused) return;

    if (!hasMeaningfulProjectData(state)) {
      // Do not save blank projects
      return;
    }

    this.pendingState = state;

    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.flush();
    }, this.debounceMs);
  }

  /**
   * Triggers an immediate save without waiting for debounce.
   * Useful for high-value actions (photo upload, image import, deletion).
   * @param {object} state - In-memory projectStore state
   */
  triggerImmediateSave(state) {
    if (this.isPaused) return;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.pendingState = state;
    return this.flush();
  }

  /**
   * Flushes any pending state into IndexedDB.
   * Queues execution if another save transaction is already in flight.
   */
  async flush() {
    if (this.isPaused || !this.pendingState) {
      return;
    }

    // If currently saving, pendingState is already updated and will be processed next
    if (this.isSaving) {
      return;
    }

    const stateToSave = this.pendingState;
    this.pendingState = null;

    if (!hasMeaningfulProjectData(stateToSave)) {
      return;
    }

    this.isSaving = true;
    const currentGen = ++this.generation;
    this.setStatus('saving');

    try {
      await saveDraft(stateToSave);

      // Only transition to 'saved' if no newer save superseded this generation
      if (this.generation === currentGen) {
        this.setStatus('saved');
      }
    } catch (err) {
      console.error('[AutosaveManager] Save failed:', err);
      if (this.generation === currentGen) {
        this.setStatus('error', err);
        this.notifySaveError(err);
      }
    } finally {
      this.isSaving = false;

      // If a newer state arrived while saving was in progress, execute it immediately
      if (this.pendingState) {
        this.flush();
      }
    }
  }

  /**
   * Rate-limited error notification.
   */
  notifySaveError(err) {
    const now = Date.now();
    // Only notify at most once every 30 seconds
    if (now - this.lastErrorToastTime < 30000) {
      return;
    }
    this.lastErrorToastTime = now;

    const isQuota = err?.name === 'QuotaExceededError' || err?.code === 22;
    const message = isQuota
      ? 'พื้นที่บันทึกร่างในเบราว์เซอร์ไม่เพียงพอ กรุณาลดจำนวนรูปหรือส่งออกไฟล์ก่อน'
      : 'บันทึกร่างในเครื่องไม่สำเร็จ กรุณาส่งออกไฟล์ก่อนปิดหน้านี้';

    // Dispatch a custom event so the UI notification layer can display it without circular imports
    window.dispatchEvent(
      new CustomEvent('wangwon:autosave-error', {
        detail: { message, isQuota, error: err }
      })
    );
  }

  /**
   * Binds browser visibility and pagehide events to flush pending saves.
   */
  initLifecycleListeners() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.pendingState) {
        this.flush();
      }
    });

    window.addEventListener('pagehide', () => {
      if (this.pendingState) {
        this.flush();
      }
    });
  }
}

// Global autosave manager singleton instance
export const autosaveManager = new AutosaveManager();
