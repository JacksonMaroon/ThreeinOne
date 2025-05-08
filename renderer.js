// DOM Elements
const notesBtnEl = document.getElementById('notes-btn');
const todosBtnEl = document.getElementById('todos-btn');
const chatBtnEl = document.getElementById('chat-btn');

const notesPanelEl = document.getElementById('notes-panel');
const todosPanelEl = document.getElementById('todos-panel');
const chatPanelEl = document.getElementById('chat-panel');

// Notes elements
const notesListEl = document.getElementById('notes-list');
const newNoteBtnEl = document.getElementById('new-note-btn');
const noteTitleEl = document.getElementById('note-title');
const noteContentEl = document.getElementById('note-content');
const saveNoteBtnEl = document.getElementById('save-note-btn');
const deleteNoteBtnEl = document.getElementById('delete-note-btn');

// Todo elements
const todoInputEl = document.getElementById('todo-input');
const addTodoBtnEl = document.getElementById('add-todo-btn');
const todosListEl = document.getElementById('todos-list');

// Chat elements
const chatMessagesEl = document.getElementById('chat-messages');
const chatInputEl = document.getElementById('chat-input');
const sendMessageBtnEl = document.getElementById('send-message-btn');

// App state
let currentNote = null;
let notes = [];
let todos = [];
let chatMessages = [];

// Navigation
function showPanel(panel) {
  // Hide all panels
  notesPanelEl.classList.remove('active');
  todosPanelEl.classList.remove('active');
  chatPanelEl.classList.remove('active');
  
  // Remove active class from all buttons
  notesBtnEl.classList.remove('active');
  todosBtnEl.classList.remove('active');
  chatBtnEl.classList.remove('active');
  
  // Show selected panel
  if (panel === 'notes') {
    notesPanelEl.classList.add('active');
    notesBtnEl.classList.add('active');
  } else if (panel === 'todos') {
    todosPanelEl.classList.add('active');
    todosBtnEl.classList.add('active');
  } else if (panel === 'chat') {
    chatPanelEl.classList.add('active');
    chatBtnEl.classList.add('active');
  }
}

// Navigation event listeners
notesBtnEl.addEventListener('click', () => showPanel('notes'));
todosBtnEl.addEventListener('click', () => showPanel('todos'));
chatBtnEl.addEventListener('click', () => showPanel('chat'));

// ----------------
// Notes functionality
// ----------------

