export const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
] as const;

const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "js",
  "mjs",
  "jsx",
  "ts",
  "php",
  "py",
  "com",
  "scr",
  "msi",
  "apk",
  "jar",
  "dll",
  "vbs",
  "ps1",
  "html",
  "htm",
  "svg",
];

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const DOC_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "doc", label: "Word" },
  { value: "xls", label: "Excel" },
  { value: "ppt", label: "PowerPoint" },
  { value: "txt", label: "Text" },
  { value: "csv", label: "CSV" },
  { value: "zip", label: "Archive" },
] as const;

export function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export function sanitizeFileName(fileName: string) {
  const ext = extensionOf(fileName);
  const base = fileName
    .slice(0, fileName.length - (ext ? ext.length + 1 : 0))
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

export function validateFile(file: File, maxMb?: number): string | null {
  const limitBytes =
    maxMb && Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : MAX_FILE_BYTES;
  const ext = extensionOf(file.name);
  if (!ext) return "This file has no extension and cannot be uploaded.";
  if (BLOCKED_EXTENSIONS.includes(ext)) return "This file type is not allowed.";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext))
    return `Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  if (file.size === 0) return "This file is empty.";
  if (file.size > limitBytes)
    return `File is too large. Maximum size is ${Math.round(limitBytes / (1024 * 1024))} MB.`;
  if (file.name.length > 150) return "File name is too long.";
  return null;
}


/** Coarse category used for filtering + icons. */
export function fileCategory(fileType: string): string {
  const ext = fileType.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx"].includes(ext)) return "xls";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (ext === "txt") return "txt";
  if (ext === "csv") return "csv";
  if (ext === "zip") return "zip";
  return "other";
}

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isPreviewable(category: string) {
  return ["pdf", "image", "txt", "csv"].includes(category);
}
