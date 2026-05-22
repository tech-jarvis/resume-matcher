import {
  Paragraph,
  TextRun,
  BorderStyle,
  AlignmentType,
  TabStopType,
  ExternalHyperlink,
  LevelFormat,
} from "docx";
import { COLORS, FONT, SIZE, BULLET_REF } from "./constants.js";

export const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

export function run(text, opts = {}) {
  return new TextRun({
    text: text ?? "",
    font: opts.font ?? FONT,
    size: opts.size ?? SIZE.body,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? COLORS.text,
    underline: opts.underline ? {} : undefined,
  });
}

export function para(children, opts = {}) {
  const runs =
    typeof children === "string"
      ? [run(children, { size: opts.size, color: opts.color, italics: opts.italics, bold: opts.bold })]
      : children;
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 80 },
    numbering: opts.bullet ? { reference: BULLET_REF, level: 0 } : undefined,
    border: opts.borderBottom
      ? {
          bottom: {
            color: COLORS.section,
            size: 6,
            style: BorderStyle.SINGLE,
            space: 1,
          },
        }
      : undefined,
    tabStops: opts.tabStops,
    children: runs,
  });
}

export function sectionTitle(title) {
  return [
    para([run(title.toUpperCase(), { bold: true, size: SIZE.section, color: COLORS.section })], {
      before: 200,
      after: 40,
    }),
    para([run(" ", { size: 8 })], { after: 100, borderBottom: true }),
  ];
}

export function bulletParagraph(text) {
  return new Paragraph({
    numbering: { reference: BULLET_REF, level: 0 },
    spacing: { after: 60 },
    children: [run(text)],
  });
}

export function jobTitleRow(title, dates) {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: 5800 }],
    children: [
      run(title, { bold: true, size: SIZE.body }),
      ...(dates ? [run(`\t${dates}`, { size: SIZE.body, color: COLORS.textMuted })] : []),
    ],
  });
}

export function projectBlock(project) {
  const blocks = [];
  if (project.link) {
    blocks.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new ExternalHyperlink({
            link: project.link,
            children: [
              run(project.name, {
                bold: true,
                color: COLORS.hyperlink,
                underline: true,
              }),
            ],
          }),
        ],
      })
    );
    if (project.linkLabel) {
      blocks.push(para(project.linkLabel, { after: 40, size: SIZE.small, color: COLORS.textMuted }));
    }
  } else {
    blocks.push(
      para([run(project.name, { bold: true, color: COLORS.sectionDark })], {
        before: 100,
        after: 40,
      })
    );
  }
  if (project.description) {
    blocks.push(para(project.description, { after: 100 }));
  }
  return blocks;
}

/** Numbering config with LevelFormat enum for Document */
export function getDocumentNumbering() {
  return {
    config: [
      {
        reference: BULLET_REF,
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 360, hanging: 180 },
              },
            },
          },
        ],
      },
    ],
  };
}
