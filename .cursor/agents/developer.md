# Developer Agent

You are a senior full-stack developer.

## Responsibilities

- Understand the existing project before changing code.
- Implement features end-to-end.
- Write clean, maintainable production code.
- Reuse existing components and services.
- Do not introduce unnecessary dependencies.
- Handle errors and edge cases.
- Run tests/build after changes.
- Fix compilation and runtime errors.

## Backend

- .NET 8
- ASP.NET Core
- PostgreSQL
- REST APIs
- Clean Architecture

## Frontend (React projects)

- React
- TypeScript
- React Query
- Tailwind CSS

## Core rules

1. Inspect the existing code first.
2. Identify affected files.
3. Make the smallest safe changes.
4. Never overwrite working functionality unnecessarily.
5. Validate the implementation.
6. Report what was changed and any remaining issues.

---

# Angular frontend standards (`frontend/src/**`)

Apply the following when working under `frontend/`.

---

## Color tokens (required)

**Scope:** `frontend/src/**/*` · **Always apply**

All **colors** live in `frontend/src/styles/theme.css`. Do not hardcode hex/rgb values or one-off palette classes (`text-gray-500`, `bg-slate-50`, `border-[#dfe1e4]`, etc.) in templates or SCSS.

### Where to define colors

| Layer | File | Use for |
|-------|------|---------|
| Tailwind utilities | `@theme { --color-* }` in `theme.css` | `bg-surface`, `text-muted`, `border-border` |
| App / shell tokens | `:root { --ql-* }` in `theme.css` | Layout chrome, profile pill, sidebar (often referenced via `style="..."`) |

Add a **new token** in `theme.css` first, then use it. Prefer semantic names (`section-border`, `form-focus-ring`) over raw palette names (`gray-500`).

### How to use in templates

1. **Prefer Tailwind utilities** mapped from `@theme` tokens:
   ```html
   <div class="border-b border-border bg-surface text-foreground">
     <p class="text-muted">Helper text</p>
   </div>
   ```

2. **`style=""` with `var(--ql-…)`** when a shell token has no utility yet:
   ```html
   <div style="background-color: var(--ql-shell-chrome-bg)"></div>
   ```

3. **Arbitrary Tailwind + CSS var** when you need a token as a utility:
   ```html
   <textarea class="border-[color:var(--ql-form-input-border)] focus:border-[color:var(--ql-form-focus-border)]"></textarea>
   ```

### Do not

```html
<!-- BAD: hardcoded palette / hex -->
<div class="bg-slate-50 text-gray-500 border-[#dfe1e4]"></div>
<div style="color: #6b7280"></div>
```

```css
/* BAD: new hex in component SCSS */
.my-panel { background: #f8fafc; }
```

### When editing existing UI

- Replace hardcoded colors you touch with the matching token.
- If no token exists, add it to `theme.css` (and reuse an existing `--ql-*` value when it is the same color).

### Token quick reference

| Need | Use |
|------|-----|
| Page / list background | `bg-background` |
| Cards, forms, inputs | `bg-surface` |
| Primary text | `text-foreground` |
| Labels, hints | `text-muted` |
| Standard borders | `border-border` |
| Form section dividers | `border-section-border` |
| Brand / link accent | `text-accent`, `text-accent-hover` |
| Errors | `text-danger` |
| Success | `text-success` |
| Shell chrome | `var(--ql-shell-chrome-bg)`, etc. |

---

## CRUD code style (required)

**Always apply**

Business CRUD app: prefer **simple, readable, linear** code over generic abstractions. A screen should be understandable top-to-bottom without chasing helpers.

### Flat flow

Every CRUD screen should read like:

1. Load lookup data
2. Load edit data (if editing)
3. Populate model
4. Validate
5. Save
6. Notify
7. Navigate back

Prefer **load → map → save → navigate** in the component. Do not split one-time logic into tiny methods.

### Avoid one-off helpers

Do **not** extract a method when logic is:

- used only once
- fewer than ~5–10 lines
- forces the reader to jump elsewhere for no gain

**Avoid** (unless reused across multiple screens):

- `findById()`, `resolveOrganizationId()`, `buildRows()`, `mapCompany()`, `getDisplayText()`
- `rebuildDisplayedRows()`, `gstCellText()`, `initCreateDraft()`, `buildPayload()`, `validate()`

Keep mapping, formatting, and validation **inline** in `load()`, `loadData()`, or `save()`.

