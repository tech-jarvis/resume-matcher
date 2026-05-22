# Devsinc resume template structure

Source: `files/storage/Devsinc_-_Resume_Template_.docx` (export from [Google Doc](https://docs.google.com/document/d/16ppUGyxsCRj_KJ7rb0IEhaOVX6ZoSU-W1z34fwurgfA/edit))

Run `npm run resume:extract-template` after placing a valid `.docx` export to refresh `docs/TEMPLATE_STRUCTURE.json`.

## Layout (two-column table)

| Property | Value |
|----------|--------|
| Page | US Letter **12240 × 15840** DXA |
| Margins | **720** DXA (0.5 inch) all sides |
| Table width | **9360** DXA |
| Left column (main) | **6240** DXA (~4.3 in) |
| Right column (sidebar) | **3120** DXA (~2.2 in) |
| Table borders | None |
| Sidebar shading | **#D5E8F0**, `ShadingType.CLEAR` |

## Left column (main)

1. **Name** — 14pt, bold, dark teal `#0A4F4E`
2. **Designation / tagline** — 11pt, teal `#16BBBA`
3. **Summary** — 10pt body
4. **WORK EXPERIENCE** — section title + teal underline (paragraph border)
   - Job title (bold) + dates (right-aligned tab)
   - `Company | Location` (italic, muted)
   - Bullets via `LevelFormat.BULLET` numbering (not Unicode ● in text)
5. **PROJECTS** — section + underline
   - Project name as **external hyperlink** when URL present
   - Link label line + description

## Right column (sidebar)

1. **PHOTO** placeholder (centered, gray text)
2. **CONTACT** — section + underline  
   - `@devsinc.com` email  
   - `sales@devsinc.com`
3. **SKILLS** — bold category labels (`Technology:`, `Architecture:`, …)
4. **ACHIEVEMENTS** — bold title + italic detail
5. **CERTIFICATES**
6. **EDUCATION**

## Typography

| Element | Font | Size |
|---------|------|------|
| Body | Calibri (or Arial) | 10pt (20 half-pt) |
| Name | Calibri | 14pt (28 half-pt) |
| Section headers | Calibri | 11pt (22 half-pt), bold, teal |

## Colors

| Use | Hex |
|-----|-----|
| Section titles / rules | `#16BBBA` |
| Name | `#0A4F4E` |
| Sidebar background | `#D5E8F0` |
| Hyperlinks | `#0563C1` |
| Muted text | `#404040` |

## Generator

- Library: `lib/devsincResumeDocx/build.js` — `buildDevsincResumeDocx(resume)`
- CLI: `npm run resume:generate`
- Validate: `node scripts/office/validate.mjs <file.docx>` (Node; Vercel-safe)

Converter, updater, and API routes all call `buildDevsincResumeDocx`.
