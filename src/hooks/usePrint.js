// src/hooks/usePrint.js
import { useState, useCallback } from 'react';
import { generatePDF, printPDF } from '../utils/pdf/pdfService';

/**
 * Custom hook for handling print and PDF operations
 * @returns {object} Print utilities and state
 */
export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDocument, setPendingDocument] = useState(null);

  /**
   * Show print confirmation dialog
   * @param {object} docDefinition - PDF document definition
   * @param {object} metadata - Document metadata
   */
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

  /**
   * Execute print/PDF operation after confirmation
   * @param {object} options - User selected options from dialog
   */
  const executePrint = useCallback(async (options) => {
    if (!pendingDocument) return;

    setIsPrinting(true);
    setShowConfirmDialog(false);

    try {
      const { docDefinition } = pendingDocument;

      // Apply user-selected options to document
      const finalDoc = {
        ...docDefinition,
        pageOrientation: options.orientation || 'portrait',
        pageMargins: options.margins === 'narrow'
          ? [20, 40, 20, 40]
          : options.margins === 'wide'
          ? [60, 80, 60, 80]
          : [40, 60, 40, 60]
      };

      // Execute based on selected action
      if (options.action === 'print') {
        printPDF(finalDoc);
      } else if (options.action === 'pdf') {
        const filename = `${pendingDocument.metadata.name}_${new Date().getTime()}.pdf`;
        generatePDF(finalDoc, filename, true);
      } else if (options.action === 'preview') {
        generatePDF(finalDoc, 'preview.pdf', false);
      }

      // Small delay to allow PDF generation to start
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Print error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
      setPendingDocument(null);
    }
  }, [pendingDocument]);

  /**
   * Cancel print operation
   */
  const cancelPrint = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingDocument(null);
  }, []);

  /**
   * Direct print without confirmation (for quick actions)
   * @param {object} docDefinition
   */
  const quickPrint = useCallback(async (docDefinition) => {
    setIsPrinting(true);
    try {
      printPDF(docDefinition);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Quick print error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  /**
   * Direct PDF download without confirmation
   * @param {object} docDefinition
   * @param {string} filename
   */
  const quickPDF = useCallback(async (docDefinition, filename = 'document.pdf') => {
    setIsPrinting(true);
    try {
      generatePDF(docDefinition, filename, true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Quick PDF error:', error);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  return {
    // State
    isPrinting,
    showConfirmDialog,
    pendingDocument,

    // Actions
    requestPrint,
    executePrint,
    cancelPrint,
    quickPrint,
    quickPDF
  };
}

export default usePrint;
