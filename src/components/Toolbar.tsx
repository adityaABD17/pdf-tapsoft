import React, { useState } from "react";

import "./style/Toolbar.css";

interface ToolbarProps {
  setPdfScaleValue: (value: number) => void;
  toggleHighlightPen: () => void;
  disabled?: boolean; 
}

const Toolbar = ({ setPdfScaleValue, toggleHighlightPen }: ToolbarProps) => {
  const [zoom, setZoom] = useState<number | null>(null);
  const [isHighlightPen, setIsHighlightPen] = useState<boolean>(false);

  const zoomIn = () => {
    if (zoom) {
      if (zoom < 4) {
        setPdfScaleValue(zoom + 0.1);
        setZoom(zoom + 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  const zoomOut = () => {
    if (zoom) {
      if (zoom > 0.2) {
        setPdfScaleValue(zoom - 0.1);
        setZoom(zoom - 0.1);
      }
    } else {
      setPdfScaleValue(1);
      setZoom(1);
    }
  };

  return (
    <div className="Toolbar">
      <div className="ZoomControls">
        <button title="Zoom in" onClick={zoomIn}>+</button>
        <button title="Zoom out" onClick={zoomOut}>-</button>
        {zoom ? `${(zoom * 100).toFixed(0)}%` : "Auto"}
      </div>
      <button title="Highlight" className={`HighlightButton ${isHighlightPen ? 'active' : ''}`} onClick={() => {
        toggleHighlightPen();
        setIsHighlightPen(!isHighlightPen);
      }}>Toggle Highlights</button>
    </div>
  );
};

export default Toolbar;
// src/components/Toolbar.tsx
// src/components/Toolbar.tsx
// import React, { useState } from "react";
// import "./style/Toolbar.css";

// export type Mode = "highlight" | "comment" | "bookmark";

// export interface ToolbarProps {
//   setPdfScaleValue: (v: number) => void;
//   mode: Mode;
//   onModeChange: (m: Mode) => void;
//   onBookmark: () => void;
//   disabled?: boolean;
// }

// const Toolbar: React.FC<ToolbarProps> = ({
//   setPdfScaleValue,
//   mode,
//   onModeChange,
//   onBookmark,
//   disabled = false,
// }) => {
//   const [zoom, setZoom] = useState(1);

//   const inc = () => {
//     const next = Math.min(4, +(zoom + 0.1).toFixed(2));
//     setZoom(next);
//     setPdfScaleValue(next);
//   };
//   const dec = () => {
//     const next = Math.max(0.2, +(zoom - 0.1).toFixed(2));
//     setZoom(next);
//     setPdfScaleValue(next);
//   };

//   return (
//     <div className={`Toolbar ${disabled ? "Toolbar--disabled" : ""}`}>
//       <button onClick={inc} disabled={disabled}>+</button>
//       <button onClick={dec} disabled={disabled}>–</button>
//       <span>{Math.round(zoom * 100)}%</span>

//       <button
//         className={mode === "highlight" ? "active" : ""}
//         onClick={() => onModeChange("highlight")}
//         disabled={disabled}
//       >
//         Highlight
//       </button>
//       <button
//         className={mode === "comment" ? "active" : ""}
//         onClick={() => onModeChange("comment")}
//         disabled={disabled}
//       >
//         Comment
//       </button>
//       <button
//         className={mode === "bookmark" ? "active" : ""}
//         onClick={onBookmark}
//         disabled={disabled}
//       >
//         Bookmark
//       </button>
//     </div>
//   );
// };

// export default Toolbar;
