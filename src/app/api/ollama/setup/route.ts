import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { OLLAMA_MODEL } from "@/lib/ai/ollama";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

async function run(command: string, args: string[]) {
  return execFileAsync(command, args, {
    timeout: 120_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    confirmed?: boolean;
  } | null;

  if (!body?.confirmed) {
    return Response.json(
      { message: "User permission is required before installing local AI tools." },
      { status: 400 },
    );
  }

  try {
    await run("ollama", ["--version"]);
  } catch {
    try {
      await run("winget", [
        "install",
        "Ollama.Ollama",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--silent",
      ]);
    } catch {
      return Response.json(
        {
          message:
            "Could not install Ollama automatically. Install Ollama manually, then run: ollama pull llama3.2:3b",
        },
        { status: 500 },
      );
    }
  }

  try {
    await run("ollama", ["pull", OLLAMA_MODEL]);

    return Response.json({
      message: `Ollama is ready with ${OLLAMA_MODEL}.`,
      model: OLLAMA_MODEL,
    });
  } catch {
    return Response.json(
      {
        message: `Ollama was found, but ${OLLAMA_MODEL} could not be pulled. Run: ollama pull ${OLLAMA_MODEL}`,
      },
      { status: 500 },
    );
  }
}
