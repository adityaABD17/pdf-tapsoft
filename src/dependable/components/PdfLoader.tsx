import { ReactNode, useEffect, useRef, useState } from "react";
import {
  getDocument,
  OnProgressParameters,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy
} from "pdfjs-dist";
import { DocumentInitParameters, TypedArray } from "pdfjs-dist/types/src/display/api";

const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
  <div style={{ color: "black" }}>
    Loading {Math.floor((progress.loaded / progress.total) * 100)}%
  </div>
);

const DEFAULT_ERROR_MESSAGE = (error: Error) => (
  <div style={{ color: "black" }}>{error.message}</div>
);

const DEFAULT_ON_ERROR = (error: Error) => {
  throw new Error(`Error loading PDF document: ${error.message}!`);
};

export interface PdfLoaderProps {
  document: string | URL | TypedArray | DocumentInitParameters;
  beforeLoad?(progress: OnProgressParameters): ReactNode;
  errorMessage?(error: Error): ReactNode;
  children(pdfDocument: PDFDocumentProxy): ReactNode;
  onError?(error: Error): void;
}

export const PdfLoader = ({
  document,
  beforeLoad = DEFAULT_BEFORE_LOAD,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
  onError = DEFAULT_ON_ERROR,
}: PdfLoaderProps) => {
  const pdfLoadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);

  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<OnProgressParameters | null>(null);

  useEffect(() => {
    // Start loading the PDF document
    const loadingTask = getDocument(document);
    pdfLoadingTaskRef.current = loadingTask;

    loadingTask.onProgress = (progress: OnProgressParameters) => {
      if (progress.total > 0) {
        setLoadingProgress(progress.loaded > progress.total ? null : progress);
      }
    };

    loadingTask.promise
      .then((pdfDocument: PDFDocumentProxy) => {
        pdfDocumentRef.current = pdfDocument;
      })
      .catch((err: Error) => {
        if (err.message !== "Worker was destroyed") {
          setError(err);
          onError(err);
        }
      })
      .finally(() => {
        setLoadingProgress(null);
      });

    // Cleanup
    return () => {
      pdfLoadingTaskRef.current?.destroy();
      pdfDocumentRef.current?.destroy();
    };
  }, [document, onError]);

  if (error) return errorMessage(error);
  if (loadingProgress) return beforeLoad(loadingProgress);
  if (pdfDocumentRef.current) return children(pdfDocumentRef.current);
  return null;
};
