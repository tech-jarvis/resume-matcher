/** Devsinc resume template — layout & typography (from template spec + PDF). */

export const PAGE = {
  width: 12240,
  height: 15840,
  margin: 720, // 0.5 inch
};

export const TABLE = {
  width: 9360,
  leftCol: 6240,
  rightCol: 3120,
};

export const COLORS = {
  sidebarBg: "D5E8F0",
  section: "16BBBA",
  sectionDark: "0A4F4E",
  text: "000000",
  textMuted: "404040",
  hyperlink: "0563C1",
  photoPlaceholder: "808080",
};

export const FONT = "Calibri";

/** Word font size in half-points */
export const SIZE = {
  body: 20, // 10pt
  name: 28, // 14pt
  designation: 22, // 11pt
  section: 22, // 11pt
  small: 18,
};

export const BULLET_REF = "devsinc-resume-bullets";

export const DEVSINC_NUMBERING = {
  config: [
    {
      reference: BULLET_REF,
      levels: [
        {
          level: 0,
          format: "bullet",
          text: "\u2022",
          alignment: "left",
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
