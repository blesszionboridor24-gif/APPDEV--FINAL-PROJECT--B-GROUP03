/* ==========================
   GLOBAL VARIABLES
========================== */
let notes = [];
let reminders = [];
let notifications = [];

let currentFilter = "all";
let editingNoteId = null;
let editingReminderId = null;

/* ==========================
   DOM ELEMENTS
========================== */
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteCategory = document.getElementById('noteCategory');
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const emptyNotes = document.getElementById('emptyNotes');

const reminderTitle = document.getElementById('reminderTitle');
const reminderDate = document.getElementById('reminderDate');
const reminderCategory = document.getElementById('reminderCategory');
const reminderForm = document.getElementById('reminderForm');
const remindersList = document.getElementById('remindersList');
const emptyReminders = document.getElementById('emptyReminders');

const notificationPanel = document.getElementById('notificationPanel');
const notificationList = document.getElementById('notificationList');
const notificationCount = document.getElementById('notificationCount');
const notificationBell = document.getElementById('notificationToggle');


/* ==========================
   INITIALIZATION
========================== */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    setDefaultReminderDate();
    await fetchNotes();
    await fetchReminders();
    renderNotifications();
    updateNotificationCount();
}

/* ==========================
   FETCH HELPERS
========================== */
async function fetchNotes() {
    try {
        const res = await fetch('/api/notes');
        notes = await res.json();
        renderNotes();
    } catch (err) {
        console.error("Error fetching notes:", err);
    }
}

async function fetchReminders() {
    try {
        const res = await fetch('/api/reminders');
        reminders = await res.json();
        renderReminders();
    } catch (err) {
        console.error("Error fetching reminders:", err);
    }
}

/* ==========================
   EVENT LISTENERS
========================== */
function setupEventListeners() {
    noteForm.addEventListener('submit', e => {
        e.preventDefault();
        handleNoteSubmit();
    });

    reminderForm.addEventListener('submit', e => {
        e.preventDefault();
        handleReminderSubmit();
    });

    document.getElementById('notificationToggle')
        .addEventListener('click', toggleNotificationPanel);

    document.getElementById('clearNotifications')
        .addEventListener('click', clearAllNotifications);

    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function () {
            document.querySelectorAll('.category-filter')
                .forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            renderNotes();
            renderReminders();
        });
    });
}

/* ==========================
   NOTES CRUD
========================== */
async function handleNoteSubmit() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const category = noteCategory.value;

    if (!title || !content) return alert("Please fill in all fields");

    try {
        if (editingNoteId) {
            await fetch(`/api/notes/${editingNoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            });
            addNotification(`Note updated: ${title}`);
            editingNoteId = null;
        } else {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            });
            addNotification(`New note added: ${title}`);
        }
    } catch (err) {
        console.error("Error saving note:", err);
    }

    noteForm.reset();
    fetchNotes();
}

async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;

    try {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        addNotification("Note deleted");
        fetchNotes();
    } catch (err) {
        console.error("Error deleting note:", err);
    }
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    noteTitle.value = note.title;
    noteContent.value = note.content;
    noteCategory.value = note.category;
    editingNoteId = id;
}

/* ==========================
   REMINDERS CRUD
========================== */
async function handleReminderSubmit() {
    const title = reminderTitle.value.trim();
    const date = reminderDate.value;
    const category = reminderCategory.value;

    if (!title || !date) return alert("Please fill in all fields");

    try {
        if (editingReminderId) {
            await fetch(`/api/reminders/${editingReminderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, category })
            });
            addNotification(`Reminder updated: ${title}`);
            editingReminderId = null;
        } else {
            await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, category, completed: false })
            });
            addNotification(`New reminder set: ${title}`);
        }
    } catch (err) {
        console.error("Error saving reminder:", err);
    }

    reminderForm.reset();
    setDefaultReminderDate();
    fetchReminders();
}

async function deleteReminder(id) {
    if (!confirm("Delete reminder?")) return;

    try {
        await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
        addNotification("Reminder deleted");
        fetchReminders();
    } catch (err) {
        console.error("Error deleting reminder:", err);
    }
}

