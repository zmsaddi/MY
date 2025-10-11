import { useState, useCallback } from 'react';
import { generatePDF, printPDF } from '../utils/pdf/pdfService';

const MARGIN_PRESETS = {
  narrow: [20, 40, 20, 40],
  normal: [40, 60, 40, 60],
  wide: [60, 80, 60, 80]
};

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDocument, setPendingDocument] = useState(null);

  const requestPrint = useCallback((docDefinition, metadata = {}) => {
    setPendingDocument({
      docDefinition,
      metadata: {
        name: metadata.name || 'المستند',
        type: metadata.type || 'تقرير',
        estimatedPages: metadata.estimatedPages || 1,
        defaultAction: metadata.defaultAction || 'print',
        ...metadata
      }
    });
    setShowConfirmDialog(true);
  }, []);

  const executePrint = useCallback(async (options) => {
    if (!pendingDocument) return;

    setIsPrinting(true);
    setShowConfirmDialog(false);

    try {
      const finalDoc = {
        ...pendingDocument.docDefinition,
        pageOrientation: options.orientation || 'portrait',
        pageMargins: MARGIN_PRESETS[options.margins] || MARGIN_PRESETS.normal
      };

      const filename = `${pendingDocument.metadata.name}_${Date.now()}.pdf`;

      switch (options.action) {
        case 'print':
          await printPDF(finalDoc);
          break;
        case 'pdf':
          await generatePDF(finalDoc, filename, true);
          break;
        case 'preview':
          await generatePDF(finalDoc, 'preview.pdf', false);
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
      setPendingDocument(null);
    }
  }, [pendingDocument]);

  const cancelPrint = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingDocument(null);
  }, []);

  const quickPrint = useCallback(async (docDefinition) => {
    setIsPrinting(true);
    try {
      await printPDF(docDefinition);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Quick print error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const quickPDF = useCallback(async (docDefinition, filename = 'document.pdf') => {
    setIsPrinting(true);
    try {
      await generatePDF(docDefinition, filename, true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Quick PDF error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  return {
    isPrinting,
    showConfirmDialog,
    pendingDocument,
    requestPrint,
    executePrint,
    cancelPrint,
    quickPrint,
    quickPDF
  };
}

export default usePrint;
