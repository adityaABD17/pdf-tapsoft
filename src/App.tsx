import React, {
  MouseEvent,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from "react";
import CommentForm from "./components/CommentForm";
import ContextMenu, { ContextMenuProps } from "./components/ContextMenu";
import ExpandableTip from "./components/ExpandableTip";
import HighlightContainer from "./components/HighlightContainer";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import {
  GhostHighlight,
  Highlight,
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader,
  Tip,
  ViewportHighlight,
} from "./react-pdf-highlighter-extended";
import "./style/App.css";
import { testHighlights as _testHighlights } from "./components/test-highlights";
import { CommentedHighlight } from "./types";

const TEST_HIGHLIGHTS = _testHighlights;

const getNextId = () => String(Math.random()).slice(2);
const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);
const resetHash = () => (document.location.hash = "");

export default function App() {
  // url starts out null → no PDF shown
  const [url, setUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<CommentedHighlight[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(
    null
  );
  const [pdfScaleValue, setPdfScaleValue] = useState<number>();
  const [highlightPen, setHighlightPen] = useState(false);
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>();

  // --- PDF PICKERS ---
  // Option A: Remote URL picker
  const [inputUrl, setInputUrl] = useState("");
  const onLoadUrl = () => {
    if (!inputUrl) return;
    setUrl(inputUrl);
    setHighlights(TEST_HIGHLIGHTS[inputUrl] ?? []);
  };

  // Option B: Local file picker
  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // create blob URL and feed it to PdfLoader
    const blobUrl = URL.createObjectURL(file);
    setUrl(blobUrl);
    setHighlights([]);
  };

  // Toggle between two test docs
  const currentPdfIndexRef = useRef(0);
  const toggleDocument = () => {
    const urls = [
      "https://arxiv.org/pdf/2203.11115",
      "https://arxiv.org/pdf/1604.02480",
    ];
    currentPdfIndexRef.current =
      (currentPdfIndexRef.current + 1) % urls.length;
    const next = urls[currentPdfIndexRef.current];
    setUrl(next);
    setHighlights(TEST_HIGHLIGHTS[next] ?? []);
  };

  // click-away for context menu
  useEffect(() => {
    const onClick = () => contextMenu && setContextMenu(null);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [contextMenu]);

  // jump to highlight from hash
  useEffect(() => {
    const onHashChange = () => {
      const id = parseIdFromHash();
      const found = highlights.find((h) => h.id === id);
      if (found && highlighterUtilsRef.current) {
        highlighterUtilsRef.current.scrollToHighlight(found);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [highlights]);

  // CRUD helpers
  const addHighlight = (gh: GhostHighlight, comment: string) => {
    const fresh: CommentedHighlight = {
      ...gh,
      comment,
      id: getNextId(),
    };
    setHighlights([fresh, ...highlights]);
  };
  const deleteHighlight = (
    h: ViewportHighlight | Highlight
  ) => {
    setHighlights(highlights.filter((x) => x.id !== h.id));
  };
  const editHighlight = (
    idToEdit: string,
    changes: Partial<CommentedHighlight>
  ) => {
    setHighlights(
      highlights.map((h) =>
        h.id === idToEdit ? { ...h, ...changes } : h
      )
    );
  };
  const editComment = (h: ViewportHighlight<CommentedHighlight>) => {
    if (!highlighterUtilsRef.current) return;
    const tip: Tip = {
      position: h.position,
      content: (
        <CommentForm
          placeHolder={h.comment}
          onSubmit={(text) => {
            editHighlight(h.id, { comment: text });
            highlighterUtilsRef.current!.setTip(null);
            highlighterUtilsRef.current!.toggleEditInProgress(false);
          }}
        />
      ),
    };
    highlighterUtilsRef.current.setTip(tip);
    highlighterUtilsRef.current.toggleEditInProgress(true);
  };
  const handleContextMenu = (
    e: MouseEvent<HTMLDivElement>,
    h: ViewportHighlight<CommentedHighlight>
  ) => {
    e.preventDefault();
    setContextMenu({
      xPos: e.clientX,
      yPos: e.clientY,
      deleteHighlight: () => deleteHighlight(h),
      editComment: () => editComment(h),
    });
  };
  const resetHighlights = () => setHighlights([]);
  const onScrollAway = () => resetHash();

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Always show toolbar, but disable its buttons if no PDF */}
        <Toolbar
          setPdfScaleValue={setPdfScaleValue}
          toggleHighlightPen={() => setHighlightPen((p) => !p)}
          disabled={!url}
        />

        {/* If no URL/file picked yet → show pickers */}
        {!url ? (
          <div
            style={{
              height: "calc(100% - 41px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <input
                type="text"
                placeholder="Enter PDF URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                style={{ width: 300, marginRight: 8 }}
              />
              <button onClick={onLoadUrl}>Load by URL</button>
            </div>
            <div>
              <label>
                Or select a local PDF file:&nbsp;
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onFileChange}
                />
              </label>
            </div>
          </div>
        ) : (
          <PdfLoader document={url}>
            {(pdfDocument) => (
              <PdfHighlighter
                enableAreaSelection={(e) => e.altKey}
                pdfDocument={pdfDocument}
                onScrollAway={onScrollAway}
                utilsRef={(u) => (highlighterUtilsRef.current = u)}
                pdfScaleValue={pdfScaleValue}
                textSelectionColor={
                  highlightPen ? "rgba(255,226,143,1)" : undefined
                }
                onSelection={
                  highlightPen
                    ? (sel) =>
                        addHighlight(sel.makeGhostHighlight(), "")
                    : undefined
                }
                selectionTip={
                  highlightPen ? undefined : (
                    <ExpandableTip addHighlight={addHighlight} />
                  )
                }
                highlights={highlights}
                style={{ height: "calc(100% - 41px)" }}
              >
                <HighlightContainer
                  editHighlight={editHighlight}
                  onContextMenu={handleContextMenu}
                />
              </PdfHighlighter>
            )}
          </PdfLoader>
        )}

        {contextMenu && <ContextMenu {...contextMenu} />}
      </div>
    </div>
  );
}