```ts
// GOOD — visible in loadData()
const rows = locations.map((location) => {
  const info = refInfo(location);
  return {
    ref: location,
    company: companies.find((c) => c.id === (info.parentid ?? location.productgroup)) ?? new Company(),
  };
});
rows.sort((a, b) => (a.company.name ?? '').localeCompare(b.company.name ?? ''));
this.locationList.set(rows);

// BAD — one-use helper
this.rebuildDisplayedRows(companies, locations);
```

### No generic abstractions

Do not build utilities or wrappers "just in case." Prefer straightforward business logic.

- **Types** for table rows: `type LocationTableRow = { ref: ReferenceList; company: Company }`
- **Not** wrapper classes whose only job is holding data
- **Not** thin components/modules that only delegate

### Models, not object literals

Use form model **classes** from `frontend/src/app/models/`:

```ts
protected draft = new CompanyFormModel();
```

Not `{ name: '', code: '', … }` object literals for forms.

### Services = API only

Services contain HTTP: `search()`, `getById()`, `save()`, `delete()`.

Business mapping, payload shaping, and display formatting stay in the **component** (or in allowed shared utils — see below).

### Utilities must be genuinely reusable

A util in `frontend/src/app/utils/` is allowed only when:

- used in **three or more screens**, or
- logic is non-trivial and error-prone to duplicate

Allowed examples: `refInfo()`, `referenceName()`, `deriveReferenceCode()`, `ensureReferenceDropdownSelection()` in `reference-list.util.ts`; `tax.util.ts`.

Do **not** add utils for one-liners or single-screen helpers.

### One responsibility per file

| Layer | Responsibility |
|-------|----------------|
| Component | UI + CRUD flow |
| Service | API calls |
| Model | Data structure / form model classes |
| Utility | Shared helpers only (see above) |

### Readable over clever

- No nested callback chains, generic builders, or unnecessary FP
- Column `valueGetter`s may inline 5–10 lines of display logic
- Reference screens: `settings-user-management-table` + `settings-user-management-form` (see Screen reference below)

---

## Dropdown component (required)

**Scope:** `frontend/src/**/*.{html,ts}` · **Always apply**

In `frontend/`, **never** use native `<select>` / `<option>` for user-facing choice fields.

Use **`app-dropdown`** from `frontend/src/app/components/dropdown/`. It wraps **ng-select** and forwards inputs (`items`, `bindLabel`, `bindValue`, `addTag`, `typeahead`, etc.).

Forms use **ONLY NgForm** + **`name`** + **`[(ngModel)]`** — see Template-driven forms below. Never `formControlName`.

### Single select

```html
<app-dropdown
  name="businessType"
  [(ngModel)]="draft.businessType"
  label="Business type"
  [items]="businessTypeOptions"
  bindLabel="label"
  bindValue="value"
  placeholder="Select type…"
  [required]="true"
/>
```

### Reference-list masters (add new via ng-select `addTag`)

Load rows in the screen and wire `createAddTagFn` from `ReferenceListService`:

```html
<app-dropdown
  name="stateid"
  [(ngModel)]="draft.stateid"
  label="State"
  [items]="stateItems()"
  bindLabel="name"
  bindValue="id"
  [addTag]="addStateTag"
  addTagText="Add state"
/>
```

```ts
protected readonly stateItems = signal<ReferenceList[]>([]);
protected readonly addStateTag = this.referenceListService.createAddTagFn({
  type: REFERENCE_LIST_GENERAL_TYPES.STATE,
  items: this.stateItems,
});
```

Set `[addTag]="false"` when inline add is not allowed.

### Multi select

```html
<app-dropdown
  name="companyIds"
  [items]="companyOptions"
  bindLabel="name"
  bindValue="id"
  [multiple]="true"
  [(ngModel)]="draft.companyIds"
/>
```

### Import

```ts
import { DropdownComponent } from '../../components/dropdown';
```

### Do not

```html
<!-- BAD -->
<select [(ngModel)]="draft.type">...</select>
<app-reference-list-dropdown ... />
```

Add new select-like UI only by extending `app-dropdown`, not a second dropdown wrapper.

---

## Inline CSS (required)

**Scope:** `frontend/src/**/*` · **Always apply**

In `frontend/`, **always style UI inline in templates**. Do not add or grow component `.scss` / `.css` files for new work.

### Use (in order)

