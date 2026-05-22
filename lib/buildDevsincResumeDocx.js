import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from "docx";
import { DEVSINC_SALES_EMAIL } from "@/lib/devsincResumeSchema";

const BRAND = "16BBBA";
const BRAND_DARK = "0A4F4E";
const BODY_SIZE = 22;
const TITLE_SIZE = 36;
const SECTION_SIZE = 24;

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 320, after: 80 },
    border: {
      bottom: { color: BRAND, size: 6, style: BorderStyle.SINGLE, space: 4 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: SECTION_SIZE,
        color: BRAND_DARK,
      }),
    ],
  });
}

function bodyParagraph(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text: text || "—", size: BODY_SIZE })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: BODY_SIZE })],
  });
}

function skillLine(label, value) {
  if (!value) return null;
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: BODY_SIZE }),
      new TextRun({ text: value, size: BODY_SIZE }),
    ],
  });
}

function jobHeader(job) {
  const dates = [job.startDate, job.endDate].filter(Boolean).join(" – ");
  const children = [
    new TextRun({ text: job.title || "Role", bold: true, size: BODY_SIZE }),
  ];
  if (dates) {
    children.push(new TextRun({ text: `  ·  ${dates}`, size: BODY_SIZE, color: "5A7070" }));
  }
  return new Paragraph({
    spacing: { before: 160, after: 40 },
    children,
  });
}

function jobCompany(job) {
  const parts = [job.company, job.location].filter(Boolean);
  if (!parts.length) return null;
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: parts.join(" | "),
        italics: true,
        size: BODY_SIZE,
        color: "3D5C5C",
      }),
    ],
  });
}

export async function buildDevsincResumeDocx(resume) {
  const name = resume.name || "Candidate";
  const filename = `${name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}-Devsinc-Resume.docx`;

  const children = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: name,
          bold: true,
          size: TITLE_SIZE,
          color: BRAND_DARK,
        }),
      ],
    }),
  ];

  if (resume.designation) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: resume.designation,
            size: 26,
            color: BRAND,
          }),
        ],
      })
    );
  }

  if (resume.summary) {
    children.push(bodyParagraph(resume.summary, { after: 240 }));
  }

  if (resume.workExperience?.length > 0) {
    children.push(sectionHeading("Work Experience"));
    for (const job of resume.workExperience) {
      children.push(jobHeader(job));
      const companyLine = jobCompany(job);
      if (companyLine) children.push(companyLine);
      for (const b of job.bullets || []) {
        children.push(bullet(b));
      }
    }
  }

  children.push(sectionHeading("Contact"));
  if (resume.contact?.email) {
    children.push(bodyParagraph(resume.contact.email));
  }
  children.push(
    bodyParagraph(resume.contact?.salesEmail || DEVSINC_SALES_EMAIL)
  );

  const skillLines = [
    skillLine("Technology", resume.skills?.technology),
    skillLine("Architecture", resume.skills?.architecture),
    skillLine("Platform", resume.skills?.platform),
    skillLine("Database", resume.skills?.database),
    skillLine("Wireframe tools", resume.skills?.wireframeTools),
    skillLine("Project Management Tools", resume.skills?.projectManagementTools),
  ].filter(Boolean);

  if (skillLines.length > 0) {
    children.push(sectionHeading("Skills"));
    children.push(...skillLines);
  }

  if (resume.achievements?.length > 0) {
    children.push(sectionHeading("Achievements"));
    for (const a of resume.achievements) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: a.title, bold: true, size: BODY_SIZE })],
        })
      );
      if (a.description) children.push(bodyParagraph(a.description, { after: 80 }));
    }
  }

  if (resume.projects?.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const p of resume.projects) {
      const titleParts = [p.name];
      if (p.link) titleParts.push(p.link);
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: titleParts.join("\n"), bold: true, size: BODY_SIZE })],
        })
      );
      if (p.description) children.push(bodyParagraph(p.description, { after: 100 }));
    }
  }

  if (resume.certificates?.length > 0) {
    children.push(sectionHeading("Certificates"));
    for (const c of resume.certificates) {
      children.push(bullet(c));
    }
  }

  if (resume.education?.length > 0) {
    children.push(sectionHeading("Education"));
    for (const e of resume.education) {
      if (e.institution) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({ text: e.institution, bold: true, size: BODY_SIZE }),
            ],
          })
        );
      }
      if (e.degree) children.push(bodyParagraph(e.degree, { after: 40 }));
      if (e.major) children.push(bodyParagraph(`Major in ${e.major}`, { after: 40 }));
      const locYear = [e.location, e.year].filter(Boolean).join(" — ");
      if (locYear) children.push(bodyParagraph(locYear, { after: 120 }));
    }
  }

  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "www.devsinc.com",
          size: 18,
          color: BRAND,
        }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: BODY_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename };
}
