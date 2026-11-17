import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = '/tasks/'

async function getErrorMessage(response, fallback) {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') {
      return body.detail
    }
    if (Array.isArray(body.detail)) {
      return body.detail.map((error) => error.msg).join(', ')
    }
  } catch {
    return `${fallback} (HTTP ${response.status})`
  }
  return `${fallback} (HTTP ${response.status})`
}

async function request(url, options, fallback) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback))
  }
  return response.json()
}

async function fetchTasks() {
  const taskList = await request(API_URL, undefined, 'Unable to load tasks.')
  if (!Array.isArray(taskList)) {
    throw new Error('The server returned an invalid task list.')
  }
  return taskList
}

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [error, setError] = useState('')

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTasks(await fetchTasks())
    } catch (requestError) {
      setError(requestError.message || 'Unable to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialTasks() {
      try {
        const taskList = await fetchTasks()
        if (!cancelled) {
          setTasks(taskList)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'Unable to load tasks.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialTasks()
    return () => {
      cancelled = true
    }
  }, [])

  async function createTask(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || submitting) {
      if (!trimmedTitle) {
        setError('Task title cannot be empty.')
      }
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const task = await request(
        API_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmedTitle, priority }),
        },
        'Unable to add task.',
      )
      setTasks((currentTasks) => [...currentTasks, task])
      setTitle('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to add task.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateTask(id, changes) {
    setSavingId(id)
    setError('')
    try {
      const updatedTask = await request(
        `${API_URL}${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        },
        'Unable to update task.',
      )
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === id ? updatedTask : task)),
      )
      setEditingId((currentId) => (currentId === id ? null : currentId))
    } catch (requestError) {
      setError(requestError.message || 'Unable to update task.')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteTask(id) {
    setDeletingId(id)
    setError('')
    try {
      await request(`${API_URL}${id}`, { method: 'DELETE' }, 'Unable to delete task.')
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
      setEditingId((currentId) => (currentId === id ? null : currentId))
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete task.')
    } finally {
      setDeletingId(null)
    }
  }

  function saveEdit(id) {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setError('Task title cannot be empty.')
      return
    }
    updateTask(id, { title: trimmedTitle })
  }

  return (
    <main className="container">
      <header className="page-header">
        <p className="eyebrow">TASK MANAGER</p>
        <h1>My Task Manager</h1>
        <p className="subtitle">Organize your day, one task at a time.</p>
      </header>

      <form className="task-form" onSubmit={createTask}>
        <label className="sr-only" htmlFor="new-task-title">Task title</label>
        <input
          id="new-task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a new task..."
          required
        />
        <label className="sr-only" htmlFor="new-task-priority">Task priority</label>
        <select
          id="new-task-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button className="add-btn" type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add task'}
        </button>
      </form>

      {error && (
        <div className="error-message" role="alert">
          <span>{error}</span>
          <button className="retry-btn" type="button" onClick={loadTasks}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="message" role="status">Loading tasks...</p>
      ) : tasks.length === 0 && !error ? (
        <p className="message">No tasks yet. Add your first task!</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const isBusy = savingId === task.id || deletingId === task.id

            return (
              <li className="task-item" key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(event) =>
                    updateTask(task.id, { completed: event.target.checked })
                  }
                  aria-label={`Mark ${task.title} complete`}
                  disabled={isBusy}
                />
                {editingId === task.id ? (
                  <>
                    <label className="sr-only" htmlFor={`edit-task-${task.id}`}>
                      Edit task title
                    </label>
                    <input
                      id={`edit-task-${task.id}`}
                      className="edit-input"
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEdit(task.id)
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() => saveEdit(task.id)}
                      disabled={isBusy}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-btn"
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`task-title${task.completed ? ' completed' : ''}`}>
                      {task.title}
                    </span>
                    <span className={`priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() => {
                        setEditingId(task.id)
                        setEditTitle(task.title)
                        setError('')
                      }}
                      disabled={isBusy}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      disabled={isBusy}
                    >
                      {deletingId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

export default App