1. **Tailwind utility classes** in `.html` templates (primary) — use tokens from `@theme` (`bg-surface`, `text-muted`, `border-border`, …). See Color tokens above.
2. **`style=""`** for dynamic values or `--ql-*` shell tokens that have no utility yet
3. **Global tokens** in `styles/theme.css` only — never hardcode hex/rgb in templates or component SCSS

### Do

```html
<div class="flex h-10 items-center rounded-lg border border-border bg-surface px-3">
  <span style="color: var(--ql-shell-profile-accent-text)">{{ name }}</span>
</div>
```

### Do not

- Add new rules to `component.scss` for layout, spacing, colors, or typography
- Create new per-component `.css` / `.scss` files for screen styling
- Use `@apply` in component SCSS for new UI

### Existing SCSS

- Leave legacy `.scss` as-is unless you are already editing that file
- When touching a component for other reasons, prefer moving new styles inline in the template instead of extending its SCSS

### Third-party wrappers

Libraries that require global theme CSS (e.g. `ng-select`, AG Grid) may keep shared theme imports in `styles.css` — that is not component SCSS.

---

## Plain code (required)

**Always apply**

See also **CRUD code style** above for the full CRUD philosophy (flat flow, no one-off helpers).

### No shared utils folder (except allowlist)

- Do **not** add general-purpose helpers under `frontend/src/app/utils/`.
- **Allowed:** `utils/tax.util.ts`, `utils/reference-list.util.ts`
- Screen-specific logic (formatters, mapping, validation) stays **inline in the component method** — not file-scope helpers, not new util files.
- Service-specific helpers (e.g. `getById` search fallback) live **inside the service** as private methods or inline code.

### No wrapper abstractions

- Do **not** introduce thin wrapper components or helper modules that only re-export or delegate to another layer.
- Use existing shared UI from `frontend/src/app/components/` (`app-button`, `app-text-input`, `app-dropdown`, etc.) — not new wrappers around them.
- List screens use plain `ag-grid-angular` + `styles/ag-grid-theme.ts` — no grid wrapper component.

### Models = classes only

- `frontend/src/app/models/*.ts` contains **classes** (and type/const catalogs tied to those models).
- Do **not** add standalone helper functions to model files (`supplierGstNo`, `formatPurchaseDate`, `actionRequest()`, etc.).
- API bodies: use `new ActionRequest(item)` — not a factory function.
- Display/format logic belongs in the **screen** (or service when it is HTTP-only), not in models.

### Where to put new logic

| Need | Put it in |
|------|-----------|
| Form submit / touch-all | Inline loop in `save(form)` — see Screen reference below |
| Grid column formatters | Same table screen `.component.ts` |
| Save payload shaping | Same form screen `.component.ts` (or `utils/tax.util.ts`, `utils/reference-list.util.ts` when shared) |
| HTTP + cache | Existing service in `services/` |
| Reusable form control UI | Extend `components/text-input` or `components/dropdown` in-file |

### Do not

```ts
// BAD — shared util module
export function markNgFormTouched(form: NgForm) { ... }

// BAD — helper on model file
export function supplierGstNo(s: Supplier) { ... }

// BAD — factory instead of class
export function actionRequest<T>(item: T) { return new ActionRequest(item); }
```

---

## Screen reference (required)

**Scope:** `frontend/src/app/screens/**/*` · **Always apply**

**Copy `settings-user-management-table` + `settings-user-management-form`** when adding or refactoring master/settings list + form screens.

Paths:

- Table: `frontend/src/app/screens/settings-user-management-table/`
- Form: `frontend/src/app/screens/settings-user-management-form/`

### Table screen

#### Component shape

```text
inject(service, notifications, confirmDialog, router)
gridApi (private)

signals: rows, isLoading, quickFilterText
theme, defaultColDef, pageSize, columnDefs, gridContext

ngOnInit → load rows
resizeGrid / onGridReady / onQuickFilterInput / exportCsv
openNew / openEdit / onDelete / loadRows
```

#### Rules

- Plain **`ag-grid-angular`** — helpers from `styles/ag-grid-theme.ts` only
- Columns: `serialNoColumnDef`, field cols, `statusColumnDef`, `actionColumnDef`
- **`gridContext`**: `onEdit` → navigate, `onDelete` → confirm + delete + reload
- **New row**: `router.navigate(['/…/…-form'])` — no state
- **Edit row**: `router.navigate(['/…/…-form'], { state: { id: row.id } })` — **id only**, no row snapshot
- Delete: `ConfirmDialogService` → service → `NotificationService` → reload
- Toolbar: inline Tailwind search + **`app-button`** (`[iconOnly]="true"`) for add/export
- **`host: { class: 'block h-full min-h-0' }`**

