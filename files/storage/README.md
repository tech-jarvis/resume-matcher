# Devsinc file storage

## Resume template

- **`Devsinc_-_Resume_Template_.docx`** — Official Word template (export from Google Doc below).
- **`Devsinc-Resume-Template.pdf`** — PDF reference copy.

**Important:** Replace the `.docx` with a real export from Google Docs (File → Download → Microsoft Word). A login HTML file will not work.

Google Doc: https://docs.google.com/document/d/16ppUGyxsCRj_KJ7rb0IEhaOVX6ZoSU-W1z34fwurgfA/edit

Generated resumes use `lib/devsincResumeDocx/build.js`:
- US Letter 12240×15840 DXA, 0.5″ margins
- Table 6240 + 3120 DXA columns, sidebar `#D5E8F0`
- `LevelFormat.BULLET` numbering, external hyperlinks on projects

```bash
npm run resume:generate
npm run resume:validate
npm run resume:extract-template   # after placing valid .docx
```

Download in the app via **Resume converter** / **Resume updater**, or:

```
GET /api/templates/devsinc-resume
```

Programmatic path: `lib/devsincTemplate.js` → `DEVSINC_RESUME_TEMPLATE_PATH`.
