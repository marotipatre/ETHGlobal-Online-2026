import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await readFile(join(process.cwd(), "public", "relayer-health.json"), "utf8");
    return Response.json(JSON.parse(content), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ updatedAt: 0, sources: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
