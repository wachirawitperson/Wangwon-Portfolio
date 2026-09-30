import { projectStore, updateStudentField, updateStudentPhoto, clearStudentPhoto } from '../portfolio/portfolio-state.js';
import { generatePdfFilename } from '../core/filename-utils.js';
import { validateStudentInformation } from '../core/student-utils.js';
import { isSupportedImage } from '../core/file-utils.js';
import { decodeHeicIfNeeded, getImageDimensions, createPreviewUrl } from '../core/image-utils.js';
import { showToast } from './notifications.js';

let formInstance = null;

export function initStudentForm(formElement) {
  if (!formElement) return;
  formInstance = formElement;

  const prefixSelect = formElement.querySelector('#student-prefix');
  const firstNameInput = formElement.querySelector('#student-firstname');
  const lastNameInput = formElement.querySelector('#student-lastname');
  const gradeSelect = formElement.querySelector('#student-grade');
  const numberInput = formElement.querySelector('#student-number');
  const yearInput = formElement.querySelector('#student-year');
  const filenamePreview = document.querySelector('#preview-filename-badge');

  // Student Photo Controls (Located in student-photo-column)
  const photoInput = document.querySelector('#student-photo-input');
  const btnUploadPhoto = document.querySelector('#btn-upload-student-photo');
  const btnRemovePhoto = document.querySelector('#btn-remove-student-photo');
  const photoPreviewImg = document.querySelector('#student-photo-preview-img');
  const photoPlaceholder = document.querySelector('#student-photo-placeholder');

  // Summary State Elements
  const studentSection = document.querySelector('#student-section');
  const studentEditCard = document.querySelector('#student-edit-card');
  const studentSummaryCard = document.querySelector('#student-summary-card');
  const btnEditStudent = document.querySelector('#btn-edit-student');
  const btnCollapseStudent = document.querySelector('#btn-collapse-student');
  const summaryPhotoImg = document.querySelector('#summary-student-photo');
  const summaryName = document.querySelector('#summary-student-name');
  const summaryDetails = document.querySelector('#summary-student-details');

  const fieldMap = {
    prefix: prefixSelect,
    firstName: firstNameInput,
    lastName: lastNameInput,
    grade: gradeSelect,
    studentNumber: numberInput,
    academicYear: yearInput
  };

  /**
   * Clears the validation error display for a specific field.
   * @param {string} fieldName
   */
  function clearFieldError(fieldName) {
    const el = fieldMap[fieldName];
    if (!el) return;

    el.removeAttribute('aria-invalid');
    el.classList.remove('is-invalid');

    const errorContainer = formElement.querySelector(`#error-${fieldName}`);
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
    }
  }

  /**
   * Sets the validation error display for a specific field.
   * @param {string} fieldName
   * @param {string} message
   */
  function setFieldError(fieldName, message) {
    const el = fieldMap[fieldName];
    if (!el) return;

    el.setAttribute('aria-invalid', 'true');
    el.classList.add('is-invalid');

    let errorContainer = formElement.querySelector(`#error-${fieldName}`);
    if (!errorContainer) {
      errorContainer = document.createElement('span');
      errorContainer.id = `error-${fieldName}`;
      errorContainer.className = 'form-error-msg';
      errorContainer.setAttribute('role', 'alert');
      el.parentElement.appendChild(errorContainer);
    }

    el.setAttribute('aria-describedby', `error-${fieldName}`);
    errorContainer.textContent = message;
    errorContainer.style.display = 'flex';
  }

  /**
   * Validates a single field on blur or change.
   * @param {string} fieldName
   */
  function validateFieldOnBlur(fieldName) {
    const currentStudent = projectStore.getState().student || {};
    const { errors } = validateStudentInformation(currentStudent);

    if (errors[fieldName]) {
      setFieldError(fieldName, errors[fieldName]);
    } else {
      clearFieldError(fieldName);
    }
  }

  // Bind input and change events to update store immediately
  Object.entries(fieldMap).forEach(([field, input]) => {
    if (!input) return;

    input.addEventListener('input', (e) => {
      clearFieldError(field);
      // Preserve exact student number input without artificial zero-padding
      updateStudentField(field, e.target.value);
    });

    input.addEventListener('change', (e) => {
      clearFieldError(field);
      updateStudentField(field, e.target.value);
      validateFieldOnBlur(field);
    });

    input.addEventListener('blur', () => {
      validateFieldOnBlur(field);
    });
  });

  // Photo Upload Handler
  async function handleStudentPhoto(file) {
    if (!file) return;

    if (!isSupportedImage(file)) {
      showToast('ไม่รองรับประเภทไฟล์นี้ (รองรับ JPG, PNG, WebP, BMP, HEIC)', 'warning');
      return;
    }

    try {
      const decoded = await decodeHeicIfNeeded(file);
      const dimensions = await getImageDimensions(decoded.blob);
      const previewUrl = createPreviewUrl(decoded.blob);

      updateStudentPhoto({
        file,
        previewUrl,
        mimeType: decoded.mimeType,
        width: dimensions.width,
        height: dimensions.height
      });

      showToast('อัปโหลดรูปนักเรียนเรียบร้อย', 'success');
    } catch (err) {
      console.error('Student photo error:', err);
      showToast('ไม่สามารถเปิดไฟล์รูปภาพนักเรียนได้', 'danger');
    } finally {
      if (photoInput) photoInput.value = '';
    }
  }

  if (btnUploadPhoto && photoInput) {
    btnUploadPhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.click();
    });
  }

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleStudentPhoto(file);
      }
    });
  }

  if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', () => {
      clearStudentPhoto();
      showToast('ลบรูปนักเรียนเรียบร้อย', 'info');
    });
  }

  // Summary State Toggles
  function showSummaryView() {
    if (studentEditCard && studentSummaryCard) {
      studentEditCard.style.display = 'none';
      studentSummaryCard.style.display = 'flex';
    }
  }

  function showEditView() {
    if (studentEditCard && studentSummaryCard) {
      studentSummaryCard.style.display = 'none';
      studentEditCard.style.display = 'block';
      firstNameInput?.focus();
    }
  }

  if (btnCollapseStudent) {
    btnCollapseStudent.addEventListener('click', () => {
      const { valid } = validateStudentInformation(projectStore.getState().student);
      if (valid) {
        showSummaryView();
      } else {
        validateAndHighlightStudentForm();
      }
    });
  }

  if (btnEditStudent) {
    btnEditStudent.addEventListener('click', () => {
      showEditView();
    });
  }

  // Subscribe to store to update form fields and summary display
  projectStore.subscribe((state) => {
    const student = state.student || {};
    const photo = state.studentPhoto;

    if (prefixSelect && prefixSelect.value !== student.prefix) {
      prefixSelect.value = student.prefix || 'ด.ช.';
    }
    if (firstNameInput && firstNameInput.value !== student.firstName) {
      firstNameInput.value = student.firstName || '';
    }
    if (lastNameInput && lastNameInput.value !== student.lastName) {
      lastNameInput.value = student.lastName || '';
    }
    if (gradeSelect && gradeSelect.value !== student.grade) {
      gradeSelect.value = student.grade || '';
    }
    if (numberInput && numberInput.value !== student.studentNumber) {
      numberInput.value = student.studentNumber || '';
    }
    if (yearInput && yearInput.value !== student.academicYear) {
      yearInput.value = student.academicYear || '';
    }

    if (filenamePreview) {
      filenamePreview.textContent = generatePdfFilename(student);
    }

    // Photo preview in edit state
    if (photo?.previewUrl) {
      if (photoPreviewImg) {
        photoPreviewImg.src = photo.previewUrl;
        photoPreviewImg.style.display = 'block';
      }
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
      if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-flex';
      if (btnUploadPhoto) btnUploadPhoto.textContent = 'เปลี่ยนรูป';
    } else {
      if (photoPreviewImg) {
        photoPreviewImg.removeAttribute('src');
        photoPreviewImg.style.display = 'none';
      }
      if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
      if (btnRemovePhoto) btnRemovePhoto.style.display = 'none';
      if (btnUploadPhoto) btnUploadPhoto.textContent = 'เลือกรูปถ่าย';
    }

    // Photo & info in summary state
    if (summaryName) {
      const full = `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim();
      summaryName.textContent = full || 'ยังไม่ได้ระบุชื่อนักเรียน';
    }
    if (summaryDetails) {
      const parts = [];
      if (student.grade) parts.push(`ชั้น ${student.grade}`);
      if (student.studentNumber) parts.push(`เลขที่ ${student.studentNumber}`);
      if (student.academicYear) parts.push(`ปีการศึกษา ${student.academicYear}`);
      summaryDetails.textContent = parts.join(' • ') || 'กรุณากรอกข้อมูลนักเรียน';
    }
    if (summaryPhotoImg) {
      if (photo?.previewUrl) {
        summaryPhotoImg.src = photo.previewUrl;
        summaryPhotoImg.style.display = 'block';
      } else {
        summaryPhotoImg.removeAttribute('src');
        summaryPhotoImg.style.display = 'none';
      }
    }
  });

  // Initial populate from store
  const initialState = projectStore.getState();
  const initialStudent = initialState.student || {};
  if (prefixSelect && initialStudent.prefix) prefixSelect.value = initialStudent.prefix;
  if (firstNameInput && initialStudent.firstName) firstNameInput.value = initialStudent.firstName;
  if (lastNameInput && initialStudent.lastName) lastNameInput.value = initialStudent.lastName;
  if (gradeSelect && initialStudent.grade) gradeSelect.value = initialStudent.grade;
  if (numberInput && initialStudent.studentNumber) numberInput.value = initialStudent.studentNumber;
  if (yearInput && initialStudent.academicYear) yearInput.value = initialStudent.academicYear;

  if (filenamePreview) {
    filenamePreview.textContent = generatePdfFilename(initialStudent);
  }
}

/**
 * Validates all student information fields, renders errors, and focuses the first invalid element.
 * Used by action buttons (preview, export) before proceeding.
 *
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateAndHighlightStudentForm() {
  const currentStudent = projectStore.getState().student || {};
  const result = validateStudentInformation(currentStudent);

  if (!formInstance) return result;

  const fieldKeys = ['prefix', 'firstName', 'lastName', 'grade', 'academicYear'];
  let firstInvalidElement = null;

  fieldKeys.forEach((key) => {
    const errorContainer = formInstance.querySelector(`#error-${key}`);
    const input = formInstance.querySelector(`[name="${key}"]`);

    if (result.errors[key]) {
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('is-invalid');
        if (!firstInvalidElement) {
          firstInvalidElement = input;
        }
      }

      let errEl = errorContainer;
      if (!errEl && input) {
        errEl = document.createElement('span');
        errEl.id = `error-${key}`;
        errEl.className = 'form-error-msg';
        errEl.setAttribute('role', 'alert');
        input.parentElement.appendChild(errEl);
      }
      if (errEl) {
        errEl.textContent = result.errors[key];
        errEl.style.display = 'flex';
        input?.setAttribute('aria-describedby', `error-${key}`);
      }
    } else if (input) {
      input.removeAttribute('aria-invalid');
      input.classList.remove('is-invalid');
      if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
      }
    }
  });

  if (firstInvalidElement && typeof firstInvalidElement.focus === 'function') {
    firstInvalidElement.focus();
  }

  return result;
}

/**
 * Clears all validation errors from the student form.
 */
export function clearAllFormValidationErrors() {
  if (!formInstance) return;

  const errorMessages = formInstance.querySelectorAll('.form-error-msg');
  errorMessages.forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });

  const invalidInputs = formInstance.querySelectorAll('.is-invalid');
  invalidInputs.forEach((el) => {
    el.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
  });
}
