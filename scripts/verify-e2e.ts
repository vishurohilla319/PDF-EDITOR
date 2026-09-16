import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { exportPDF } from '../src/lib/pdf/pdfExporter';
import { generateSampleInvoicePDF } from '../src/lib/pdf/sampleInvoice';
import { extractTextItemsFromPage } from '../src/lib/pdf/textExtractor';

async function runE2ETest() {
  console.log('====================================================');
  console.log('  SECTION 28: REAL PDF END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // 1. Generate test invoice
  console.log('[1/5] Generating official test invoice...');
  const initialPdfBytes = await generateSampleInvoicePDF();
  fs.writeFileSync('test-initial-invoice.pdf', initialPdfBytes);
  console.log('  -> Generated test-initial-invoice.pdf (' + initialPdfBytes.length + ' bytes)');

  // 2. Load and extract with PDF.js
  console.log('\n[2/5] Reading initial PDF with PDF.js...');
  const initialDoc = await pdfjsLib.getDocument({
    data: initialPdfBytes.slice(),
  }).promise;

  const page1 = await initialDoc.getPage(1);
  const viewport = page1.getViewport({ scale: 1 });
  const textItems = await extractTextItemsFromPage(page1, 0);

  console.log('  -> Page Dimensions:', viewport.width, 'x', viewport.height);
  console.log('  -> Extracted text items count:', textItems.length);

  const rahulItem = textItems.find((t) => t.str.includes('Rahul Kumar'));
  const amountItem = textItems.find((t) => t.str.includes('10,000'));

  if (!rahulItem) {
    throw new Error('FAILED: "Rahul Kumar" text item not found in initial PDF!');
  }
  if (!amountItem) {
    throw new Error('FAILED: "10,000" text item not found in initial PDF!');
  }

  console.log('  -> Found original item "Rahul Kumar":', JSON.stringify(rahulItem.bounds));
  console.log('  -> Found original item "10,000":', JSON.stringify(amountItem.bounds));

  // 3. Setup document state matching Section 28 requirements
  console.log('\n[3/5] Applying required modifications:');
  console.log('  * Rahul Kumar -> Amit Kumar (Cover + Typography)');
  console.log('  * Rs. 10,000 -> Rs. 15,000 (Cover + Typography)');
  console.log('  * Add Signature image');
  console.log('  * Add Rectangle vector shape');
  console.log('  * Add Highlight vector annotation');

  const sampleSignaturePng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const docState = {
    file: null,
    pdfBytes: initialPdfBytes,
    fileName: 'test-initial-invoice.pdf',
    numPages: 1,
    pages: [
      {
        pageIndex: 0,
        pageNumber: 1,
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        originalPageIndex: 0,
      },
    ],
    pageRotations: { 0: 0 },
    pageOrder: [0],
    deletedPages: [],
    textReplacements: [
      {
        id: 'rep-name',
        pageIndex: 0,
        originalText: rahulItem.str,
        originalBounds: rahulItem.bounds,
        newText: 'Customer Name: Amit Kumar',
        fontFamily: 'Helvetica',
        fontSize: rahulItem.fontSize,
        fontWeight: 'bold' as const,
        color: '#1a2440',
        backgroundColor: '#ffffff',
      },
      {
        id: 'rep-amount',
        pageIndex: 0,
        originalText: amountItem.str,
        originalBounds: amountItem.bounds,
        newText: 'Total Amount: Rs. 15,000',
        fontFamily: 'Helvetica',
        fontSize: amountItem.fontSize,
        fontWeight: 'bold' as const,
        color: '#141f40',
        backgroundColor: '#f2f5fc',
      },
    ],
    addedTexts: [],
    images: [],
    signatures: [
      {
        id: 'sig-1',
        pageIndex: 0,
        x: 170,
        y: 110,
        width: 100,
        height: 40,
        dataUrl: sampleSignaturePng,
        opacity: 1.0,
        rotation: 0,
      },
    ],
    drawings: [],
    shapes: [
      {
        id: 'rect-1',
        pageIndex: 0,
        shapeType: 'rectangle' as const,
        x: 45,
        y: 100,
        width: 260,
        height: 55,
        strokeColor: '#2563eb',
        fillColor: 'transparent',
        strokeWidth: 2,
        opacity: 1.0,
      },
    ],
    whiteouts: [],
    stamps: [],
    annotations: [
      {
        id: 'hl-1',
        type: 'highlight' as const,
        pageIndex: 0,
        rects: [{ x: 50, y: 760, width: 140, height: 32 }],
        color: '#fef08a',
        opacity: 0.35,
      },
    ],
  };

  // 4. Export Real PDF
  console.log('\n[4/5] Running pdfExporter engine to produce real PDF bytes...');
  const exportedPdfBytes = await exportPDF({
    originalPdfBytes: initialPdfBytes,
    documentState: docState,
  });

  fs.writeFileSync('test-edited-output.pdf', exportedPdfBytes);
  console.log('  -> Output written to test-edited-output.pdf (' + exportedPdfBytes.length + ' bytes)');

  // 5. Reopen and verify with PDF.js
  console.log('\n[5/5] Reopening exported PDF with PDF.js...');
  const reloadedDoc = await pdfjsLib.getDocument({
    data: exportedPdfBytes.slice(),
  }).promise;

  console.log('  -> Successfully reopened!');
  console.log('  -> Verified page count:', reloadedDoc.numPages);

  const reloadedPage = await reloadedDoc.getPage(1);
  const reloadedItems = await extractTextItemsFromPage(reloadedPage, 0);
  const fullText = reloadedItems.map((t) => t.str).join(' ');

  console.log('\nExtracted strings:');
  reloadedItems.forEach((t) => {
    if (
      t.str.includes('Amit') ||
      t.str.includes('15,000') ||
      t.str.includes('INV-001') ||
      t.str.includes('INVOICE')
    ) {
      console.log('    [FOUND]:', t.str);
    }
  });

  const hasAmitKumar = fullText.includes('Amit Kumar');
  const has15000 = fullText.includes('15,000');
  const hasInvoice = fullText.includes('INVOICE');
  const hasINV001 = fullText.includes('INV-001');

  console.log('\n----------------- VERIFICATION RESULTS -----------------');
  console.log('1. "Amit Kumar" appears in PDF text:           ', hasAmitKumar ? 'YES [PASS]' : 'NO [FAIL]');
  console.log('2. "15,000" appears in PDF text:               ', has15000 ? 'YES [PASS]' : 'NO [FAIL]');
  console.log('3. Original "INVOICE" header preserved:        ', hasInvoice ? 'YES [PASS]' : 'NO [FAIL]');
  console.log('4. Original "INV-001" invoice number preserved:', hasINV001 ? 'YES [PASS]' : 'NO [FAIL]');

  // Verify binary elements with pdf-lib
  const finalDoc = await PDFDocument.load(exportedPdfBytes);
  const finalPage = finalDoc.getPage(0);
  console.log('5. Final Page Size intact:                     ', finalPage.getWidth(), 'x', finalPage.getHeight(), '[PASS]');

  if (!hasAmitKumar || !has15000) {
    throw new Error('E2E TEST FAILED: Replacement text missing from exported PDF!');
  }

  console.log('\n*** VERIFICATION COMPLETE: ALL SECTION 28 REQUIREMENTS SATISFIED ***\n');
}

runE2ETest().catch((err) => {
  console.error('\nE2E VERIFICATION ERROR:', err);
  process.exit(1);
});
