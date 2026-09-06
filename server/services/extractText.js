import fs from "fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/* =========================================================
   NORMALIZE TEXT
========================================================= */

const normalizeText = (text = "") => {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/* =========================================================
   WORD COUNT
========================================================= */

const countWords = (text = "") => {
  if (!text.trim()) {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

/* =========================================================
   PDF EXTRACTION
========================================================= */

const extractPDF = async (buffer) => {
  let parser;

  try {
    parser = new PDFParse({
      data: buffer,
    });

    const result =
      await parser.getText();

    const text =
      normalizeText(
        result?.text || ""
      );

    return {
      text,

      extractedText: text,

      pageCount:
        result?.total ??
        result?.pages?.length ??
        null,

      wordCount:
        countWords(text),

      parsingConfidence:
        text.length > 0
          ? 95
          : 0,
    };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error(
          "PDF parser cleanup failed:",
          error.message
        );
      }
    }
  }
};

/* =========================================================
   DOCX EXTRACTION
========================================================= */

const extractDOCX =
  async (buffer) => {
    const result =
      await mammoth.extractRawText({
        buffer,
      });

    const text =
      normalizeText(
        result?.value || ""
      );

    return {
      text,

      extractedText: text,

      pageCount: null,

      wordCount:
        countWords(text),

      parsingConfidence:
        text.length > 0
          ? 95
          : 0,
    };
  };

/* =========================================================
   MAIN FUNCTION
========================================================= */

export const extractResumeText =
  async (file) => {
    if (!file) {
      throw new Error(
        "Resume file is missing."
      );
    }

    const buffer =
      await fs.readFile(
        file.path
      );

    const fileName =
      file.originalname
        ?.toLowerCase() ||
      "";

    const mimeType =
      file.mimetype || "";

    const isPDF =
      mimeType ===
        "application/pdf" ||
      fileName.endsWith(
        ".pdf"
      );

    const isDOCX =
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(
        ".docx"
      );

    let result;

    if (isPDF) {
      result =
        await extractPDF(
          buffer
        );
    } else if (isDOCX) {
      result =
        await extractDOCX(
          buffer
        );
    } else {
      throw new Error(
        "Unsupported file type. Please upload PDF or DOCX."
      );
    }

    if (
      !result.text ||
      !result.text.trim()
    ) {
      throw new Error(
        "Resume text is empty. The PDF may be image-based or scanned."
      );
    }

    console.log(
      `✅ Resume extracted: ${result.wordCount} words`
    );

    return result;
  };