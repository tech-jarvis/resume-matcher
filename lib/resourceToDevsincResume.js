import { normalizeDevsincResume, DEVSINC_SALES_EMAIL } from "@/lib/devsincResumeSchema";

/** Map full Devsinc resume → matcher database row. */
export function devsincResumeToResource(resume) {
  const tech = resume.skills?.technology || "";
  const parts = tech.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    id: Date.now(),
    name: resume.name || "",
    team: resume.workExperience?.[0]?.company || "",
    designation: resume.designation || "",
    primary: parts[0] || "",
    stacks: tech,
    exp: "",
    tz: "Anytime",
    industries: "",
    dep: "Normal",
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
