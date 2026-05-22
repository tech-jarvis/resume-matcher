#!/usr/bin/env node
/**
 * Generate sample Devsinc resume .docx (CLI / CI).
 * Usage: node scripts/generate-resume.mjs [output.docx]
 */
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { buildDevsincResumeDocx } from "../lib/devsincResumeDocx/build.js";
import { normalizeDevsincResume } from "../lib/devsincResumeSchema.js";
// @/ alias not available in standalone node scripts

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out =
  process.argv[2] || path.join(__dirname, "../files/storage/sample-output.docx");

const sample = normalizeDevsincResume({
  name: "Alex Engineer",
  designation: "Senior Software Engineer",
  summary:
    "Results-driven engineer with 5 years of experience building scalable applications. Skilled in modern stacks with a focus on clean code and user-centric design.",
  contact: { email: "alex@devsinc.com", salesEmail: "sales@devsinc.com" },
  skills: {
    technology: "React, Node.js, TypeScript, Python",
    architecture: "MVVM, MVC, Microservices",
    platform: "Web, AWS, Docker",
    database: "PostgreSQL, Redis, MongoDB",
    wireframeTools: "Figma, Adobe XD",
    projectManagementTools: "Jira, GitHub, GitLab",
  },
  workExperience: [
    {
      title: "Senior Software Engineer",
      startDate: "Sep 2021",
      endDate: "Present",
      company: "Devsinc",
      location: "Lahore, Pakistan",
      bullets: [
        "Lead development of high-traffic applications with 99.9% uptime.",
        "Mentor junior developers and conduct code reviews.",
      ],
    },
  ],
  achievements: [
    {
      title: "IEEE Competition 2021",
      description: "First position on national level.",
    },
  ],
  projects: [
    {
      name: "Tappze",
      link: "https://play.google.com/store/apps/details?id=com.tappze",
      linkLabel: "Link to Tappze on Google Play Store",
      description:
        "Next-generation business card app for instant contact sharing via QR code.",
    },
  ],
  certificates: ["Intro to Python by Microsoft"],
  education: [
    {
      institution: "Information Technology University (ITU)",
      degree: "Bachelor of Computer Sciences",
      major: "Computer Science",
      location: "Lahore, PK",
      year: "2023",
    },
  ],
});

const { buffer, filename } = await buildDevsincResumeDocx(sample);
await fs.writeFile(out, buffer);
console.log(`Generated ${out} (${filename})`);
