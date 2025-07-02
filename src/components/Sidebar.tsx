// // src/components/Sidebar.tsx
// import React from "react";
// import { CommentedHighlight, Bookmark } from "../types";

// export interface SidebarProps {
//   highlights: CommentedHighlight[];
//   comments: CommentedHighlight[];
//   bookmarks: Bookmark[];
//   resetHighlights: () => void;
//   resetComments: () => void;
//   resetBookmarks: () => void;
//   toggleDocument: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({
//   highlights,
//   comments,
//   bookmarks,
//   resetHighlights,
//   resetComments,
//   resetBookmarks,
//   toggleDocument,
// }) => (
//   <div className="Sidebar">
//     <button onClick={toggleDocument}>Toggle PDF</button>

//     <h3>Highlights</h3>
//     {highlights.map((h) => (
//       <div key={h.id}>{h.content?.text || "(image)"}</div>
//     ))}
//     <button onClick={resetHighlights}>Clear Highlights</button>

//     <h3>Comments</h3>
//     {comments.map((c) => (
//       <div key={c.id}>{c.comment}</div>
//     ))}
//     <button onClick={resetComments}>Clear Comments</button>

//     <h3>Bookmarks</h3>
//     {bookmarks.map((b) => (
//       <div key={b.id}>Page {b.pageNumber}</div>
//     ))}
//     <button onClick={resetBookmarks}>Clear Bookmarks</button>
//   </div>
// );

// export default Sidebar;

















import React from "react";
import type { Highlight } from "../react-pdf-highlighter-extended";
import "./style/Sidebar.css";
import { CommentedHighlight } from "../types";

interface SidebarProps {
  highlights: Array<CommentedHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
}

const updateHash = (highlight: Highlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

declare const APP_VERSION: string;

const Sidebar = ({
  highlights,
  toggleDocument,
  resetHighlights,
}: SidebarProps) => {
  return (
    <div className="sidebar" style={{ width: "25vw", maxWidth: "500px" }}>
      {/* Highlights list */}
      {highlights && (
        <ul className="sidebar__highlights">
          {highlights.map((highlight, index) => (
            <li
              key={index}
              className="sidebar__highlight"
              onClick={() => {
                updateHash(highlight);
              }}
            >
              <div>
                {/* Highlight comment and text */}
                <strong>{highlight.comment}</strong>
                {highlight.content.text && (
                  <blockquote style={{ marginTop: "0.5rem" }}>
                    {`${highlight.content.text.slice(0, 90).trim()}…`}
                  </blockquote>
                )}

                {/* Highlight image */}
                {highlight.content.image && (
                  <div
                    className="highlight__image__container"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img
                      src={highlight.content.image}
                      alt={"Screenshot"}
                      className="highlight__image"
                    />
                  </div>
                )}
              </div>

              {/* Highlight page number */}
              <div className="highlight__location">
                Page {highlight.position.boundingRect.pageNumber}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ padding: "0.5rem" }}>
        <button onClick={toggleDocument} className="sidebar__toggle">
          Toggle PDF document
        </button>
      </div>

      {highlights && highlights.length > 0 && (
        <div style={{ padding: "0.5rem" }}>
          <button onClick={resetHighlights} className="sidebar__reset">
            Reset highlights
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
