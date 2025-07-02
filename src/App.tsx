
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
import "./App.css";
import { CommentedHighlight } from "./types";

const getNextId = () => String(Math.random()).slice(2);
const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);
const resetHash = () => (document.location.hash = "");

// 📦 Hash PDF to generate stable docId
const hashFile = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export default function App() {
  const [url, setUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<CommentedHighlight[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  const [pdfScaleValue, setPdfScaleValue] = useState<number>();
  const [highlightPen, setHighlightPen] = useState(false);
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>(null);

  useEffect(() => {
    const fetchFromBackend = async () => {
      if (!docId) return;
      try {
        const res = await fetch(`/api/highlights?docId=${docId}`);
        if (res.ok) {
          const data = await res.json();
          setHighlights(data);
        } else {
          console.warn("No highlights found for this docId");
        }
      } catch (err) {
        console.warn("Backend fetch error:", err);
      }
    };
    fetchFromBackend();
  }, [docId]);

  const addHighlight = (gh: GhostHighlight, comment: string) => {
    const fresh: CommentedHighlight = {
      ...gh,
      comment,
      id: getNextId(),
      createdAt: new Date().toISOString(),
    };
    setHighlights((prev) => [fresh, ...prev]);

    if (docId) {
      fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, highlight: fresh }),
      }).catch((err) => console.warn("POST failed:", err));
    }
  };

  const editHighlight = (id: string, changes: Partial<CommentedHighlight>) => {
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, ...changes } : h)));

    if (docId) {
      fetch(`/api/highlights/${docId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      }).catch((err) => console.warn("PUT failed:", err));
    }
  };

  const deleteHighlight = (h: ViewportHighlight | Highlight) => {
    setHighlights((prev) => prev.filter((x) => x.id !== h.id));

    if (docId) {
      fetch(`/api/highlights/${docId}/${h.id}`, {
        method: "DELETE",
      }).catch((err) => console.warn("DELETE failed:", err));
    }
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
            highlighterUtilsRef.current?.setTip(null);
          }}
        />
      ),
    };
    highlighterUtilsRef.current.setTip(tip);
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

  const onLoadUrl = () => {
    if (!inputUrl) return;
    setUrl(inputUrl);
    const safeDocId = inputUrl.split("/").pop()?.replace(/[^a-zA-Z0-9]/g, "_") || "remote_pdf";
    setDocId(safeDocId);
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const hash = await hashFile(file);
    setUrl(blobUrl);
    setDocId(hash.slice(0, 16));
  };

  useEffect(() => {
    const onClick = () => contextMenu && setContextMenu(null);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [contextMenu]);

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

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={() => setHighlights([])}
        toggleDocument={() =>
          setUrl((prev) =>
            prev === "https://arxiv.org/pdf/2203.11115"
              ? "https://arxiv.org/pdf/1604.02480"
              : "https://arxiv.org/pdf/2203.11115"
          )
        }
      />
      <div style={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
        <Toolbar
          setPdfScaleValue={setPdfScaleValue}
          toggleHighlightPen={() => setHighlightPen((p) => !p)}
          disabled={!url}/>

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
                onScrollAway={resetHash}
                utilsRef={(u) => (highlighterUtilsRef.current = u)}
                pdfScaleValue={pdfScaleValue}
                textSelectionColor={
                  highlightPen ? "rgba(255,226,143,1)" : "rgb(179, 9, 9)"
                }
                onSelection={
                  highlightPen
                    ? (sel) => addHighlight(sel.makeGhostHighlight(), "")
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
  )}




// // src/App.tsx
// import React, {
//   MouseEvent,
//   useEffect,
//   useRef,
//   useState,
//   ChangeEvent,
// } from "react";
// import type { PDFDocumentProxy } from "pdfjs-dist";
// import {
//   PdfLoader,
//   PdfHighlighter,
//   PdfHighlighterUtils,
//   GhostHighlight,
//   Tip,
// } from "./react-pdf-highlighter-extended";
// import Sidebar from "./components/Sidebar";
// import Toolbar, { Mode } from "./components/Toolbar";
// import CommentForm from "./components/CommentForm";
// import ExpandableTip from "./components/ExpandableTip";
// import ContextMenu, { ContextMenuProps } from "./components/ContextMenu";
// import HighlightContainer from "./components/HighlightContainer";
// import { CommentedHighlight, Bookmark } from "./types";
// import "./App.css";

// const getNextId = () => String(Math.random()).slice(2);
// const resetHash = () => (location.hash = "");

// export default function App() {
//   const [url, setUrl] = useState<string | null>(null);
//   const [inputUrl, setInputUrl] = useState("");
//   const [mode, setMode] = useState<Mode>("highlight");

//   const [highlights, setHighlights] = useState<CommentedHighlight[]>([]);
//   const [comments, setComments] = useState<CommentedHighlight[]>([]);
//   const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
//   const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(
//     null
//   );

//   const [pdfScaleValue, setPdfScaleValue] = useState<number>(1);
//   const utilsRef = useRef<PdfHighlighterUtils>(null);

//   // Handles both highlight & comment creation
//   const handleSelection = (sel: any) => {
//     const gh: GhostHighlight = sel.makeGhostHighlight();
//     const id = getNextId();

//     // Plain highlight
//     if (mode === "highlight") {
//       const h: CommentedHighlight = {
//         ...gh,
//         id,
//         comment: "",
//         createdAt: new Date().toISOString(),
//       };
//       setHighlights((arr) => [h, ...arr]);
//       utilsRef.current?.removeGhostHighlight();
//     }

//     // Commented highlight
//     if (mode === "comment") {
//       const tip: Tip = {
//         position: gh.position as any,
//         content: (
//           <CommentForm
//             placeHolder=""
//             onSubmit={(text: string) => {
//               const c: CommentedHighlight = {
//                 ...gh,
//                 id,
//                 comment: text,
//                 createdAt: new Date().toISOString(),
//               };
//               setComments((arr) => [c, ...arr]);
//               utilsRef.current?.setTip(null);
//             }}
//           />
//         ),
//       };
//       utilsRef.current?.setTip(tip);
//     }
//   };

//   // Bookmark stub (always page 1)
//   const addBookmark = () => {
//     const pageNumber =
//       (utilsRef.current as any)?.getCurrentPageIndex?.() ?? 1;
//     const b: Bookmark = {
//       id: getNextId(),
//       pageNumber,
//       createdAt: new Date().toISOString(),
//     };
//     setBookmarks((arr) => [b, ...arr]);
//   };

//   // Context menu for existing highlights/comments
//   const handleContextMenu = (
//     e: MouseEvent<HTMLDivElement>,
//     item: CommentedHighlight
//   ) => {
//     e.preventDefault();
//     setContextMenu({
//       xPos: e.clientX,
//       yPos: e.clientY,
//       deleteHighlight: () => {
//         if (mode === "highlight") {
//           setHighlights((arr) => arr.filter((x) => x.id !== item.id));
//         } else {
//           setComments((arr) => arr.filter((x) => x.id !== item.id));
//         }
//         setContextMenu(null);
//       },
//       editComment: () => {
//         const tip: Tip = {
//           position: item.position as any,
//           content: (
//             <CommentForm
//               placeHolder={item.comment}
//               onSubmit={(text: string) => {
//                 if (mode === "highlight") {
//                   setHighlights((arr) =>
//                     arr.map((x) =>
//                       x.id === item.id ? { ...x, comment: text } : x
//                     )
//                   );
//                 } else {
//                   setComments((arr) =>
//                     arr.map((x) =>
//                       x.id === item.id ? { ...x, comment: text } : x
//                     )
//                   );
//                 }
//                 utilsRef.current?.setTip(null);
//                 setContextMenu(null);
//               }}
//             />
//           ),
//         };
//         utilsRef.current?.setTip(tip);
//       },
//     });
//   };

//   // Dismiss context menu on outside click
//   useEffect(() => {
//     const onClick = () => contextMenu && setContextMenu(null);
//     document.addEventListener("click", onClick);
//     return () => document.removeEventListener("click", onClick);
//   }, [contextMenu]);

//   return (
//     <div className="App" style={{ display: "flex", height: "100vh" }}>
//       <Sidebar
//         highlights={highlights}
//         comments={comments}
//         bookmarks={bookmarks}
//         resetHighlights={() => setHighlights([])}
//         resetComments={() => setComments([])}
//         resetBookmarks={() => setBookmarks([])}
//         toggleDocument={() =>
//           setUrl((u) =>
//             u === "https://arxiv.org/pdf/2203.11115"
//               ? "https://arxiv.org/pdf/1604.02480"
//               : "https://arxiv.org/pdf/2203.11115"
//           )
//         }
//       />

//       <div style={{ flexGrow: 1, position: "relative" }}>
//         <Toolbar
//           setPdfScaleValue={setPdfScaleValue}
//           mode={mode}
//           onModeChange={setMode}
//           onBookmark={addBookmark}
//           disabled={!url}
//         />

//         {!url ? (
//           <div
//             style={{
//               height: "calc(100% - 41px)",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: 16,
//             }}
//           >
//             <input
//               type="text"
//               placeholder="Enter PDF URL"
//               value={inputUrl}
//               onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                 setInputUrl(e.target.value)
//               }
//               style={{ width: 300 }}
//             />
//             <button onClick={() => inputUrl && setUrl(inputUrl)}>
//               Load by URL
//             </button>
//             <input
//               type="file"
//               accept="application/pdf"
//               onChange={(e: ChangeEvent<HTMLInputElement>) => {
//                 const f = e.target.files?.[0];
//                 if (f) setUrl(URL.createObjectURL(f));
//               }}
//             />
//           </div>
//         ) : (
//           <PdfLoader document={url}>
//             {(pdfDoc: PDFDocumentProxy) => (
//               <PdfHighlighter
//                 pdfDocument={pdfDoc}
//                 utilsRef={(u) => (utilsRef.current = u)}
//                 pdfScaleValue={pdfScaleValue}
//                 enableAreaSelection={() => mode !== "bookmark"}
//                 onScrollAway={resetHash}
//                 textSelectionColor={
//                   mode === "highlight"
//                     ? "rgba(255,226,143,0.5)"
//                     : "transparent"
//                 }
//                 onSelection={mode === "bookmark" ? undefined : handleSelection}
//                 selectionTip={
//                   mode === "highlight" ? (
//                     <ExpandableTip addHighlight={handleSelection} />
//                   ) : null
//                 }
//                 highlights={[...highlights, ...comments] as any}
//                 style={{ height: "calc(100% - 41px)" }}
//               >
//                 <HighlightContainer
//                   highlights={[...highlights, ...comments]}
//                   onContextMenu={handleContextMenu}
//                   editHighlight={(id, _chgs) => {/* inline edit via context menu */}}
//                 />
//               </PdfHighlighter>
//             )}
//           </PdfLoader>
//         )}

//         {contextMenu && <ContextMenu {...contextMenu} />}
//       </div>
//     </div>
//   );
// }














