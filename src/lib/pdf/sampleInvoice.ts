import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/**
 * Generates the official Section 28 test invoice PDF
 * containing:
 * - INVOICE
 * - Customer Name: Rahul Kumar
 * - Invoice Number: INV-001
 * - Total Amount: Rs. 10,000 (₹10,000)
 */
export async function generateSampleInvoicePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 points

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // Top banner accent
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width: width,
    height: 12,
    color: rgb(0.15, 0.38, 0.92), // Modern blue
  });

  // Invoice Title
  page.drawText('INVOICE', {
    x: 50,
    y: height - 70,
    size: 28,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.2),
  });

  // Company details (right aligned)
  page.drawText('Acme Global Services Ltd.', {
    x: width - 230,
    y: height - 60,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });
  page.drawText('104 Cyber City, Tech Hub', {
    x: width - 230,
    y: height - 76,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });
  page.drawText('contact@acme.example.com', {
    x: width - 230,
    y: height - 90,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Decorative divider line
  page.drawLine({
    start: { x: 50, y: height - 110 },
    end: { x: width - 50, y: height - 110 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Invoice Meta Section
  // Left column: Bill To
  page.drawText('BILL TO:', {
    x: 50,
    y: height - 140,
    size: 10,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.5),
  });

  // EXACT string required by Section 28:
  page.drawText('Customer Name: Rahul Kumar', {
    x: 50,
    y: height - 160,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('Sector 21, New Delhi, India', {
    x: 50,
    y: height - 180,
    size: 10,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  // Right column: Invoice Meta
  // EXACT string required by Section 28:
  page.drawText('Invoice Number: INV-001', {
    x: width - 230,
    y: height - 140,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('Invoice Date: September 16, 2026', {
    x: width - 230,
    y: height - 158,
    size: 10,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  page.drawText('Due Date: October 01, 2026', {
    x: width - 230,
    y: height - 174,
    size: 10,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  // Table header background
  page.drawRectangle({
    x: 50,
    y: height - 230,
    width: width - 100,
    height: 28,
    color: rgb(0.94, 0.96, 0.99),
  });

  page.drawText('Item Description', {
    x: 65,
    y: height - 220,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('Qty', {
    x: 320,
    y: height - 220,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('Rate', {
    x: 390,
    y: height - 220,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('Amount', {
    x: 480,
    y: height - 220,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Table Row 1
  page.drawText('Software Engineering & Cloud Architecture', {
    x: 65,
    y: height - 260,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('1', {
    x: 325,
    y: height - 260,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('Rs. 7,000', {
    x: 385,
    y: height - 260,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('Rs. 7,000', {
    x: 475,
    y: height - 260,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });

  // Row 1 divider
  page.drawLine({
    start: { x: 50, y: height - 275 },
    end: { x: width - 50, y: height - 275 },
    thickness: 0.5,
    color: rgb(0.9, 0.92, 0.95),
  });

  // Table Row 2
  page.drawText('PDF Engine Integration & Security Audit', {
    x: 65,
    y: height - 300,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('1', {
    x: 325,
    y: height - 300,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('Rs. 3,000', {
    x: 385,
    y: height - 300,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });
  page.drawText('Rs. 3,000', {
    x: 475,
    y: height - 300,
    size: 10,
    font: fontRegular,
    color: rgb(0.15, 0.18, 0.22),
  });

  // Row 2 divider
  page.drawLine({
    start: { x: 50, y: height - 315 },
    end: { x: width - 50, y: height - 315 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Total Box
  page.drawRectangle({
    x: width - 260,
    y: height - 390,
    width: 210,
    height: 55,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 1,
  });

  page.drawText('Subtotal: Rs. 10,000', {
    x: width - 245,
    y: height - 355,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  // EXACT required total amount string:
  page.drawText('Total Amount: Rs. 10,000', {
    x: width - 245,
    y: height - 378,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.25),
  });

  // Footer notes
  page.drawText('Thank you for your business! Please settle invoice within 15 days.', {
    x: 50,
    y: 80,
    size: 9,
    font: fontItalic,
    color: rgb(0.5, 0.55, 0.6),
  });

  page.drawText('Authorized Signature: _______________________', {
    x: 50,
    y: 120,
    size: 10,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  return await pdfDoc.save();
}
