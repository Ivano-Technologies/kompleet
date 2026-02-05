import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CalculationPDFData {
  calculatorType: string;
  date: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  ruleVersion?: string;
  sources?: string[];
  confidenceLevel?: string;
}

export function generateCalculationPDF(data: CalculationPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(value);
  };

  // Helper function to format label
  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Header - KOMPLEET Branding
  doc.setFillColor(34, 197, 94); // Green color
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('KOMPLEET', 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Nigerian Tax Platform', 20, 26);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.calculatorType, 20, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${data.date}`, 20, yPosition);
  yPosition += 15;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Input Parameters Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Input Parameters', 20, yPosition);
  yPosition += 5;

  const inputRows = Object.entries(data.inputs).map(([key, value]) => [
    formatLabel(key),
    typeof value === 'number' ? formatCurrency(value) : String(value),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Parameter', 'Value']],
    body: inputRows,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Results Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Calculation Results', 20, yPosition);
  yPosition += 5;

  const resultRows = Object.entries(data.results).map(([key, value]) => [
    formatLabel(key),
    typeof value === 'number' ? formatCurrency(value) : String(value),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Amount']],
    body: resultRows,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Metadata Section
  if (data.ruleVersion || data.sources || data.confidenceLevel) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Details', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (data.ruleVersion) {
      doc.text(`Rule Version: ${data.ruleVersion}`, 20, yPosition);
      yPosition += 6;
    }

    if (data.confidenceLevel) {
      doc.text(`Confidence Level: ${data.confidenceLevel}`, 20, yPosition);
      yPosition += 6;
    }

    if (data.sources && data.sources.length > 0) {
      doc.text(`Data Sources: ${data.sources.join(', ')}`, 20, yPosition);
      yPosition += 6;
    }

    yPosition += 10;
  }

  // Disclaimer Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const disclaimerY = pageHeight - 30;

  doc.setFillColor(240, 240, 240);
  doc.rect(0, disclaimerY - 5, pageWidth, 35, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);

  const disclaimerText =
    'Disclaimer: This calculation is for informational purposes only and should not be considered as professional tax advice. ' +
    'Tax laws and regulations are subject to change. Please consult with a qualified tax professional for specific guidance.';

  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 40);
  doc.text(splitDisclaimer, 20, disclaimerY);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('KOMPLEET - Nigerian Tax Platform', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  // Generate filename
  const calculatorSlug = data.calculatorType.toLowerCase().replace(/\s+/g, '-');
  const dateSlug = new Date(data.date).toISOString().split('T')[0];
  const filename = `KOMPLEET-${calculatorSlug}-${dateSlug}.pdf`;

  // Save the PDF
  doc.save(filename);
}
