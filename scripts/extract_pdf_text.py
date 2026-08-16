import sys
from pathlib import Path

import pdfplumber


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: extract_pdf_text.py <pdf-path>", file=sys.stderr)
        return 2

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2

    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    lines = [" ".join(line.split()) for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)
    if len(text) < 80:
        print("Could not extract enough text from this PDF.", file=sys.stderr)
        return 1

    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
