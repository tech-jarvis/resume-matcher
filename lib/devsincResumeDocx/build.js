import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ShadingType,
  AlignmentType,
} from "docx";
import { DEVSINC_SALES_EMAIL } from "../devsincResumeSchema.js";
import { PAGE, TABLE, COLORS, FONT, SIZE } from "./constants.js";
import {
  NO_BORDERS,
  run,
  para,
  sectionTitle,
  bulletParagraph,
  jobTitleRow,
  projectBlock,
  getDocumentNumbering,
} from "./helpers.js";

function skillLine(label, value) {
  if (!value) return null;
  return para(
    [
      run(`${label}: `, { bold: true, color: COLORS.sectionDark }),
      run(value),
    ],
    { after: 60 }
  );
}

function buildMainColumn(resume) {
  const blocks = [
    para([run(resume.name, { bold: true, size: SIZE.name, color: COLORS.sectionDark })], {
      after: 40,
    }),
  ];

  if (resume.designation) {
    blocks.push(
      para([run(resume.designation, { size: SIZE.designation, color: COLORS.section })], {
        after: 80,
      })
    );
  }

  if (resume.summary) {
    blocks.push(para(resume.summary, { after: 160 }));
  }

  if (resume.workExperience?.length > 0) {
    blocks.push(...sectionTitle("Work Experience"));
    for (const job of resume.workExperience) {
      const dates = [job.startDate, job.endDate].filter(Boolean).join(" – ");
      blocks.push(jobTitleRow(job.title || "Role", dates));
      const company = [job.company, job.location].filter(Boolean).join(" | ");
      if (company) {
        blocks.push(para(company, { after: 60, italics: true, color: COLORS.textMuted }));
      }
      for (const b of job.bullets || []) {
        blocks.push(bulletParagraph(b));
      }
    }
  }

  if (resume.projects?.length > 0) {
    blocks.push(...sectionTitle("Projects"));
    for (const p of resume.projects) {
      blocks.push(
        ...projectBlock({
          name: p.name,
          link: p.link,
          linkLabel: p.link ? p.linkLabel || `Link to ${p.name}` : undefined,
          description: p.description,
        })
      );
    }
  }

  return blocks;
}

function buildSidebarColumn(resume) {
  const blocks = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 200 },
      children: [run("PHOTO", { size: SIZE.small, color: COLORS.photoPlaceholder })],
    }),
    ...sectionTitle("Contact"),
  ];

  const email = resume.contact?.email?.trim();
  blocks.push(
    para(email || "Add your devsinc email here", {
      after: 60,
      color: email ? COLORS.text : COLORS.photoPlaceholder,
    })
  );
  blocks.push(
    para(resume.contact?.salesEmail || DEVSINC_SALES_EMAIL, {
      after: 140,
      color: COLORS.section,
    })
  );

  const skills = [
    skillLine("Technology", resume.skills?.technology),
    skillLine("Architecture", resume.skills?.architecture),
    skillLine("Platform", resume.skills?.platform),
    skillLine("Database", resume.skills?.database),
    skillLine("Wireframe tools", resume.skills?.wireframeTools),
    skillLine("Project Management Tools", resume.skills?.projectManagementTools),
  ].filter(Boolean);

  if (skills.length > 0) {
    blocks.push(...sectionTitle("Skills"));
    blocks.push(...skills);
  }

  if (resume.achievements?.length > 0) {
    blocks.push(...sectionTitle("Achievements"));
    for (const a of resume.achievements) {
      blocks.push(
        para([run(a.title, { bold: true })], { before: 60, after: 30 })
      );
      if (a.description) {
        blocks.push(para(a.description, { after: 60, italics: true, color: COLORS.textMuted }));
      }
    }
  }

  if (resume.certificates?.length > 0) {
    blocks.push(...sectionTitle("Certificates"));
    for (const c of resume.certificates) {
      blocks.push(para(c, { after: 60 }));
    }
  }

  if (resume.education?.length > 0) {
    blocks.push(...sectionTitle("Education"));
    for (const e of resume.education) {
      if (e.institution) {
        blocks.push(para([run(e.institution, { bold: true })], { before: 60, after: 30 }));
      }
      if (e.degree) blocks.push(para(e.degree, { after: 30 }));
      if (e.major) blocks.push(para(`Major in ${e.major}`, { after: 30 }));
      const locYear = [e.location, e.year].filter(Boolean).join(" — ");
      if (locYear) blocks.push(para(locYear, { after: 80 }));
    }
  }

  return blocks;
}

function layoutCell(children, widthDxa, sidebar = false) {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: NO_BORDERS,
    verticalAlign: VerticalAlign.TOP,
    shading: sidebar
      ? { fill: COLORS.sidebarBg, type: ShadingType.CLEAR }
      : undefined,
    margins: {
      top: 80,
      bottom: 80,
      left: sidebar ? 120 : 0,
      right: sidebar ? 80 : 160,
    },
    children,
  });
}

/**
 * Generate Devsinc resume .docx from normalized resume JSON.
 * @param {import('@/lib/devsincResumeSchema').normalizeDevsincResume extends Function ? ReturnType<normalizeDevsincResume> : object} resume
 */
export async function buildDevsincResumeDocx(resume) {
  const name = resume.name || "Candidate";
  const filename = `${name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}-Devsinc-Resume.docx`;

  const layoutTable = new Table({
    width: { size: TABLE.width, type: WidthType.DXA },
    columnWidths: [TABLE.leftCol, TABLE.rightCol],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          layoutCell(buildMainColumn(resume), TABLE.leftCol, false),
          layoutCell(buildSidebarColumn(resume), TABLE.rightCol, true),
        ],
      }),
    ],
  });

  const doc = new Document({
    numbering: getDocumentNumbering(),
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE.body, color: COLORS.text },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: {
              top: PAGE.margin,
              right: PAGE.margin,
              bottom: PAGE.margin,
              left: PAGE.margin,
            },
          },
        },
        children: [layoutTable],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename };
}
