export const getDocId = (urlOrPath: string, fileName?: string, hash?: string): string => {
  if (hash) return hash.slice(0, 16); // Content-based hash for stability
  if (fileName) return fileName.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = urlOrPath.split("/").pop() || "document";
  return filename.replace(/[^a-zA-Z0-9]/g, "_");
};