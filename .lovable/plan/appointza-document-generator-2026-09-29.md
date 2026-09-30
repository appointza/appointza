# Appointza Document Generator

## Build
- Replace the blank page with a browser-only document generator matching the uploaded Appointza designs.
- Provide separate Acceptance Letter and Internship Certificate tabs with live A4 previews.
- Let users edit recipient name, dates, reporting person, course/year/institution, department or learning topic, pronouns, issue date, and signatory details.
- Add clear reset and PDF download controls; generate printable PDFs directly in the browser with no login, storage, or server.
- Keep long names and details readable through responsive text sizing and wrapping.

## Verification
- Check the complete edit-to-download flow on desktop and mobile layouts.
- Confirm generated PDFs are one-page A4 documents and visually inspect both outputs.
- Add page-specific title and social metadata.

## Technical details
- Use React state for temporary form values only; nothing is stored after the page closes.
- Use the browser print dialog for native “Save as PDF,” preserving selectable text and avoiding a backend.
- Define all branding, typography, print layout, and colors as semantic design tokens.
