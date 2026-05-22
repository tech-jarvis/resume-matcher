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

Match the Google Doc / PDF template structure exactly.

Return ONLY valid JSON (no markdown fences):
{
  "name": "full name",
  "designation": "role title e.g. Senior Software Engineer",
  "summary": "3-5 sentence professional summary paragraph",
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
    { "name": "Project name", "link": "URL if any", "description": "2-4 sentence description" }
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
- Extract only facts from the resume; do not invent employers, dates, or credentials
- workExperience: most recent first; 3-6 bullets per recent role where available
- Group skills into the six categories; leave empty string if unknown
- achievements, projects, certificates: include all found in source`;

export const TAILOR_RESUME_JD_PROMPT = `You are a Devsinc resume specialist. Tailor the resume JSON to align with the job description while keeping the Devsinc template structure.

Return ONLY the same JSON shape (no markdown fences). You may:
- Rewrite summary to emphasize JD-relevant strengths and keywords
- Reorder and reword work experience bullets (keep facts truthful; do not invent roles or employers)
- Reorder skill lists to lead with JD-relevant technologies
- Prioritize and lightly reword project descriptions for JD fit
- Adjust designation only if the source resume supports a more accurate title for this JD

You must NOT:
- Invent employers, dates, degrees, certifications, or projects not in the source
- Remove entire jobs or education entries
- Change contact.salesEmail from sales@devsinc.com`;
