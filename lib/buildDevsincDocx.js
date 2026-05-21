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
  ShadingType,
} from "docx";

const BRAND = "16BBBA";
const BRAND_DARK = "0A4F4E";
function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { fill: BRAND_DARK, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? "—"),
            bold: opts.header || opts.bold,
            color: opts.header ? "FFFFFF" : "0D1F1F",
            size: opts.header ? 20 : 22,
          }),
        ],
      }),
    ],
  });
}

function labelRow(label, value) {
  return new TableRow({
    children: [
      cell(label, { width: 28, bold: true }),
      cell(value, { width: 72 }),
    ],
  });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: BRAND_DARK,
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22 })],
  });
}

export async function buildDevsincDocx(resource) {
  const name = resource.name || "Engineer";
  const filename = `${name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}-Devsinc-Resume.docx`;

  const profileTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell("DEVSINC — RESOURCE PROFILE", { header: true, width: 100 })],
      }),
      labelRow("Name", name),
      labelRow("Designation", resource.designation),
      labelRow("Team / Cluster", resource.team),
      labelRow("Employee ID", resource.id ? String(resource.id) : "TBD"),
      labelRow("Primary Stack", resource.primary),
      labelRow("Experience", resource.exp),
      labelRow("Timezone", resource.tz),
      labelRow("Project Dependency", resource.dep),
    ],
  });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "DEVSINC",
          bold: true,
          size: 40,
          color: BRAND_DARK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: "Standardized Engineer Resource Profile",
          size: 22,
          color: BRAND,
          italics: true,
        }),
      ],
    }),
    profileTable,
    sectionTitle("Professional Summary"),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: resource.summary || "Experienced engineer aligned with Devsinc delivery standards.",
          size: 22,
        }),
      ],
    }),
    sectionTitle("Technical Competencies"),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Primary: ", bold: true, size: 22 }),
        new TextRun({ text: resource.primary || "—", size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: "Full stack profile: ", bold: true, size: 22 }),
        new TextRun({ text: resource.stacks || "—", size: 22 }),
      ],
    }),
    sectionTitle("Domain Experience"),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: resource.industries || "—", size: 22 })],
    }),
  ];

  if (resource.highlights?.length > 0) {
    children.push(sectionTitle("Key Highlights"));
    for (const h of resource.highlights) {
      children.push(bullet(h));
    }
  }

  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "— Confidential · Devsinc Internal Resource Profile —",
          size: 18,
          color: "7A9494",
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80 },
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
          run: { font: "Calibri", size: 22 },
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