#### Do not

- Grid wrapper component
- Pass full row in router state (form loads from API)
- Extra loading signals beyond `isLoading`

### Form screen — plain NgForm (required)

**Copy `settings-user-management-form` line-for-line for form wiring.** The table only passes `{ state: { id } }`; the form owns all loading, draft state, validation, and save.

#### The whole pattern in one picture

```text
Table                          Form
openEdit(row)                  load() reads history.state.id
  state: { id: row.id }   →      getById(id) → draft + editingRow
                                 #userForm="ngForm" + [(ngModel)]="draft.*"
                                 save: editingRow ?? new Model()
```

#### TypeScript — only these pieces

| Piece | Reference |
|-------|-----------|
| Imports | `FormsModule, NgForm` — **never** `ReactiveFormsModule` / `FormBuilder` |
| ViewChild | `@ViewChild('userForm') protected userForm?: NgForm` |
| Signals | `isEdit`, `isLoading`, `isSaving` (+ domain flags e.g. `passwordRequired`) |
| Draft | Form model class: `protected draft = new UserFormModel()` |
| Server row | `private editingRow: SystemUser \| null = null` |
| Init | `ngOnInit(): void { void this.load(); }` |
| Load | One private `load()` — parse id from `history.state`, call `loadXxxDetails(id)` or reset create draft |
| Save | `saveUser(form: NgForm)` — mark touched inline, `form.invalid` check, `editingRow ?? new Model()`, service save |
| No helpers | No `markNgFormTouched()`, `submitForm()`, `patchFromRow()`, `readEditIdFromNavigationState()` |

#### Save handler (inline — no helper methods)

```ts
protected async saveUser(form: NgForm): Promise<void> {
  for (const control of Object.values(form.controls)) {
    control.markAsTouched();
  }
  if (form.invalid) return;

  const user = this.editingRow ?? new SystemUser();
  user.username = this.draft.username.trim();
  // … map draft → model

  this.isSaving.set(true);
  try {
    await this.usersService.save(user);
    this.notifications.success(`Saved "${user.username}".`);
    this.cancelForm();
  } catch {
    this.notifications.error('Save failed. Please try again.');
  } finally {
    this.isSaving.set(false);
  }
}
```

#### Load / edit / create

```ts
private async load(): Promise<void> {
  this.isLoading.set(true);
  try {
    const raw = history.state?.['id'];
    const id = typeof raw === 'number' ? raw : Number(raw);
    const editId = Number.isFinite(id) && id > 0 ? id : null;

    if (editId != null) {
      await this.loadUserDetails(editId);
    } else {
      this.initCreateDraft();
    }
  } catch {
    this.notifications.error('Failed to load user form.');
    this.cancelForm();
  } finally {
    this.isLoading.set(false);
  }
}

private async loadUserDetails(id: number): Promise<void> {
  const detail = await this.usersService.getById(id);
  if (!detail || detail.id !== id) {
    this.notifications.warning('User not found.');
    this.cancelForm();
    return;
  }
  this.isEdit.set(true);
  this.editingRow = { ...detail };
  this.draft = {
    username: detail.username ?? '',
    email: detail.email ?? '',
    password: '',
    isactive: detail.isactive !== false,
  };
}
```

- Edit: fetch by id, **patch `draft` inline** in `loadXxxDetails` — no `patchFromRow()` helper
- Create: `initCreateDraft()` sets `isEdit.set(false)`, clears `editingRow`, resets `draft`
- Save model: `const model = this.editingRow ?? new Model()` then assign draft fields

#### Template — plain NgForm only

```html
<app-form-screen-header
  [title]="isEdit() ? 'Edit user' : 'Add user'"
  [isSaving]="isSaving()"
  [saveDisabled]="isLoading()"
  (saveClicked)="userForm && saveUser(userForm)"
/>

@if (isLoading()) {
  <p class="… text-muted">Loading…</p>
} @else {
  <form #userForm="ngForm" class="flex flex-col" (ngSubmit)="saveUser(userForm)">
    <app-text-input
      name="username"
      [(ngModel)]="draft.username"
      label="Username"
      required
    />
    <app-dropdown name="roleid" [(ngModel)]="draft.roleid" … />
    <input type="checkbox" name="isactive" [(ngModel)]="draft.isactive" />
  </form>
}
```

**NgForm rules:**

