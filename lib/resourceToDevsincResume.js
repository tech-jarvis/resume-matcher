import { normalizeDevsincResume, DEVSINC_SALES_EMAIL } from "@/lib/devsincResumeSchema";

function mergeSkillCategories(skills) {
  if (!skills) return "";
  return [
    skills.technology,
    skills.architecture,
    skills.platform,
    skills.database,
    skills.wireframeTools,
    skills.projectManagementTools,
  ]
    .filter(Boolean)
    .join(", ");
}

function inferExp(workExperience) {
  const current = workExperience?.[0];
  if (!current) return "";
  const dates = [current.startDate, current.endDate].filter(Boolean).join(" – ");
  return dates || "";
}

/** Map full Devsinc resume → matcher database row. */
export function devsincResumeToResource(resume) {
  const stacks = mergeSkillCategories(resume.skills);
  const parts = stacks.split(",").map((s) => s.trim()).filter(Boolean);
  const projectNames = (resume.projects || []).map((p) => p.name).filter(Boolean);

  return {
    id: Date.now(),
    name: resume.name || "",
    team: resume.workExperience?.[0]?.company || resume.team || "",
    designation: resume.designation || "",
    primary: parts[0] || resume.primary || "",
    stacks,
    exp: inferExp(resume.workExperience),
    tz: resume.tz || "Anytime",
    industries: projectNames.slice(0, 6).join(", ") || resume.industries || "",
    dep: resume.dep || "Normal",
  };
}

/** Map legacy matcher resource row → full Devsinc resume JSON. */
export function resourceToDevsincResume(resource) {
  const stacks = resource.stacks || "";
  const parts = stacks.split(",").map((s) => s.trim()).filter(Boolean);
  const primary = resource.primary || parts[0] || "";

  return normalizeDevsincResume({
    name: resource.name,
    designation: resource.designation,
    summary:
      resource.summary ||
      [
        resource.designation && `${resource.designation} with ${resource.exp || "relevant"} experience.`,
        primary && `Primary focus: ${primary}.`,
        resource.industries && `Industry experience: ${resource.industries}.`,
      ]
        .filter(Boolean)
        .join(" "),
    contact: {
      email: "",
      salesEmail: DEVSINC_SALES_EMAIL,
    },
    skills: {
      technology: [primary, ...parts.filter((p) => p !== primary)].join(", "),
      architecture: "",
      platform: "",
      database: "",
      wireframeTools: "",
      projectManagementTools: "",
    },
    workExperience: [],
    achievements: (resource.highlights || []).map((h) => ({
      title: h,
      description: "",
    })),
    projects: [],
    certificates: [],
    education: [],
  });
}
