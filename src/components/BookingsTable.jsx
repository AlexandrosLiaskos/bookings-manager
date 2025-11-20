import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'

export default function BookingsTable() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('DATE', { ascending: true })

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

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(bookings)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')

    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `bookings_${date}.xlsx`)
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

  const openEditSidebar = (booking) => {
    setEditingRow(booking)
    setEditValues({ ...booking })
  }

  const closeSidebar = () => {
    setEditingRow(null)
    setEditValues({})
  }

  const handleFieldChange = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }

  const saveChanges = async () => {
    if (!editingRow) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('bookings')
        .update(editValues)
        .eq('id', editingRow.id)

      if (error) throw error

      setBookings(bookings.map(b =>
        b.id === editingRow.id ? editValues : b
      ))
      closeSidebar()
    } catch (err) {
      alert('Error updating: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading bookings...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (bookings.length === 0) return <div className="empty">No bookings found.</div>

  const allHeaders = bookings.length > 0 ? Object.keys(bookings[0]) : []
  const headers = allHeaders.filter(h => h !== 'id' && h !== 'created_at')

  // Always sort by DATE (oldest to newest)
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.DATE)
    const dateB = new Date(b.DATE)
    return dateA - dateB
  })

  return (
    <>
      <div className="table-container">
        <div className="table-header">
          <h2>Bookings ({bookings.length})</h2>
          <div className="header-actions">
            <button onClick={exportToExcel} className="export-button">📊 Export Excel</button>
            <button onClick={fetchBookings} className="refresh-button">↻ Refresh</button>
          </div>
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
              {sortedBookings.map((booking, index) => (
                <tr key={booking.id} onClick={() => openEditSidebar(booking)} className="table-row">
                  <td className="row-number">{index + 1}</td>
                  {headers.map(header => (
                    <td key={`${booking.id}-${header}`} className="table-cell">
                      <span className="cell-value">{String(booking[header] || '')}</span>
                    </td>
                  ))}
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {editingRow && (
        <>
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
          <div className="edit-sidebar">
            <div className="sidebar-header">
              <h3>Edit Row</h3>
              <button onClick={closeSidebar} className="close-btn">✕</button>
            </div>
            <div className="sidebar-content">
              {allHeaders.map(header => (
                <div key={header} className="field-group">
                  <label className="field-label">{header}</label>
                  {header === 'id' || header === 'created_at' ? (
                    <input
                      type="text"
                      value={editValues[header] || ''}
                      disabled
                      className="field-input disabled"
                    />
                  ) : (
                    <textarea
                      value={editValues[header] || ''}
                      onChange={(e) => handleFieldChange(header, e.target.value)}
                      className="field-input"
                      rows="2"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="sidebar-footer">
              <button onClick={closeSidebar} className="cancel-button">Cancel</button>
              <button onClick={saveChanges} className="save-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
