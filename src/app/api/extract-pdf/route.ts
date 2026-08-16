import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const bundledPython =
  "C:\\Users\\sebin\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return Response.json({ message: "Upload a resume PDF." }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return Response.json({ message: "Upload a PDF file." }, { status: 400 });
  }

  const tempDir = await mkdtemp(join(tmpdir(), "career-bridge-"));
  const pdfPath = join(tempDir, file.name || "resume.pdf");
  const scriptPath = join(process.cwd(), "scripts", "extract_pdf_text.py");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(pdfPath, buffer);

    const { stdout } = await execFileAsync(bundledPython, [scriptPath, pdfPath], {
      maxBuffer: 1024 * 1024 * 4,
      windowsHide: true,
    });
    const text = stdout.trim();

    return Response.json({ text, length: text.length });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("pdfplumber")
        ? "Server PDF extractor is missing pdfplumber."
        : "Could not extract enough text from this PDF.";

    return Response.json({ message }, { status: 400 });
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
