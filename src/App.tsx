import React, { useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { PDFEditor } from './components/PDFEditor';
import { PageInfo } from './types/pdf';

interface LoadedDocumentData {
  pdfBytes: Uint8Array;
  fileName: string;
  pages: PageInfo[];
  file: File | null;
}

export function App() {
  const [documentData, setDocumentData] = useState<LoadedDocumentData | null>(null);

  const handleDocumentLoaded = (
    pdfBytes: Uint8Array,
    fileName: string,
    pages: PageInfo[],
    file: File | null
  ) => {
    setDocumentData({
      pdfBytes,
      fileName,
      pages,
      file,
    });
  };

  const handleOpenNew = () => {
    setDocumentData(null);
  };

  if (!documentData) {
    return <UploadScreen onDocumentLoaded={handleDocumentLoaded} />;
  }

  return (
    <PDFEditor
      pdfBytes={documentData.pdfBytes}
      fileName={documentData.fileName}
      initialPages={documentData.pages}
      originalFile={documentData.file}
      onOpenNew={handleOpenNew}
    />
  );
}

export default App;
