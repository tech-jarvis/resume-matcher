import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  TabStopType,
  TabStopPosition,
} from "docx";
import { DEVSINC_SALES_EMAIL } from "@/lib/devsincResumeSchema";
import { DEVSINC_TEMPLATE as T } from "@/lib/devsincTemplateStyles";

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function run(text, opts = {}) {
  return new TextRun({
    text: text ?? "",
    font: T.font,
    size: opts.size ?? T.bodySize,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? T.text,
    underline: opts.underline ? {} : undefined,
  });
}

function para(children, opts = {}) {
  const runs = typeof children === "string" ? [run(children, opts)] : children;
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 100 },
    children: runs,
  });
}

/** Section title + teal rule (matches template underlines). */
function sectionBlock(title) {
  return [
    para([run(title.toUpperCase(), { bold: true, size: T.sectionSize, color: T.teal })], {
      before: 280,
      after: 40,
    }),
    new Paragraph({
      spacing: { after: 120 },
      border: {
        bottom: { color: T.teal, size: 10, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [run(" ", { size: 8 })],
    }),
  ];
}

function bulletItem(text) {
  return para(
    [
      run("● ", { color: T.teal, bold: true }),
      run(text, { size: T.bodySize }),
    ],
    { after: 70 }
  );
}

function jobBlock(job) {
  const dates = [job.startDate, job.endDate].filter(Boolean).join(" – ");
  const blocks = [
    new Paragraph({
      spacing: { before: 140, after: 50 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        run(job.title || "Role", { bold: true, size: T.bodySize }),
        ...(dates ? [run(`\t${dates}`, { size: T.bodySize, color: T.textMuted })] : []),
      ],
    }),
  ];
  const company = [job.company, job.location].filter(Boolean).join(" | ");
  if (company) {
    blocks.push(para(company, { after: 80, italics: true, color: T.textMuted }));
  }
  for (const b of job.bullets || []) {
    blocks.push(bulletItem(b));
  }
  return blocks;
}

function skillRow(label, value) {
  if (!value) return null;
  return para(
    [
      run(`${label}: `, { bold: true, color: T.tealDark, size: T.bodySize }),
      run(value, { size: T.bodySize }),
    ],
    { after: 70 }
  );
}

function buildMainColumn(resume) {
  const blocks = [
    para([run(resume.name, { bold: true, size: T.nameSize, color: T.tealDark })], {
      after: 40,
    }),
  ];

  if (resume.designation) {
    blocks.push(
      para([run(resume.designation, { size: T.designationSize, color: T.teal })], { after: 120 })
    );
  }

  if (resume.summary) {
    blocks.push(para(resume.summary, { after: 200 }));
  }

  if (resume.workExperience?.length > 0) {
    blocks.push(...sectionBlock("Work Experience"));
    for (const job of resume.workExperience) {
      blocks.push(...jobBlock(job));
    }
  }

  if (resume.projects?.length > 0) {
    blocks.push(...sectionBlock("Projects"));
    for (const p of resume.projects) {
      blocks.push(
        para([run(p.name, { bold: true, size: T.bodySize, color: T.tealDark })], {
          before: 100,
          after: 40,
        })
      );
      if (p.link) {
        blocks.push(para(p.link, { after: 40, color: T.teal, underline: true }));
      }
      if (p.description) {
        blocks.push(para(p.description, { after: 120 }));
      }
    }
  }

  if (resume.certificates?.length > 0) {
    blocks.push(...sectionBlock("Certificates"));
    for (const c of resume.certificates) {
      blocks.push(para(c, { after: 70 }));
    }
  }

  if (resume.education?.length > 0) {
    blocks.push(...sectionBlock("Education"));
    for (const e of resume.education) {
      if (e.institution) {
        blocks.push(
          para([run(e.institution, { bold: true, color: T.tealDark })], { before: 80, after: 40 })
        );
      }
      if (e.degree) blocks.push(para(e.degree, { after: 40 }));
      if (e.major) blocks.push(para(`Major in ${e.major}`, { after: 40 }));
      const locYear = [e.location, e.year].filter(Boolean).join(" — ");
      if (locYear) blocks.push(para(locYear, { after: 100 }));
    }
  }

  return blocks;
}

function buildSidebarColumn(resume) {
  const blocks = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [run("PHOTO", { size: T.smallSize, color: T.textLight })],
    }),
    ...sectionBlock("Contact"),
  ];

  const email = resume.contact?.email?.trim();
  if (email) {
    blocks.push(para(email, { after: 60 }));
  } else {
    blocks.push(para("Add your devsinc email here", { after: 60, color: T.textLight }));
  }
  blocks.push(
    para(resume.contact?.salesEmail || DEVSINC_SALES_EMAIL, {
      after: 160,
      color: T.teal,
    })
  );

  const skillLines = [
    skillRow("Technology", resume.skills?.technology),
    skillRow("Architecture", resume.skills?.architecture),
    skillRow("Platform", resume.skills?.platform),
    skillRow("Database", resume.skills?.database),
    skillRow("Wireframe tools", resume.skills?.wireframeTools),
    skillRow("Project Management Tools", resume.skills?.projectManagementTools),
  ].filter(Boolean);

  if (skillLines.length > 0) {
    blocks.push(...sectionBlock("Skills"));
    blocks.push(...skillLines);
  }

  if (resume.achievements?.length > 0) {
    blocks.push(...sectionBlock("Achievements"));
    for (const a of resume.achievements) {
      blocks.push(
        para([run(a.title, { bold: true, size: T.bodySize })], { before: 80, after: 40 })
      );
      if (a.description) {
        blocks.push(para(a.description, { after: 80 }));
      }
    }
  }

  return blocks;
}

function cell(children, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    shading: opts.shading ? { fill: T.sidebarBg } : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: opts.sidebar ? 140 : 0, right: opts.sidebar ? 80 : 140 },
    children,
  });
}

export async function buildDevsincResumeDocx(resume) {
  const name = resume.name || "Candidate";
  const filename = `${name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}-Devsinc-Resume.docx`;

  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          cell(buildMainColumn(resume), 68),
          cell(buildSidebarColumn(resume), 32, { sidebar: true, shading: true }),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: T.font, size: T.bodySize, color: T.text },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [layoutTable],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename };
}
