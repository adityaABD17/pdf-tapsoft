import { Highlight, Content } from "./react-pdf-highlighter-extended";

export interface CommentedHighlight extends Highlight {
  content: Content;
  comment?: string;
  createdAt?:string;
}



// import { HighlightType, Content } from "./react-pdf-highlighter-extended";

// export interface CommentedHighlight {
//   id: string;
//   type?: HighlightType;
//   content: Content;
//   position: any;      // we’ll treat the position as “any” to avoid mismatches
//   comment: string;
//   createdAt: string;
// }

// export interface Bookmark {
//   id: string;
//   pageNumber: number;
//   createdAt: string;
// }



