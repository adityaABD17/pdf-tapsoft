import React, { MouseEvent } from "react";
import HighlightPopup from "./HighlightPopup";
import {
  AreaHighlight,
  MonitoredHighlightContainer,
  TextHighlight,
  Tip,
  ViewportHighlight,
  useHighlightContainerContext,
  usePdfHighlighterContext,
} from "../react-pdf-highlighter-extended";
import { CommentedHighlight } from "../types";

interface HighlightContainerProps {
  editHighlight: (
    idToUpdate: string,
    edit: Partial<CommentedHighlight>,
  ) => void;
  onContextMenu?: (
    event: MouseEvent<HTMLDivElement>,
    highlight: ViewportHighlight<CommentedHighlight>,
  ) => void;
}

const HighlightContainer = ({
  editHighlight,
  onContextMenu,
}: HighlightContainerProps) => {
  const {
    highlight,
    viewportToScaled,
    screenshot,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContainerContext<CommentedHighlight>();

  const { toggleEditInProgress } = usePdfHighlighterContext();

  const component = highlight.type === "text" ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      onChange={(boundingRect) => {
        const edit = {
          position: {
            boundingRect: viewportToScaled(boundingRect),
            rects: [],
          },
          content: {
            image: screenshot(boundingRect),
          },
        };

        editHighlight(highlight.id, edit);
        toggleEditInProgress(false);
      }}
      bounds={highlightBindings.textLayer}
      onContextMenu={(event) =>
        onContextMenu && onContextMenu(event, highlight)
      }
      onEditStart={() => toggleEditInProgress(true)}
    />
  );

  const highlightTip: Tip = {
    position: highlight.position,
    content: <HighlightPopup highlight={highlight} />,
  };

  return (
    <MonitoredHighlightContainer
      highlightTip={highlightTip}
      key={highlight.id}
      children={component}
    />
  );
};

export default HighlightContainer;

// // src/components/HighlightContainer.tsx
// import React, { MouseEvent } from "react";
// import HighlightPopup from "./HighlightPopup";
// import {
//   AreaHighlight,
//   MonitoredHighlightContainer,
//   TextHighlight,
//   Tip,
//   ViewportHighlight,
//   useHighlightContainerContext,
//   usePdfHighlighterContext,
// } from "../react-pdf-highlighter-extended";
// import { CommentedHighlight } from "../types";

// export interface HighlightContainerProps {
//   editHighlight: (
//     idToUpdate: string,
//     edit: Partial<CommentedHighlight>
//   ) => void;
//   onContextMenu?: (
//     event: MouseEvent<HTMLDivElement>,
//     highlight: ViewportHighlight<CommentedHighlight>
//   ) => void;
// }

// const HighlightContainer: React.FC<HighlightContainerProps> = ({
//   editHighlight,
//   onContextMenu,
// }) => {
//   const {
//     highlight,
//     viewportToScaled,
//     screenshot,
//     isScrolledTo,
//     highlightBindings,
//   } = useHighlightContainerContext<CommentedHighlight>();

//   const { toggleEditInProgress } = usePdfHighlighterContext();

//   // Decide whether it’s a text‐ or area‐based highlight
//   const component =
//     highlight.type === "text" ? (
//       <TextHighlight
//         isScrolledTo={isScrolledTo}
//         highlight={highlight}
//         onContextMenu={(e) => onContextMenu?.(e, highlight)}
//       />
//     ) : (
//       <AreaHighlight
//         isScrolledTo={isScrolledTo}
//         highlight={highlight}
//         // When user drags to resize/move an area
//         onChange={(boundingRect) => {
//           const scaled = viewportToScaled(boundingRect);
//           editHighlight(highlight.id, {
//             position: { boundingRect: scaled, rects: [] },
//             content: { image: screenshot(boundingRect) },
//           });
//           toggleEditInProgress(false);
//         }}
//         onEditStart={() => toggleEditInProgress(true)}
//         onContextMenu={(e) => onContextMenu?.(e, highlight)}
//         bounds={highlightBindings.textLayer}
//       />
//     );

//   // The little hover popup
//   const highlightTip: Tip = {
//     position: highlight.position,
//     content: <HighlightPopup highlight={highlight} />,
//   };

//   return (
//     <MonitoredHighlightContainer
//       key={highlight.id}
//       highlightTip={highlightTip}
//     >
//       {component}
//     </MonitoredHighlightContainer>
//   );
// };

// export default HighlightContainer;
