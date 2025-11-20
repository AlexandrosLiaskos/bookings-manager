import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function BookingsTable() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingCell, setEditingCell] = useState(null) // { rowId, field, originalValue }
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setBookings(data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBookings(bookings.filter(b => b.id !== id))
    } catch (err) {
      alert('Error deleting: ' + err.message)
    }
  }

  const startEditing = (rowId, field, currentValue) => {
    setEditingCell({ rowId, field, originalValue: currentValue })
    setEditValue(currentValue || '')
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const saveEdit = async () => {
    if (!editingCell) return

    try {
      const { rowId, field } = editingCell
      const updatedData = { [field]: editValue }

      const { error } = await supabase
        .from('bookings')
        .update(updatedData)
        .eq('id', rowId)

      if (error) throw error

      setBookings(bookings.map(b =>
        b.id === rowId ? { ...b, [field]: editValue } : b
      ))
      setEditingCell(null)
      setEditValue('')
    } catch (err) {
      alert('Error updating: ' + err.message)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  if (loading) return <div className="loading">Loading bookings...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (bookings.length === 0) return <div className="empty">No bookings found.</div>

  // Get headers and filter out 'id' and 'created_at'
  const allHeaders = bookings.length > 0 ? Object.keys(bookings[0]) : []
  const headers = allHeaders.filter(h => h !== 'id' && h !== 'created_at')

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Bookings ({bookings.length})</h2>
        <button onClick={fetchBookings} className="refresh-button">↻ Refresh</button>
      </div>
      <div className="table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="row-number">#</th>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => (
              <tr key={booking.id}>
                <td className="row-number">{index + 1}</td>
                {headers.map(header => {
                  const isEditing = editingCell?.rowId === booking.id && editingCell?.field === header

                  return (
                    <td
                      key={`${booking.id}-${header}`}
                      className={`excel-cell editable ${isEditing ? 'editing' : ''}`}
                      onClick={() => !isEditing && startEditing(booking.id, header, booking[header])}
                    >
                      {isEditing ? (
                        <div className="edit-container">
                          <div className="diff-preview">
                            <div className="diff-old">
                              <span className="diff-label">Old:</span>
                              <span className="diff-value">{String(editingCell.originalValue || '')}</span>
                            </div>
                            <div className="diff-new">
                              <span className="diff-label">New:</span>
                              <span className="diff-value">{String(editValue || '')}</span>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="excel-input"
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button onClick={saveEdit} className="save-btn" title="Save (Ctrl+Enter)">
                              ✓ Save
                            </button>
                            <button onClick={cancelEditing} className="cancel-btn" title="Cancel (Esc)">
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="cell-value">{String(booking[header] || '')}</span>
                      )}
                    </td>
                  )
                })}
                <td className="actions-cell">
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="delete-btn"
                    title="Delete row"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingCell && (
        <div className="edit-hint">
          Press <kbd>Ctrl+Enter</kbd> to save • <kbd>Esc</kbd> to cancel • Or use the buttons
        </div>
      )}
    </div>
  )
}
