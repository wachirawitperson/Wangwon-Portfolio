/**
 * Student Information Form Component
 * Accessible input form capturing essential student details for cover generation and file naming.
 * Features reactive two-way binding, accessible ARIA validation, and focus management.
 */
import { projectStore, updateStudentField } from '../portfolio/portfolio-state.js';
import { generatePdfFilename } from '../core/filename-utils.js';
import { validateStudentInformation } from '../core/student-utils.js';

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

  // Subscribe to store to update form fields (e.g. after reset) and update filename badge
  projectStore.subscribe((state) => {
    const student = state.student || {};

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
  });

  // Initial populate from store
  const initialStudent = projectStore.getState().student || {};
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
