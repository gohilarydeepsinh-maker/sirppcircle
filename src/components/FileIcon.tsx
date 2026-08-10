import { FileText, ImageIcon, FileSpreadsheet, Presentation, Archive, File } from "lucide-react";
import { fileCategory } from "@/lib/files";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof File> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: Presentation,
  txt: FileText,
  zip: Archive,
};

export function FileIcon({ fileType, className }: { fileType: string; className?: string }) {
  const Icon = ICONS[fileCategory(fileType)] ?? File;
  return <Icon className={cn("size-5", className)} />;
}
