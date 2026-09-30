# Excel Batch Certificate Download

## Build
- Add an Excel upload area to the certificate view and read each workbook entirely in the browser.
- Match common spreadsheet column names to the certificate fields: full name, start/end dates, year, course, department, institution, learning topic, issue date, and pronouns.
- Display every valid spreadsheet row in a selectable list with individual checkboxes and a select-all control.
- Keep the existing manual certificate editor and preview available alongside the batch workflow.
- Add a Download Certificate action that generates one separate PDF download for every selected row, using a safe filename based on the person’s name.
- Show clear messages for unsupported files, missing required columns, empty sheets, and unselected rows.

## Verification
- Upload the supplied workbook and confirm its row maps correctly into the certificate.
- Test individual selection, select all, deselection, and downloading multiple separate PDF files.
- Confirm generated certificates remain one-page A4 documents with Appointza branding only.
- Check the workflow on desktop and narrow screens.

## Technical details
- Parse `.xlsx` and `.xls` files in the browser; no upload, server, or saved data is involved.
- Build each selected certificate from its spreadsheet row and trigger separate browser PDF downloads sequentially.
- Normalize header names so capitalization and small wording differences still match known certificate fields.