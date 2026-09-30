# Combined PDF download

## Goal
Add an option that downloads the acceptance letter and internship certificate together as one PDF, with one document per A4 page.

## Changes
- Keep the existing single-document download for the currently selected preview.
- Add a **Download Both** action in the header.
- When selected, print the acceptance letter first and the certificate second in the same browser PDF download.
- Keep all generation in the browser with no server or saved personal data.
- Ensure the combined print view has exactly two A4 pages and does not duplicate or clip either document.
- Hide all editor chrome and Lovable branding from both single and combined PDF output; only the Appointza documents print.

## Verification
- Edit shared details and confirm they appear in both pages.
- Open the combined print flow and verify the output contains two pages in the correct order.
- Check desktop and mobile controls, then confirm the app builds without errors.
