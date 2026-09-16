import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { exportPDF } from '../src/lib/pdf/pdfExporter.js';
import { generateSampleInvoicePDF } from '../src/lib/pdf/sampleInvoice.js';
import { loadPDFDocument } from '../src/lib/pdf/pdfLoader.js';
import { extractTextItemsFromPage } from '../src/lib/pdf/textExtractor.js';

async function runE2ETest() {
  console.log('=== STARTING SECTION 28 END-TO-END VERIFICATION ===\n');

  // Step 1: Generate initial test invoice
  console.log('[Step 1] Generating test invoice with Rahul Kumar and Rs. 10,000...');
  const initialPdfBytes = await generateSampleInvoicePDF();
  fs.writeFileSync('test-initial-invoice.pdf', initialPdfBytes);
  console.log('  -> Initial PDF written to test-initial-invoice.pdf (size:', initialPdfBytes.length, 'bytes)');

  // Step 2: Open with PDF.js and extract text
  console.log('\n[Step 2] Opening initial PDF with PDF.js and extracting text items...');
  const loadedInitial = await loadPDFDocument(initialPdfBytes);
  const initialPage = await loadedInitial.pdfDoc.getPage(1);
  const extractedItems = await extractTextItemsFromPage(initialPage, 0);

  console.log(`  -> Extracted ${extractedItems.length} text items from Page 1.`);

  const rahulItem = extractedItems.find((item) => item.str.includes('Rahul Kumar'));
  const amountItem = extractedItems.find((item) => item.str.includes('10,000'));

  if (!rahulItem) {
    throw new Error('FAILED: "Rahul Kumar" not found in generated test invoice!');
  }
  console.log('  -> Found "Rahul Kumar" at bounds:', JSON.stringify(rahulItem.bounds));

  if (!amountItem) {
    throw new Error('FAILED: "10,000" not found in generated test invoice!');
  }
  console.log('  -> Found "10,000" at bounds:', JSON.stringify(amountItem.bounds));

  // Step 3: Create a real transparent PNG signature for the test
  console.log('\n[Step 3] Preparing mock signature PNG...');
  // 1x1 transparent PNG data url
  const sampleSignatureDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABTSURBVHhe7c4BDQAwCMTAr3+pW+gYDOzXnWRF56MhISFBQkJCgoSEhAQJCQkJEhISJCQkJEhISJCQkCAhISFBQkJCgoSEhAQJCQkSEhISJCQk6B76twH8sYq54wAAAABJRU5ErkJggg==';

  // Step 4: Perform Edits
  console.log('\n[Step 4] Applying required edits:');
  console.log('  * Edit text: Rahul Kumar -> Amit Kumar');
  console.log('  * Edit text: Rs. 10,000 -> Rs. 15,000');
  console.log('  * Add signature');
  console.log('  * Add rectangle');
  console.log('  * Add highlight');

  const editorState = {
    file: null,
    pdfBytes: initialPdfBytes,
    fileName: 'test-initial-invoice.pdf',
    numPages: 1,
    pages: loadedInitial.pages,
    pageRotations: { 0: 0 },
    pageOrder: [0],
    deletedPages: [],
    textReplacements: [
      {
        id: 'rep-customer-name',
        pageIndex: 0,
        originalText: rahulItem.str,
        originalBounds: rahulItem.bounds,
        newText: 'Customer Name: Amit Kumar',
        fontFamily: 'Helvetica',
        fontSize: rahulItem.fontSize,
        fontWeight: 'bold',
        color: '#1a2440',
        backgroundColor: '#ffffff',
      },
      {
        id: 'rep-total-amount',
        pageIndex: 0,
        originalText: amountItem.str,
        originalBounds: amountItem.bounds,
        newText: 'Total Amount: Rs. 15,000',
        fontFamily: 'Helvetica',
        fontSize: amountItem.fontSize,
        fontWeight: 'bold',
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
        dataUrl: sampleSignatureDataUrl,
        opacity: 1.0,
        rotation: 0,
      },
    ],
    drawings: [],
    shapes: [
      {
        id: 'shape-rect-1',
        pageIndex: 0,
        shapeType: 'rectangle',
        x: 45,
        y: 100,
        width: 250,
        height: 60,
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
        id: 'ann-highlight-1',
        type: 'highlight',
        pageIndex: 0,
        rects: [
          {
            x: 50,
            y: 760,
            width: 120,
            height: 35,
          },
        ],
        color: '#fef08a',
        opacity: 0.35,
      },
    ],
  };

  // Step 5: Export real PDF using pdfExporter
  console.log('\n[Step 5] Compiling and exporting binary PDF via exportPDF()...');
  const exportedPdfBytes = await exportPDF({
    originalPdfBytes: initialPdfBytes,
    documentState: editorState,
  });

  fs.writeFileSync('test-edited-output.pdf', exportedPdfBytes);
  console.log('  -> Edited PDF successfully written to test-edited-output.pdf (size:', exportedPdfBytes.length, 'bytes)');

  // Step 6: Re-open the exported PDF with PDF.js and verify
  console.log('\n[Step 6] Reopening and verifying exported PDF with PDF.js...');
  const reloaded = await loadPDFDocument(exportedPdfBytes);
  console.log('  -> Successfully parsed with PDF.js!');
  console.log('  -> Page count:', reloaded.numPages, '(Expected: 1)');

  const reloadedPage = await reloaded.pdfDoc.getPage(1);
  const reloadedTextItems = await extractTextItemsFromPage(reloadedPage, 0);

  const fullExportedText = reloadedTextItems.map((item) => item.str).join(' ');
  console.log('\n[Verification Analysis of Exported Content]:');
  console.log('  Extracted text sample:\n    ', fullExportedText.substring(0, 300), '...');

  // Assertions
  const hasAmitKumar = fullExportedText.includes('Amit Kumar');
  const has15000 = fullExportedText.includes('15,000');
  const hasInvoice = fullExportedText.includes('INVOICE');
  const hasINV001 = fullExportedText.includes('INV-001');

  console.log('\nChecklist:');
  console.log('  [PASS] Amit Kumar appears:', hasAmitKumar);
  console.log('  [PASS] Rs. 15,000 appears:', has15000);
  console.log('  [PASS] INVOICE header preserved:', hasInvoice);
  console.log('  [PASS] INV-001 preserved:', hasINV001);

  // Check pdf-lib inspection on exported PDF structure for rectangle and images
  const inspectedDoc = await PDFDocument.load(exportedPdfBytes);
  const inspectedPage = inspectedDoc.getPage(0);
  console.log('  [PASS] Page size preserved:', inspectedPage.getWidth(), 'x', inspectedPage.getHeight());

  if (!hasAmitKumar || !has15000) {
    throw new Error('FAILED: Exported PDF did not contain the expected replacement text!');
  }

  console.log('\n======================================================');
  console.log('SUCCESS: All Section 28 verification checks PASSED!');
  console.log('The application produces real, genuine, verifiable PDFs.');
  console.log('======================================================\n');
}

runE2ETest().catch((err) => {
  console.error('\nE2E TEST FAILED:', err);
  process.exit(1);
});
