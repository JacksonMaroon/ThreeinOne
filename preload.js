const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Note operations
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  
  // Todo operations
  getTodos: () => ipcRenderer.invoke('get-todos'),
  saveTodo: (todo) => ipcRenderer.invoke('save-todo', todo),
  deleteTodo: (todoId) => ipcRenderer.invoke('delete-todo', todoId),
  toggleTodo: (todoId) => ipcRenderer.invoke('toggle-todo', todoId),
  
  // Claude API operations
  sendToClaude: (message) => ipcRenderer.invoke('send-to-claude', message)
});