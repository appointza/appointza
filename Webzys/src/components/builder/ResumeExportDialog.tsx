import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResumeExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeElementId: string;
  fileName: string;
}

const ResumeExportDialog = ({
  open,
  onOpenChange,
  resumeElementId,
  fileName,
}: ResumeExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "word" | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");

    try {
      const element = document.getElementById(resumeElementId);
      if (!element) {
        throw new Error("Resume element not found");
      }

      // Dynamic import html2pdf
      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 0,
        filename: `${fileName.toLowerCase().replace(/\s+/g, "-")}-resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait" 
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(element).save();

      toast.success("Resume exported as PDF successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    setExportType("word");

    try {
      const element = document.getElementById(resumeElementId);
      if (!element) {
        throw new Error("Resume element not found");
      }

      // Get the HTML content with inline styles
      const htmlContent = element.outerHTML;

      // Create a Word-compatible HTML document
      const wordDoc = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${fileName} Resume</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([wordDoc], {
        type: "application/msword",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName.toLowerCase().replace(/\s+/g, "-")}-resume.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Resume exported as Word document successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting Word:", error);
      toast.error("Failed to export Word document. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Resume
          </DialogTitle>
          <DialogDescription>
            Choose your preferred format to download your resume
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting && exportType === "pdf" ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
            )}
            <span className="font-medium">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
            onClick={handleExportWord}
            disabled={isExporting}
          >
            {isExporting && exportType === "word" ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            )}
            <span className="font-medium">Word</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          PDF format is recommended for best visual quality
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeExportDialog;
