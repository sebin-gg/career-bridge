function decodePdfEscapes(input: string) {
  return input
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{3})/g, (_, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8)),
    )
    .replace(/\\\\/g, "\\");
}

async function inflatePdfStream(streamBytes: Uint8Array) {
  if (typeof DecompressionStream === "undefined") {
    return "";
  }

  const copiedBytes = streamBytes.slice();
  const decompressed = new Response(
    new Blob([copiedBytes.buffer]).stream().pipeThrough(new DecompressionStream("deflate")),
  );
  const buffer = await decompressed.arrayBuffer();

  return new TextDecoder("latin1").decode(buffer);
}

function extractTextOperators(content: string) {
  const matches = [
    ...content.matchAll(/\((?<value>(?:\\.|[^\\()])*)\)\s*Tj/g),
    ...content.matchAll(/\[(?<array>.*?)\]\s*TJ/gs),
  ];

  const chunks: string[] = [];

  for (const match of matches) {
    const singleValue = match.groups?.value;
    if (singleValue) {
      chunks.push(decodePdfEscapes(singleValue));
      continue;
    }

    const arrayValue = match.groups?.array;
    if (!arrayValue) {
      continue;
    }

    const inlineValues = [...arrayValue.matchAll(/\((?<value>(?:\\.|[^\\()])*)\)/g)];
    for (const inlineMatch of inlineValues) {
      const value = inlineMatch.groups?.value;
      if (value) {
        chunks.push(decodePdfEscapes(value));
      }
    }
  }

  return chunks.join(" ");
}

function extractPdfStreams(bytes: Uint8Array) {
  const binary = new TextDecoder("latin1").decode(bytes);
  const streams: Array<{ content: Uint8Array; isFlateEncoded: boolean }> = [];
  const streamMarker = "stream";
  const endMarker = "endstream";
  let cursor = 0;

  while (cursor < binary.length) {
    const streamIndex = binary.indexOf(streamMarker, cursor);
    if (streamIndex === -1) {
      break;
    }

    const endIndex = binary.indexOf(endMarker, streamIndex);
    if (endIndex === -1) {
      break;
    }

    let contentStart = streamIndex + streamMarker.length;
    if (binary[contentStart] === "\r" && binary[contentStart + 1] === "\n") {
      contentStart += 2;
    } else if (binary[contentStart] === "\n" || binary[contentStart] === "\r") {
      contentStart += 1;
    }

    let contentEnd = endIndex;
    if (binary[contentEnd - 2] === "\r" && binary[contentEnd - 1] === "\n") {
      contentEnd -= 2;
    } else if (binary[contentEnd - 1] === "\n" || binary[contentEnd - 1] === "\r") {
      contentEnd -= 1;
    }

    const dictionaryStart = Math.max(0, streamIndex - 500);
    const dictionary = binary.slice(dictionaryStart, streamIndex);
    streams.push({
      content: bytes.slice(contentStart, contentEnd),
      isFlateEncoded: dictionary.includes("/FlateDecode"),
    });
    cursor = endIndex + endMarker.length;
  }

  return streams;
}

export async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const streamContents = await Promise.all(
    extractPdfStreams(bytes).map(async (stream) => {
      if (!stream.isFlateEncoded) {
        return new TextDecoder("latin1").decode(stream.content);
      }

      try {
        return await inflatePdfStream(stream.content);
      } catch {
        return "";
      }
    }),
  );

  const extracted = streamContents.map((content) => extractTextOperators(content)).join("\n");

  const cleaned = extracted
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 80) {
    throw new Error(
      "Could not extract enough text from this PDF. Try a text-based resume PDF, not a scanned image.",
    );
  }

  return cleaned;
}
