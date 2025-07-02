const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, "highlights.json");

app.use(cors());
app.use(bodyParser.json());

// Utility
const loadData = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// GET highlights for a document
app.get("/api/highlights", (req, res) => {
  const { docId } = req.query;
  const data = loadData();
  res.json(data[docId] || []);
});

// POST a new highlight
app.post("/api/highlights", (req, res) => {
  const { docId, highlight } = req.body;
  const data = loadData();
  if (!data[docId]) data[docId] = [];
  data[docId].unshift(highlight);
  saveData(data);
  res.json({ success: true });
});

// PUT to update a highlight
app.put("/api/highlights/:docId/:id", (req, res) => {
  const { docId, id } = req.params;
  const updates = req.body;
  const data = loadData();
  const list = data[docId] || [];
  const index = list.findIndex((h) => h.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  data[docId][index] = { ...list[index], ...updates };
  saveData(data);
  res.json({ success: true });
});

// DELETE a highlight
app.delete("/api/highlights/:docId/:id", (req, res) => {
  const { docId, id } = req.params;
  const data = loadData();
  data[docId] = (data[docId] || []).filter((h) => h.id !== id);
  saveData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
