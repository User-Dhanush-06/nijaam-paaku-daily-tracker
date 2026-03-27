import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure logic functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Add a task to the list. Returns the new list, or the same list if invalid.
 * @param {Task[]} tasks
 * @param {string} description
 * @returns {{ tasks: Task[], added: boolean }}
 */
export function addTask(tasks, description) {
  if (!description || description.trim() === '') {
    return { tasks, added: false };
  }
  const task = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    description: description.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  return { tasks: [...tasks, task], added: true };
}

/**
 * Mark a task as complete. Returns the updated list.
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {Task[]}
 */
export function completeTask(tasks, id) {
  return tasks.map(t =>
    t.id === id
      ? { ...t, completed: true, completedAt: new Date().toISOString() }
      : t
  );
}

/**
 * Delete a task from the list. Returns the updated list.
 * @param {Task[]} tasks
 * @param {string} id
 * @returns {Task[]}
 */
export function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

/**
 * Count tasks completed today.
 * @param {Task[]} tasks
 * @returns {number}
 */
export function countCompletedToday(tasks) {
  const today = todayKey();
  return tasks.filter(
    t => t.completed && t.completedAt && t.completedAt.startsWith(today)
  ).length;
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let _tasks = [];

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function _persist() {
  set('tasks', _tasks);
  emit('tasks:updated', countCompletedToday(_tasks));
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#tasks');
  if (!section) return;

  const pending = _tasks.filter(t => !t.completed);
  const completed = _tasks.filter(t => t.completed);

  // Clear existing lists
  let pendingList = section.querySelector('.tasks-pending-list');
  let completedList = section.querySelector('.tasks-completed-list');

  if (pendingList) pendingList.innerHTML = '';
  if (completedList) completedList.innerHTML = '';

  pending.forEach(task => {
    const li = _createTaskItem(task, false);
    pendingList && pendingList.appendChild(li);
  });

  completed.forEach(task => {
    const li = _createTaskItem(task, true);
    completedList && completedList.appendChild(li);
  });
}

function _createTaskItem(task, isCompleted) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  li.className = isCompleted ? 'task-item task-completed' : 'task-item task-pending';

  const span = document.createElement('span');
  span.className = 'task-description';
  span.textContent = task.description;
  li.appendChild(span);

  if (!isCompleted) {
    const completeBtn = document.createElement('button');
    completeBtn.className = 'task-complete-btn';
    completeBtn.textContent = 'Complete';
    completeBtn.addEventListener('click', () => _handleComplete(task.id));
    li.appendChild(completeBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => _handleDelete(task.id));
  li.appendChild(deleteBtn);

  return li;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function _handleComplete(id) {
  _tasks = completeTask(_tasks, id);
  _persist();
  _render();
}

function _handleDelete(id) {
  _tasks = deleteTask(_tasks, id);
  _persist();
  _render();
}

function _handleAddTask(e) {
  e.preventDefault();
  const section = document.querySelector('#tasks');
  if (!section) return;

  const input = section.querySelector('.task-input');
  const errorEl = section.querySelector('.task-error');
  const description = input ? input.value : '';

  const { tasks: updated, added } = addTask(_tasks, description);

  if (!added) {
    if (errorEl) errorEl.textContent = 'Task description cannot be empty.';
    return;
  }

  if (errorEl) errorEl.textContent = '';
  if (input) input.value = '';

  _tasks = updated;
  _persist();
  _render();
}

// ---------------------------------------------------------------------------
// Module API
// ---------------------------------------------------------------------------

/**
 * Initialise the tasks module: load from storage, render, wire up form.
 */
export function init() {
  _tasks = get('tasks', []);

  const section = document.querySelector('#tasks');
  if (!section) return;

  // Ensure required DOM structure exists
  if (!section.querySelector('.tasks-pending-list')) {
    const h3 = document.createElement('h3');
    h3.textContent = 'Pending';
    section.appendChild(h3);
    const ul = document.createElement('ul');
    ul.className = 'tasks-pending-list';
    section.appendChild(ul);
  }

  if (!section.querySelector('.tasks-completed-list')) {
    const h3 = document.createElement('h3');
    h3.textContent = 'Completed';
    section.appendChild(h3);
    const ul = document.createElement('ul');
    ul.className = 'tasks-completed-list';
    section.appendChild(ul);
  }

  // Wire up the add-task form
  const form = section.querySelector('.task-form');
  if (form) {
    form.addEventListener('submit', _handleAddTask);
  }

  // Clear error on input
  const input = section.querySelector('.task-input');
  const errorEl = section.querySelector('.task-error');
  if (input && errorEl) {
    input.addEventListener('input', () => { errorEl.textContent = ''; });
  }

  _render();
}

/**
 * Reset today's completed tasks (called on new-day detection).
 */
export function reset() {
  const today = todayKey();
  _tasks = _tasks.map(t => {
    if (t.completed && t.completedAt && t.completedAt.startsWith(today)) {
      return { ...t, completed: false, completedAt: null };
    }
    return t;
  });
  _persist();
  _render();
}
