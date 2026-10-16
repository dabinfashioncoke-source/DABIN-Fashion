import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  text?: string;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Loads an image from a data URI and returns its dimensions.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Renders an HTML element into a crisp jsPDF document.
 * Uses html-to-image (SVG foreignObject / native browser rendering)
 * which natively supports Tailwind CSS v4's oklch(), modern color spaces,
 * custom fonts, and high-DPI scaling without parsing crashes.
 */
export async function createPdfFromElement(
  element: HTMLElement,
  options: { title?: string } = {}
): Promise<jsPDF> {
  // Temporary clone or style adjustments to ensure clean white background and full width
  const originalBackground = element.style.backgroundColor;
  element.style.backgroundColor = '#ffffff';

  let dataUrl: string;
  try {
    dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2, // Sharp high-resolution text and logos
      backgroundColor: '#ffffff',
      cacheBust: false,
      skipFonts: true, // Prevents SecurityError on cross-origin stylesheets (e.g. Google Fonts)
      fontEmbedCSS: '', // Disable font inlining from cross-origin CSS rules
      filter: (node) => {
        // Exclude elements with 'no-print' class from the PDF output
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });
  } finally {
    element.style.backgroundColor = originalBackground;
  }

  const img = await loadImage(dataUrl);
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4
  const margin = 10; // 10mm margins
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (imgHeight * contentWidth) / imgWidth;

  if (options.title) {
    pdf.setProperties({
      title: options.title,
      subject: 'DABIN Fashion House Official Document',
      creator: 'DABIN Fashion House Nairobi',
    });
  }

  // Single page or multi-page slicing
  if (contentHeight <= pdfHeight - margin * 2) {
    pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight);
  } else {
    // Multi-page slicing
    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(dataUrl, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - margin * 2);

    while (heightLeft > 0) {
      position -= (pdfHeight - margin * 2);
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }
  }

  return pdf;
}

/**
 * Generates and triggers direct browser download of the PDF into the user's device.
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
 * or falls back to downloading the PDF into device storage and notifying the user.
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
      // User cancelled or aborted share sheet
      if (shareErr instanceof Error && shareErr.name === 'AbortError') {
        return { method: 'native-file', success: false };
      }
      // Fall through to other options
    }
  }

  // 2. Try native Web Share without file attachment (share text + download file)
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

  // 3. Fallback: Direct Download into device
  pdf.save(safeFileName);
  return { method: 'download-fallback', success: true };
}