async function toggleReminderCompletion(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    reminder.completed = !reminder.completed;

    try {
        await fetch(`/api/reminders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: reminder.completed })
        });
        addNotification(`Reminder "${reminder.title}" ${reminder.completed ? "completed" : "reopened"}`);
        fetchReminders();
    } catch (err) {
        console.error("Error updating reminder:", err);
    }
}

function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    reminderTitle.value = reminder.title;
    reminderDate.value = reminder.date;
    reminderCategory.value = reminder.category;
    editingReminderId = id;
}

/* ==========================
   RENDERING
========================== */
/* THIS IS THE FIXED VERSION FOR RENDERNOTES */
function renderNotes() {
    notesList.innerHTML = '';

    const filtered = currentFilter === 'all'
        ? notes
        : notes.filter(n => n.category === currentFilter);

    if (!filtered.length) {
        emptyNotes.classList.remove('hidden');
        return;
    }

    emptyNotes.classList.add('hidden');

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';

        const createdDate = note.createdAt
            ? new Date(note.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString();

        card.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>

                <div class="note-actions">
                    <button class="icon-btn edit" onclick="editNote(${note.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteNote(${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <span class="note-category ${note.category}">
                ${capitalize(note.category)}
            </span>

            <p class="note-content">
                ${note.content}
            </p>

            <div class="note-date">
                <i class="fas fa-calendar"></i>
                Added on ${createdDate}
            </div>
        `;

        notesList.appendChild(card);
    });
}
/* old reminder render 
function renderReminders() {
    remindersList.innerHTML = '';
    let filtered = currentFilter === 'all'
        ? reminders
        : reminders.filter(r => r.category === currentFilter);

    if (!filtered.length) {
        emptyReminders.classList.remove('hidden');
        return;
    }
    emptyReminders.classList.add('hidden');

    filtered.forEach(rem => {
        const div = document.createElement('div');
        div.className = `reminder-item ${rem.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <span>${rem.title}</span>
            <small>${new Date(rem.date).toLocaleString()}</small>
            <button onclick="toggleReminderCompletion(${rem.id})">✔</button>
            <button onclick="editReminder(${rem.id})">✏️</button>
            <button onclick="deleteReminder(${rem.id})">🗑️</button>
        `;
        remindersList.appendChild(div);
    });
}
*/
function renderReminders() {
    remindersList.innerHTML = '';

    const filtered = currentFilter === 'all'
        ? reminders
        : reminders.filter(r => r.category === currentFilter);

    if (!filtered.length) {
        emptyReminders.classList.remove('hidden');
        return;
    }

    emptyReminders.classList.add('hidden');

    filtered.forEach(rem => {
        const card = document.createElement('div');
        card.className = `reminder-card ${rem.completed ? 'completed' : ''}`;

        const reminderDateText = new Date(rem.date).toLocaleString();

        card.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${rem.title}</h3>

                <div class="note-actions">
                    <button class="icon-btn success" onclick="toggleReminderCompletion(${rem.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="icon-btn edit" onclick="editReminder(${rem.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteReminder(${rem.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <span class="note-category ${rem.category}">
                ${capitalize(rem.category)}
            </span>

            <div class="note-date">
                <i class="fas fa-clock"></i>
                ${reminderDateText}
            </div>
        `;

        remindersList.appendChild(card);
    });
}


/* ==========================
   NOTIFICATIONS
========================== */
function addNotification(message) {
    notifications.push({
        id: Date.now(),
        message,
        read: false,
        date: new Date().toLocaleDateString()
    });

    if (Notification.permission === "granted") {
        new Notification("Student Notes App", { body: message });
    }

    updateNotificationCount();
    renderNotifications();
}

function renderNotifications() {
    notificationList.innerHTML = '';
    if (!notifications.length) {
        notificationList.innerHTML = "<p>No notifications</p>";
        return;
    }

    notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.innerHTML = `<p>${n.message}</p><small>${n.date}</small>`;
        notificationList.appendChild(div);
    });
}

function updateNotificationCount() {
    const unread = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unread;
    notificationCount.style.display = unread ? 'flex' : 'none';
}

//function toggleNotificationPanel() {
  //  notificationPanel.classList.toggle('hidden');
    //notifications.forEach(n => n.read = true);
    //updateNotificationCount();
//}
/*
function toggleNotificationPanel() {
    notificationPanel.classList.toggle('show');
    notifications.forEach(n => n.read = true);
    updateNotificationCount();
}*/
function toggleNotificationPanel(event) {
    event.stopPropagation(); // ⛔ stop document click
    notificationPanel.classList.toggle('show');
    notifications.forEach(n => n.read = true);
    updateNotificationCount();
}
notificationPanel.addEventListener('click', function(event) {
    event.stopPropagation();
});

//this should close the panel for notif 
document.addEventListener('click', function(event) {
    const isClickInsidePanel = notificationPanel.contains(event.target);
    const isClickOnBell = notificationBell.contains(event.target); // assuming this is your bell icon

    if (!isClickInsidePanel && !isClickOnBell) {
        notificationPanel.classList.remove('show');
    }
});

function clearAllNotifications() {
    notifications = [];
    renderNotifications();
    updateNotificationCount();
}

/* ==========================
   HELPER FUNCTIONS
========================== */
function setDefaultReminderDate() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    reminderDate.value = now.toISOString().slice(0, 16);
}

/*additional helpers for rendering notes*/
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