// Load notes from storage
async function loadNotes() {
  try {
    notes = await window.api.getNotes();
    renderNotes();
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

// Render notes list
function renderNotes() {
  notesListEl.innerHTML = '';
  
  if (notes.length === 0) {
    notesListEl.innerHTML = '<div class="empty-message">No notes yet. Create one!</div>';
    return;
  }
  
  notes.forEach(note => {
    const noteEl = document.createElement('div');
    noteEl.className = 'note-item';
    if (currentNote && note.id === currentNote.id) {
      noteEl.classList.add('active');
    }
    
    noteEl.innerHTML = `
      <div class="note-title">${note.title || 'Untitled'}</div>
      <div class="note-preview">${getPreviewText(note.content)}</div>
    `;
    
    noteEl.addEventListener('click', () => selectNote(note));
    notesListEl.appendChild(noteEl);
  });
}

// Get preview text for note
function getPreviewText(content) {
  if (!content) return '';
  return content.length > 40 ? content.substring(0, 40) + '...' : content;
}

// Select a note
function selectNote(note) {
  currentNote = note;
  noteTitleEl.value = note.title || '';
  noteContentEl.value = note.content || '';
  renderNotes();
}

// Create a new note
function createNewNote() {
  currentNote = {
    id: Date.now().toString(),
    title: '',
    content: '',
    createdAt: new Date().toISOString()
  };
  
  noteTitleEl.value = '';
  noteContentEl.value = '';
  renderNotes();
}

// Save current note
async function saveNote() {
  if (!currentNote) return;
  
  const updatedNote = {
    ...currentNote,
    title: noteTitleEl.value,
    content: noteContentEl.value,
    updatedAt: new Date().toISOString()
  };
  
  try {
    const savedNote = await window.api.saveNote(updatedNote);
    currentNote = savedNote;
    
    // Update notes array
    const index = notes.findIndex(n => n.id === savedNote.id);
    if (index !== -1) {
      notes[index] = savedNote;
    } else {
      notes.push(savedNote);
    }
    
    renderNotes();
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Delete current note
async function deleteNote() {
  if (!currentNote) return;
  
  try {
    await window.api.deleteNote(currentNote.id);
    notes = notes.filter(note => note.id !== currentNote.id);
    
    currentNote = null;
    noteTitleEl.value = '';
    noteContentEl.value = '';
    
    renderNotes();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

// Notes event listeners
newNoteBtnEl.addEventListener('click', createNewNote);
saveNoteBtnEl.addEventListener('click', saveNote);
deleteNoteBtnEl.addEventListener('click', deleteNote);

// ----------------
// Todos functionality
// ----------------

// Load todos from storage
async function loadTodos() {
  try {
    todos = await window.api.getTodos();
    renderTodos();
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

// Render todos list
function renderTodos() {
  todosListEl.innerHTML = '';
  
  if (todos.length === 0) {
    todosListEl.innerHTML = '<div class="empty-message">No tasks yet. Add one above!</div>';
    return;
  }
  
  todos.forEach(todo => {
    const todoEl = document.createElement('div');
    todoEl.className = 'todo-item';
    if (todo.completed) {
      todoEl.classList.add('todo-completed');
    }
    
    todoEl.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <div class="todo-text">${todo.text}</div>
      <button class="delete-todo">Delete</button>
    `;
    
    const checkbox = todoEl.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    const deleteBtn = todoEl.querySelector('.delete-todo');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    todosListEl.appendChild(todoEl);
  });
}

// Add a new todo
async function addTodo() {
  const text = todoInputEl.value.trim();
  if (!text) return;
  
  const newTodo = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  try {
    const savedTodo = await window.api.saveTodo(newTodo);
    todos.push(savedTodo);
    todoInputEl.value = '';
    renderTodos();
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

// Toggle todo completed status
async function toggleTodo(todoId) {
  try {
    const updatedTodo = await window.api.toggleTodo(todoId);
    
    // Update todos array
    const index = todos.findIndex(t => t.id === todoId);
    if (index !== -1) {
      todos[index] = updatedTodo;
    }
    
    renderTodos();
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
}

// Delete a todo
async function deleteTodo(todoId) {
  try {
    await window.api.deleteTodo(todoId);
    todos = todos.filter(todo => todo.id !== todoId);
    renderTodos();
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}

// Todo event listeners
addTodoBtnEl.addEventListener('click', addTodo);
todoInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ----------------
// Chat functionality
// ----------------

// Send message to Claude
async function sendMessage() {
  const message = chatInputEl.value.trim();
  if (!message) return;
  
  // Add message to chat
  addMessageToChat('user', message);
  chatInputEl.value = '';
  
  try {
    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    addMessageToChat('assistant', 'Thinking...', loadingId);
    
    // Send to Claude API
    const response = await window.api.sendToClaude(message);
    
    // Replace loading message with response
    replaceMessage(loadingId, 'assistant', response);
  } catch (error) {
    console.error('Error sending message to Claude:', error);
    addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.');
  }
}

// Add message to chat
function addMessageToChat(sender, text, id = null) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${sender}-message`;
  if (id) messageEl.id = id;
  messageEl.textContent = text;
  
  chatMessagesEl.appendChild(messageEl);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  
  // Save to chat history
  chatMessages.push({
    id: id || Date.now().toString(),
    sender,
    text,
    timestamp: new Date().toISOString()
  });
}

// Replace message (for loading indicator)
function replaceMessage(id, sender, text) {
  const messageEl = document.getElementById(id);
  if (messageEl) {
    messageEl.textContent = text;
  } else {
    addMessageToChat(sender, text);
  }
  
  // Update in chat history
  const index = chatMessages.findIndex(m => m.id === id);
  if (index !== -1) {
    chatMessages[index].text = text;
  }
}

// Chat event listeners
sendMessageBtnEl.addEventListener('click', sendMessage);
chatInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ----------------
// Initialize app
// ----------------
async function initApp() {
  await loadNotes();
  await loadTodos();
  
  // Add welcome message to chat
  addMessageToChat('assistant', 'Hello! I\'m Claude, your AI assistant. How can I help you today?');
  
  // Show notes panel by default
  showPanel('notes');
}

document.addEventListener('DOMContentLoaded', initApp);