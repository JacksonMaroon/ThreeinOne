const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// Load environment variables
require('dotenv').config();
const { getClaudeResponse } = require('./claude-api');
// Add global fetch for Node.js environment
global.fetch = require('node-fetch');

// Store for data persistence
const dataStore = {
  notes: [],
  todos: []
};

// Data file paths
const notesPath = path.join(app.getPath('userData'), 'notes.json');
const todosPath = path.join(app.getPath('userData'), 'todos.json');

// Load saved data if it exists
function loadSavedData() {
  try {
    if (fs.existsSync(notesPath)) {
      dataStore.notes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
    }
    
    if (fs.existsSync(todosPath)) {
      dataStore.todos = JSON.parse(fs.readFileSync(todosPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
}

// Save data to disk
function saveData(type) {
  try {
    if (type === 'notes' || type === 'all') {
      fs.writeFileSync(notesPath, JSON.stringify(dataStore.notes));
    }
    
    if (type === 'todos' || type === 'all') {
      fs.writeFileSync(todosPath, JSON.stringify(dataStore.todos));
    }
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
  }
}

// Create the browser window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  loadSavedData();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for note operations
ipcMain.handle('get-notes', () => {
  return dataStore.notes;
});

ipcMain.handle('save-note', (event, note) => {
  if (note.id) {
    const index = dataStore.notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      dataStore.notes[index] = note;
    } else {
      dataStore.notes.push(note);
    }
  } else {
    note.id = Date.now().toString();
    dataStore.notes.push(note);
  }
  
  saveData('notes');
  return note;
});

ipcMain.handle('delete-note', (event, noteId) => {
  dataStore.notes = dataStore.notes.filter(note => note.id !== noteId);
  saveData('notes');
  return true;
});

// IPC handlers for todo operations
ipcMain.handle('get-todos', () => {
  return dataStore.todos;
});

ipcMain.handle('save-todo', (event, todo) => {
  if (todo.id) {
    const index = dataStore.todos.findIndex(t => t.id === todo.id);
    if (index !== -1) {
      dataStore.todos[index] = todo;
    } else {
      dataStore.todos.push(todo);
    }
  } else {
    todo.id = Date.now().toString();
    dataStore.todos.push(todo);
  }
  
  saveData('todos');
  return todo;
});

ipcMain.handle('delete-todo', (event, todoId) => {
  dataStore.todos = dataStore.todos.filter(todo => todo.id !== todoId);
  saveData('todos');
  return true;
});

ipcMain.handle('toggle-todo', (event, todoId) => {
  const todo = dataStore.todos.find(t => t.id === todoId);
  if (todo) {
    todo.completed = !todo.completed;
    saveData('todos');
  }
  return todo;
});

// IPC handler for Claude API
ipcMain.handle('send-to-claude', async (event, message) => {
  try {
    const response = await getClaudeResponse(message);
    return response;
  } catch (error) {
    console.error('Error in Claude API handler:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
});