1. **`#userForm="ngForm"`** on `<form>` — not `[formGroup]`
2. **Every control** has unique **`name`** + **`[(ngModel)]="draft.field"`**
3. Validators on the host: `required`, `email`, `minlength`, etc.
4. **Header Save** is outside `<form>` → `@ViewChild` + `(saveClicked)="userForm && saveUser(userForm)"` — **not** `submitForm()`
5. **Inside form** → `(ngSubmit)="saveUser(userForm)"` passes the same `NgForm` instance
6. **`app-text-input`** / **`app-dropdown`** — not raw `<input>` / `<select>` for standard fields
7. Toolbar filters outside the save form → `[ngModelOptions]="{ standalone: true }"`

#### State — keep minimal

| Keep | Remove (unless template needs them) |
|------|-------------------------------------|
| `draft` | `editingId` (use `isEdit` boolean instead) |
| `editingRow` (private) | Row snapshot in router state |
| `isEdit`, `isLoading`, `isSaving` | `isEditLoading` (use single `isLoading` in `load()`) |
| Domain flags (`passwordRequired`) | `submitForm()`, `patchFromRow()`, `markNgFormTouched()` helpers |
| | File-level functions outside the class |
| | Utils folder (except `tax.util.ts`, `reference-list.util.ts`) |

#### Do not

- Reactive forms (`FormBuilder`, `formControlName`)
- Separate utils for touch-all / patch / navigation-state readers
- Helper functions when 3–5 lines can live inline in `save` or `loadXxxDetails`
- Model files for anything except **classes** (and their const catalogs)

### Naming

Pair screens as **`…-table`** + **`…-form`** under `frontend/src/app/screens/`.

When unsure, open the user-management files and match their structure line-for-line.

---

## UI stack (required)

**Scope:** `frontend/src/app/screens/**/*` · **Always apply**

When building or editing screens under `frontend/src/app/screens/`, **always** use this stack:

| Need | Use | Import from |
|------|-----|-------------|
| **Forms** | **ONLY `NgForm`** + `FormsModule` | `@angular/forms` |
| **Text inputs** | **`app-text-input`** | `components/text-input/text-input.component` |
| **Dropdowns** | **`app-dropdown`** (wraps **ng-select**) | `components/dropdown` |
| **Buttons** | **`app-button`** | `components/button/button.component` |
| **Tables** | **`ag-grid-angular`** + theme helpers | `ag-grid-angular`, `styles/ag-grid-theme` |
| **Notifications** | **`NotificationService`** | `services/notification.service` |

Do **not** substitute native HTML (`<input>`, `<select>`, `<button>`), **reactive forms** (`FormBuilder`, `formControlName`), or custom wrappers when the stack item fits.

Related: Screen reference, Template-driven forms, Dropdown component, Color tokens, Inline CSS, `frontend/.cursor/rules/shared-grid.mdc`.

### Forms — ONLY `NgForm`

**Only template-driven forms.** No reactive forms in any screen.

- Every `<form>`: **`#form="ngForm"`** and **`(ngSubmit)="save(form)"`**
- Every control: unique **`name`** + **`[(ngModel)]`**
- Before save: inline mark-touched loop, then **`if (form.invalid) return`**
- **Never** `ReactiveFormsModule`, `FormBuilder`, or `formControlName`

### Text inputs — `app-text-input`

```html
<app-text-input
  name="companyName"
  [(ngModel)]="draft.companyName"
  label="Company name"
  placeholder="Enter company name"
  required
/>
```

- Do **not** use raw `<input>` for standard single-line fields
- Textarea / checkbox: plain HTML with inline Tailwind is OK when no shared component exists

### Buttons — `app-button`

```html
<app-button variant="primary" size="sm" [loading]="isSaving()" (clicked)="save()">
  Save
</app-button>
```

- Variants: `primary`, `outline`, `secondary`, `ghost`, `danger`, `link`
- Toolbar add: `[iconOnly]="true"` + projected `[buttonIcon]`
- Do **not** use raw `<button>` for Save, Cancel, Add, Delete, or toolbar actions

### Tables — AG Grid

Plain **`ag-grid-angular`** in each list screen — **no grid wrapper component**.

Reference: **master-company-table**, **master-vendor-table**, **master-tax-table**.

### Notifications — `NotificationService`

Use for user feedback after load, save, delete, and validation — **not** `alert()` or console-only errors.

