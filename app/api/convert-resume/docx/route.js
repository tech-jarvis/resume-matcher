import { buildDevsincDocx } from "@/lib/buildDevsincDocx";

export const runtime = "nodejs";

/** Regenerate DOCX from an already-parsed resource object */
export async function POST(request) {
  try {
    const { resource } = await request.json();
    if (!resource?.name) {
      return Response.json({ error: "Resource data with at least a name is required." }, { status: 400 });
    }

    const { buffer, filename } = await buildDevsincDocx(resource);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("DOCX export error:", err);
    return Response.json({ error: err.message ?? "Failed to generate document." }, { status: 500 });
  }
}
