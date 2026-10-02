# Wangwon Portfolio — Agent Instructions

## Project Rule

This is an existing production project.
Do not rebuild, rewrite, or redesign stable systems without a concrete verified reason.

Before changing code:
1. inspect the current repository state
2. inspect relevant existing implementation
3. preserve established architecture
4. identify the smallest safe change

Never assume the project is starting from scratch.

---

## Skill Usage Policy

The following installed skills are part of the standard development workflow for this repository.

### 1. UI UX Pro Max

For ANY task that changes or reviews something users can see or interact with, consult UI UX Pro Max before implementation.

This includes:

- UI design
- UX review
- layout
- responsive behavior
- mobile behavior
- accessibility
- forms
- navigation
- buttons
- menus
- cards
- modals
- scrolling
- sticky/fixed elements
- previews
- typography
- spacing
- colors
- Light/Dark mode
- touch interactions
- hover/focus/pressed states
- loading/error/empty states
- visual hierarchy
- UI polish

When using UI UX Pro Max:

1. identify the dominant UX problem first
2. search the relevant domain rather than applying generic design advice
3. prioritize:
   - Accessibility
   - Touch & Interaction
   - Layout & Responsive
   - Performance
   - Navigation
   - Forms & Feedback
   - Typography & Color
   - Visual polish
4. apply recommendations to the existing Wangwon Portfolio design system
5. do not redesign stable interfaces merely because another style exists
6. preserve established product decisions

For significant UI work, perform a pre-delivery UI/UX review before declaring completion.

---

### 2. Addy Osmani Agent Skills

Use the installed agent-skills automatically according to the task.

#### New feature or behavior change

Use:
- frontend-ui-engineering when UI is involved
- incremental-implementation
- test-driven-development

Work in small, reviewable changes.

#### Bug fix

Use:
- debugging-and-error-recovery
- test-driven-development

Reproduce the bug before fixing it whenever practical.
Add a regression test that proves the bug is fixed.

#### UI implementation

Use:
- frontend-ui-engineering

Combine it with UI UX Pro Max:
UI UX Pro Max determines UX/design requirements.
Frontend UI Engineering translates those requirements into maintainable implementation.

#### Before merge or completion

Use:
- code-review-and-quality

Review:
1. correctness
2. readability and simplicity
3. architecture
4. security
5. performance

#### Performance-sensitive work

For changes involving:
- large image sets
- previews
- scrolling
- rendering
- PDF generation
- export
- memory usage
- long lists

perform a web-performance review when relevant.

---

## Testing Policy

Tests are evidence, not decoration.

For behavioral changes:
1. create/update a focused test
2. verify the test genuinely exercises the user behavior
3. implement the change
4. run focused tests
5. run appropriate regression tests before completion

For browser interactions, test real browser behavior.

Do NOT make a failing interaction test pass by using:
- dispatchEvent('click')
- force: true
- JavaScript DOM manipulation that bypasses normal user interaction

unless the feature itself specifically requires programmatic dispatch.

For clickable/touchable UI, verify with normal click/tap behavior.

---

## UX Quality Rules

### Touch

Important mobile controls must have usable hit targets and spacing.

Do not rely on hover for required functionality.

### Sticky / Fixed UI

Sticky or fixed elements must never:
- cover interactive controls
- obscure keyboard focus
- prevent pointer/touch interaction
- hide scrollable content

Check stacking contexts, z-index, overflow and safe spacing.

### Responsive

The app must not introduce unintended horizontal page scrolling.

Verify important UI at least at:
- 320px
- 390px
- tablet
- desktop

### Accessibility

Maintain:
- visible focus states
- semantic controls
- labels for form controls
- accessible names for icon buttons
- sufficient contrast
- keyboard-accessible alternatives
- reduced-motion support where animation exists

Do not communicate important state using color alone.

---

## Wangwon Portfolio Locked Product Decisions

Preserve these requirements unless the user explicitly changes them.

### Workflow

The app has exactly three main sections:

1. ข้อมูลนักเรียน
2. เพิ่มรูปภาพและจัดหน้า
3. ตั้งค่าและสร้างไฟล์

Navigation buttons should use concise labels:

- หน้าถัดไป
- ย้อนกลับ

### Student data

Student fields include:

- คำนำหน้า
- ชื่อ
- นามสกุล
- ชั้น
- เลขที่
- ปีการศึกษา

Student number must remain normal human input:
1, 2, 3

Never zero-pad the student number.

### Page order

Portfolio order:

1. Front Cover
2. Activity Images
3. Back Cover

Front and back covers are locked and cannot be deleted or reordered.

Student photo is separate from activity images.

### File naming

Student base filename follows the student name.

Activity image sequence uses:

_01
_02
_03

etc.

Do not confuse image sequence numbering with the student number.

### School identity

Official English school name:

BANWANGWON SCHOOL

This spelling is locked.

Do not change it to:
BAN WANGWON SCHOOL

Do not redraw or recolor the official school logo.
Use the bundled official asset.

### Mobile page grid

Section 2 mobile layout must remain exactly 3 cards per row at supported phone widths without horizontal overflow.

### Section 3

Section 3 is the Final Review & Export workspace.

Preview is the primary task.

Settings may scroll independently.

The "สร้างไฟล์เอกสาร" export area should remain visible/sticky instead of scrolling away with the settings.

### Watermark

Watermark scale must support up to 100%.

### Theme

Light/Dark mode changes application UI only.

Generated Portfolio/PDF output must not change based on the app theme.

### Privacy

Student images are processed locally.

Do not introduce remote upload of student images without explicit user approval.

### Persistence

Sensitive student/project content must not be moved into localStorage.

Preserve the existing IndexedDB autosave/recovery architecture.

---

## Regression Protection

Do not regress these previously fixed areas:

1. closed modal backdrops must not intercept clicks
2. hidden image file input must remain available for Add Image
3. student photo is not an activity image
4. Object URLs must be managed/revoked safely
5. UI theme must not affect generated document output
6. PDF/export/autosave engines must not be rewritten during UI polish without a verified bug
7. real mobile clicks must work without test-only pointer bypasses

---

## Scope Discipline

When the user asks for UI polish:
do not rewrite backend/export engines.

When the user asks for a bug fix:
do not redesign unrelated UI.

When the user asks for one feature:
do not add adjacent features without approval.

Prefer the smallest change that fully solves the problem.

---

## Completion Standard

Do not report "100% complete" solely because tests pass.

Before declaring a task complete:

1. verify requirements against the user's request
2. run relevant tests
3. verify actual browser behavior when UI changed
4. check desktop and mobile when responsive UI changed
5. perform UI UX Pro Max review when user-facing UI changed
6. perform code-review-and-quality on meaningful code changes
7. check git status
8. report:
   - what changed
   - files changed
   - tests executed
   - actual pass/fail results
   - visual/browser verification
   - known remaining issues
   - git status

Never invent test counts or claim verification that was not actually performed.