/**
 * Student Information Form Component
 * Accessible input form capturing essential student details for cover generation and file naming.
 */
import { projectStore } from '../portfolio/portfolio-state.js';
import { generatePdfFilename } from '../core/filename-utils.js';

export function initStudentForm(formElement) {
  if (!formElement) return;

  const prefixSelect = formElement.querySelector('#student-prefix');
  const firstNameInput = formElement.querySelector('#student-firstname');
  const lastNameInput = formElement.querySelector('#student-lastname');
  const gradeSelect = formElement.querySelector('#student-grade');
  const numberInput = formElement.querySelector('#student-number');
  const yearInput = formElement.querySelector('#student-year');
  const filenamePreview = document.querySelector('#preview-filename-badge');

  function syncFormToState() {
    const student = {
      prefix: prefixSelect ? prefixSelect.value : '',
      firstName: firstNameInput ? firstNameInput.value.trim() : '',
      lastName: lastNameInput ? lastNameInput.value.trim() : '',
      grade: gradeSelect ? gradeSelect.value : '',
      studentNumber: numberInput ? numberInput.value.trim() : '',
      academicYear: yearInput ? yearInput.value.trim() : ''
    };

    projectStore.setState({ student });
  }

  // Attach input listeners
  [prefixSelect, firstNameInput, lastNameInput, gradeSelect, numberInput, yearInput].forEach(
    (input) => {
      if (input) {
        input.addEventListener('input', syncFormToState);
        input.addEventListener('change', syncFormToState);
      }
    }
  );

  // Subscribe to state to update filename badge
  projectStore.subscribe((state) => {
    if (filenamePreview) {
      const generatedName = generatePdfFilename(state.student);
      filenamePreview.textContent = generatedName;
    }
  });

  // Initial populate from store
  const currentStudent = projectStore.getState().student || {};
  if (prefixSelect && currentStudent.prefix) prefixSelect.value = currentStudent.prefix;
  if (firstNameInput && currentStudent.firstName) firstNameInput.value = currentStudent.firstName;
  if (lastNameInput && currentStudent.lastName) lastNameInput.value = currentStudent.lastName;
  if (gradeSelect && currentStudent.grade) gradeSelect.value = currentStudent.grade;
  if (numberInput && currentStudent.studentNumber) numberInput.value = currentStudent.studentNumber;
  if (yearInput && currentStudent.academicYear) yearInput.value = currentStudent.academicYear;

  if (filenamePreview) {
    filenamePreview.textContent = generatePdfFilename(currentStudent);
  }
}
