import React, { createContext, useContext } from "react";
import { CommentedHighlight } from "../types";

interface HighlightAPIContextType {
  docId: string;
  fetchHighlights: () => Promise<CommentedHighlight[]>;
  saveHighlight: (h: CommentedHighlight) => Promise<void>;
  updateHighlight: (id: string, data: Partial<CommentedHighlight>) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
}

const HighlightAPIContext = createContext<HighlightAPIContextType | null>(null);

interface ProviderProps {
  docId: string;
  children: React.ReactNode;
}

export const HighlightAPIProvider = ({ docId, children }: ProviderProps) => {
  const baseUrl = "http://localhost:5000/api";

  const fetchHighlights = async () => {
    const res = await fetch(`${baseUrl}/highlights?docId=${docId}`);
    return res.json();
  };

  const saveHighlight = async (highlight: CommentedHighlight) => {
    await fetch(`${baseUrl}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, highlight }),
    });
  };

  const updateHighlight = async (id: string, data: Partial<CommentedHighlight>) => {
    await fetch(`${baseUrl}/highlights/${docId}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const deleteHighlight = async (id: string) => {
    await fetch(`${baseUrl}/highlights/${docId}/${id}`, {
      method: "DELETE",
    });
  };

  return (
    <HighlightAPIContext.Provider
      value={{ docId, fetchHighlights, saveHighlight, updateHighlight, deleteHighlight }}
    >
      {children}
    </HighlightAPIContext.Provider>
  );
};

export const useHighlightAPI = () => {
  const ctx = useContext(HighlightAPIContext);
  if (!ctx) throw new Error("useHighlightAPI must be used within HighlightAPIProvider");
  return ctx;
};
