import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  text?: string;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Renders an HTML element into a crisp jsPDF document.
 */
export async function createPdfFromElement(
  element: HTMLElement,
  options: { title?: string } = {}
): Promise<jsPDF> {
  // Ensure background is solid white for crisp PDF rendering
  const originalBackground = element.style.backgroundColor;
  element.style.backgroundColor = '#ffffff';

  const canvas = await html2canvas(element, {
    scale: 2, // High DPI resolution for sharp text and logos
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  element.style.backgroundColor = originalBackground;

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 10; // 10mm margins
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  if (options.title) {
    pdf.setProperties({
      title: options.title,
      subject: 'DABIN Fashion House Official Commercial Document',
      creator: 'DABIN Fashion House Nairobi',
    });
  }

  // If content fits on one page or multi-page
  if (contentHeight <= pdfHeight - margin * 2) {
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
  } else {
    // Multi-page slicing
    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - margin * 2);

    while (heightLeft > 0) {
      position -= (pdfHeight - margin * 2);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }
  }

  return pdf;
}

/**
 * Generates and triggers direct browser download of the PDF.
 */
export async function downloadPdfFromElement(
  element: HTMLElement,
  fileName: string = 'document.pdf',
  title?: string
): Promise<void> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const pdf = await createPdfFromElement(element, { title });
  pdf.save(safeFileName);
}

/**
 * Shares the PDF using Web Share API (native file sharing if supported),
 * or falls back to downloading the PDF and notifying the user.
 */
export async function sharePdfFromElement(
  element: HTMLElement,
  fileName: string = 'document.pdf',
  title: string = 'DABIN Fashion Document',
  text: string = 'Here is your official DABIN Fashion document.'
): Promise<{ method: 'native-file' | 'native-text' | 'download-fallback'; success: boolean }> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const pdf = await createPdfFromElement(element, { title });
  const blob = pdf.output('blob');

  const file = new File([blob], safeFileName, { type: 'application/pdf' });

  // 1. Try native Web Share with file attachment (Mobile Safari, Chrome on Android, macOS Safari)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return { method: 'native-file', success: true };
    } catch (shareErr: unknown) {
      // User cancelled or aborted
      if (shareErr instanceof Error && shareErr.name === 'AbortError') {
        return { method: 'native-file', success: false };
      }
      // Fall through to other options
    }
  }

  // 2. Try native Web Share without file (share text + download file)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      pdf.save(safeFileName);
      await navigator.share({
        title,
        text: `${text}\n(Document ${safeFileName} downloaded)`,
      });
      return { method: 'native-text', success: true };
    } catch (shareErr: unknown) {
      if (shareErr instanceof Error && shareErr.name === 'AbortError') {
        return { method: 'native-text', success: false };
      }
    }
  }

  // 3. Fallback: Direct Download
  pdf.save(safeFileName);
  return { method: 'download-fallback', success: true };
}
