const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

/* ==========================
   PORT (Render-safe)
========================== */
const PORT = process.env.PORT || 3000;

/* ==========================
   DATA DIRECTORY (Render Disk)
========================== */
const DATA_DIR = process.env.RENDER
  ? '/data'
  : path.join(__dirname, 'data');

const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

/* ==========================
   ENSURE FILES EXIST
========================== */
function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

ensureFileExists(NOTES_FILE);
ensureFileExists(REMINDERS_FILE);

/* ==========================
   MIDDLEWARE
========================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================
   UTILITY FUNCTIONS
========================== */
function readData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return data ? JSON.parse(data) : [];
}

function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* ==========================
   HEALTH CHECK (IMPORTANT)
========================== */
app.get('/', (req, res) => {
  res.send('🚀 Server is running');
});

/* ==========================
   NOTES ROUTES
========================== */
app.get('/api/notes', (req, res) => {
  res.json(readData(NOTES_FILE));
});

app.post('/api/notes', (req, res) => {
  const notes = readData(NOTES_FILE);

  const newNote = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    category: req.body.category
  };

  notes.push(newNote);
  writeData(NOTES_FILE, notes);
  res.status(201).json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
  const notes = readData(NOTES_FILE);
  const id = Number(req.params.id);

  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Note not found' });
  }

  notes[index] = { ...notes[index], ...req.body };
  writeData(NOTES_FILE, notes);
  res.json(notes[index]);
});

app.delete('/api/notes/:id', (req, res) => {
  const notes = readData(NOTES_FILE);
  const id = Number(req.params.id);

  writeData(
    NOTES_FILE,
    notes.filter(n => n.id !== id)
  );

  res.json({ message: 'Note deleted' });
});

/* ==========================
   REMINDERS ROUTES
========================== */
app.get('/api/reminders', (req, res) => {
  res.json(readData(REMINDERS_FILE));
});

app.post('/api/reminders', (req, res) => {
  const reminders = readData(REMINDERS_FILE);

  const newReminder = {
    id: Date.now(),
    title: req.body.title,
    date: req.body.date,
    category: req.body.category,
    completed: false
  };

  reminders.push(newReminder);
  writeData(REMINDERS_FILE, reminders);
  res.status(201).json(newReminder);
});

app.put('/api/reminders/:id', (req, res) => {
  const reminders = readData(REMINDERS_FILE);
  const id = Number(req.params.id);

  const index = reminders.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Reminder not found' });
  }

  reminders[index] = { ...reminders[index], ...req.body };
  writeData(REMINDERS_FILE, reminders);
  res.json(reminders[index]);
});

app.delete('/api/reminders/:id', (req, res) => {
  const reminders = readData(REMINDERS_FILE);
  const id = Number(req.params.id);

  writeData(
    REMINDERS_FILE,
    reminders.filter(r => r.id !== id)
  );

  res.json({ message: 'Reminder deleted' });
});

/* ==========================
   START SERVER
========================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