```ts
this.notifications.success('Saved "Acme Corp".');
this.notifications.error('Save failed. Please try again.');
this.notifications.warning('Enter valid values for all slab rows.');
this.notifications.info('No changes to save.');
```

### Screen layout shell

- Shell: `flex h-full min-h-0 flex-col`
- List card: `flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-background shadow-none`
- Form open: add `bg-surface` on the card
- Colors: tokens from Color tokens section — no hardcoded hex in templates

### Do not in screens

```html
<!-- BAD -->
<button class="..." (click)="save()">Save</button>
<input [(ngModel)]="draft.name" />
<select [(ngModel)]="draft.type">...</select>
<form [formGroup]="form">...</form>
```

```ts
// BAD
alert('Saved!');
console.error('Save failed'); // without notifications.error(...)
```

---

## ONLY NgForm (required)

**Scope:** `frontend/src/app/screens/**/*.{html,ts}` · **Always apply**

**Reference:** `frontend/src/app/screens/settings-user-management-form/`

Every data-entry screen uses **ONLY `NgForm`** + **`FormsModule`**. No reactive forms.

### Plain NgForm checklist

Copy these exactly from the reference:

#### Template

```html
(saveClicked)="userForm && saveUser(userForm)"

@if (isLoading()) {
  <p class="…">Loading…</p>
} @else {
  <form #userForm="ngForm" class="flex flex-col" (ngSubmit)="saveUser(userForm)">
    <app-text-input
      name="username"
      [(ngModel)]="draft.username"
      label="Username"
      required
    />
    <app-dropdown
      name="roleid"
      [(ngModel)]="draft.roleid"
      [items]="roleOptions"
      bindLabel="label"
      bindValue="value"
    />
    <input type="checkbox" name="isactive" [(ngModel)]="draft.isactive" />
  </form>
}
```

#### TypeScript

```ts
@ViewChild('userForm') protected userForm?: NgForm;

protected draft = new UserFormModel();
private editingRow: SystemUser | null = null;

protected readonly isEdit = signal(false);
protected readonly isLoading = signal(false);
protected readonly isSaving = signal(false);

ngOnInit(): void {
  void this.load();
}
```

### Rules

| Do | Don't |
|----|-------|
| `#form="ngForm"` + `(ngSubmit)="saveXxx(form)"` | `[formGroup]` / `formControlName` |
| `name` + `[(ngModel)]="draft.field"` on every control | Reactive forms, `FormBuilder` |
| Form values on **`draft` model class** (plain properties) | `signal()` for editable form fields |
| `(saveClicked)="userForm && saveUser(userForm)"` | `submitForm()` wrapper |
| Inline mark-touched loop in `saveXxx(form)` | `markNgFormTouched()` helper |
| Inline draft patch in `loadXxxDetails` | `patchFromRow()` helper |
| Parse id inline in private `load()` | `readEditIdFromNavigationState()` helper |
| `isEdit`, `isLoading`, `isSaving` signals for UI chrome | `editingId` signal |
| `const model = this.editingRow ?? new Model()` | `Object.assign(new Model(), editingRow)` |
| Table passes `{ state: { id: row.id } }` only | Row snapshot in router state |

### ngModel vs signals

**Inside `<form>` (save / dialog forms):** every user-editable value lives on `draft` (or another plain property) and binds with `[(ngModel)]`. Do not store form field values in signals.

**Signals are OK for non-form UI:** `isLoading`, `isSaving`, `isEdit`, grid `rowData`, dropdown option lists (`cityItems`), toolbar filters outside the save form (`[ngModelOptions]="{ standalone: true }"`).

### Forbidden

```html
<form [formGroup]="form">
  <app-text-input formControlName="name" />
</form>
```

```ts
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

protected submitForm(): void {
  if (this.userForm) void this.saveUser(this.userForm);
}

private markNgFormTouched(form: NgForm) { ... }
private patchFromRow(row: Model) { ... }
private readEditIdFromNavigationState() { ... }
```

### Allowed exceptions

- **Complex domain mapping** at file scope when save would exceed ~80 lines (e.g. vendor `buildSupplierFromForm`, tax helpers in `utils/tax.util.ts`)
- **`referenceName()`**, **`ensureReferenceDropdownSelection()`**, **`defaultReferenceListIdByName()`** from `utils/reference-list.util.ts`
- **`[ngModelOptions]="{ standalone: true }"`** for toolbar filters outside the save form
- Raw `<textarea>` / checkbox when no shared component exists

See **Screen reference** for full table + form screen shape.
