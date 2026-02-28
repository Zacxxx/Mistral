import { FileWithPath } from "react-dropzone";

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = async (file: FileWithPath) => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit" };
  }

  const fileType = await import("file-type");
  const buffer = await file.slice(0, 4100).arrayBuffer();
  const type = await fileType.fileTypeFromBuffer(buffer);

  if (!type || !ACCEPTED_FILE_TYPES[type.mime as keyof typeof ACCEPTED_FILE_TYPES]) {
    return { valid: false, error: "File type not supported" };
  }

  return { valid: true };
};

export const getFilePreview = (file: File) => {
  if (file.type.startsWith("image/")) {
    return URL.createObjectURL(file);
  }
  return null;
};

export const extractTextFromFile = async (file: File) => {
  if (file.type === "application/pdf") {
    const pdfLib = await import("pdf-lib");
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    let text = "";
    for (const page of pages) {
      text += await page.getText();
    }
    return text;
  } else if (file.name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  return "";
};