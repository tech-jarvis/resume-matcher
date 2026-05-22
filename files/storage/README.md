# Devsinc file storage

## Resume template

- **`Devsinc-Resume-Template.pdf`** — Official Devsinc client-facing resume layout (reference for AI parsing and Word export).

Google Doc (source template): https://docs.google.com/document/d/16ppUGyxsCRj_KJ7rb0IEhaOVX6ZoSU-W1z34fwurgfA/edit

Word export reproduces: two-column layout, teal `#16BBBA` section headers, `#0A4F4E` name, `#E8FAFA` sidebar, work experience / projects / education on the left, contact / skills / achievements on the right.

Download in the app via **Resume converter** / **Resume updater**, or:

```
GET /api/templates/devsinc-resume
```

Programmatic path: `lib/devsincTemplate.js` → `DEVSINC_RESUME_TEMPLATE_PATH`.
