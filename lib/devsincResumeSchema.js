/** Devsinc client-facing resume shape (matches official Word/PDF template). */

export const DEVSINC_SALES_EMAIL = "sales@devsinc.com";

export function normalizeDevsincResume(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    name: String(r.name || "Candidate").trim(),
    designation: String(r.designation || "").trim(),
    summary: String(r.summary || "").trim(),
    contact: {
      email: String(r.contact?.email || "").trim(),
      salesEmail: String(r.contact?.salesEmail || DEVSINC_SALES_EMAIL).trim(),
    },
    skills: {
      technology: String(r.skills?.technology || "").trim(),
      architecture: String(r.skills?.architecture || "").trim(),
      platform: String(r.skills?.platform || "").trim(),
      database: String(r.skills?.database || "").trim(),
      wireframeTools: String(r.skills?.wireframeTools || "").trim(),
      projectManagementTools: String(r.skills?.projectManagementTools || "").trim(),
    },
    workExperience: normalizeJobs(r.workExperience),
    achievements: normalizeAchievements(r.achievements),
    projects: normalizeProjects(r.projects),
    certificates: Array.isArray(r.certificates)
      ? r.certificates.map((c) => String(c).trim()).filter(Boolean)
      : [],
    education: normalizeEducation(r.education),
  };
}

function normalizeJobs(jobs) {
  if (!Array.isArray(jobs)) return [];
  return jobs
    .map((j) => ({
      title: String(j.title || "").trim(),
      startDate: String(j.startDate || "").trim(),
      endDate: String(j.endDate || "").trim(),
      company: String(j.company || "").trim(),
      location: String(j.location || "").trim(),
      bullets: Array.isArray(j.bullets)
        ? j.bullets.map((b) => String(b).trim()).filter(Boolean)
        : [],
    }))
    .filter((j) => j.title || j.company);
}

function normalizeAchievements(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((a) =>
      typeof a === "string"
        ? { title: a.trim(), description: "" }
        : {
            title: String(a.title || "").trim(),
            description: String(a.description || "").trim(),
          }
    )
    .filter((a) => a.title);
}

function normalizeProjects(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((p) => ({
      name: String(p.name || "").trim(),
      link: String(p.link || "").trim(),
      description: String(p.description || "").trim(),
    }))
    .filter((p) => p.name);
}

function normalizeEducation(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((e) => ({
      institution: String(e.institution || "").trim(),
      degree: String(e.degree || "").trim(),
      major: String(e.major || "").trim(),
      location: String(e.location || "").trim(),
      year: String(e.year || "").trim(),
    }))
    .filter((e) => e.institution || e.degree);
}

export const PARSE_DEVSINC_RESUME_PROMPT = `You are a Devsinc HR specialist. Convert the resume into Devsinc's official client-facing resume template (two-column Word layout: main column = name, summary, work experience, projects, certificates, education; sidebar = contact, skills, achievements).

CRITICAL — COMPLETE EXTRACTION (do not summarize, shorten, or omit):
- Include EVERY job, project, certificate, education entry, achievement, and skill mentioned in the source
- Copy ALL bullet points for each role verbatim or near-verbatim (do not reduce 8 bullets to 3)
- Preserve full project descriptions, links, award details, and certification names
- Summary: use the source professional summary in full; if none exists, write a comprehensive paragraph from the resume without leaving out major experience
- Do NOT invent employers, dates, or credentials not in the source
- Do NOT drop minor roles, internships, freelance work, or older jobs if they appear in the source

Return ONLY valid JSON (no markdown fences):
{
  "name": "full name",
  "designation": "role title e.g. Senior Software Engineer",
  "summary": "full professional summary — preserve detail from source, not a short blurb",
  "contact": {
    "email": "@devsinc.com email if present, else empty string",
    "salesEmail": "sales@devsinc.com"
  },
  "skills": {
    "technology": "comma-separated languages/frameworks",
    "architecture": "comma-separated patterns e.g. MVVM, MVC",
    "platform": "comma-separated platforms",
    "database": "comma-separated databases",
    "wireframeTools": "comma-separated design tools",
    "projectManagementTools": "comma-separated PM/dev tools"
  },
  "workExperience": [
    {
      "title": "job title",
      "startDate": "Mon YYYY",
      "endDate": "Present or Mon YYYY",
      "company": "company name",
      "location": "City, Country",
      "bullets": ["achievement bullet", "another bullet"]
    }
  ],
  "achievements": [
    { "title": "Award or competition name", "description": "result or detail" }
  ],
  "projects": [
    { "name": "Project name", "link": "URL if any", "description": "complete description from source — do not truncate" }
  ],
  "certificates": ["certificate name by issuer"],
  "education": [
    {
      "institution": "university name",
      "degree": "degree name",
      "major": "major if any",
      "location": "City, Country",
      "year": "graduation year"
    }
  ]
}

Rules:
- workExperience: most recent first; include ALL roles and ALL bullets from the source
- Group every skill from the source into the six categories; leave empty string only if truly unknown
- achievements, projects, certificates, education: include every item from the source`;

export const TAILOR_RESUME_JD_PROMPT = `You are a Devsinc resume specialist. Tailor the resume JSON to align with the job description while keeping the Devsinc template structure.

CRITICAL — PRESERVE ALL CONTENT:
- Keep the same number of jobs, bullets, projects, certificates, education entries, and achievements
- Do NOT delete, merge, or shorten bullets or descriptions to save space
- You may reorder bullets/skills/projects for JD relevance and reword phrasing for keywords
- Do NOT summarize away metrics, technologies, or responsibilities

Return ONLY the same JSON shape (no markdown fences). You may:
- Rewrite summary to emphasize JD-relevant strengths while keeping factual breadth
- Reorder and reword work experience bullets (same facts; no invented roles)
- Reorder skill lists to lead with JD-relevant technologies
- Lightly reword project descriptions for JD fit without removing detail

You must NOT:
- Invent employers, dates, degrees, certifications, or projects not in the source
- Remove jobs, bullets, projects, certs, education, or achievements
- Change contact.salesEmail from sales@devsinc.com`;
