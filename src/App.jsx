import { useState, useEffect } from 'react'
import Login from './components/Login'
import BookingsTable from './components/BookingsTable'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    localStorage.setItem('isAuthenticated', 'true')
  }

  return (
    <div className="app-fullscreen">
      {isAuthenticated ? <BookingsTable /> : <Login onLogin={handleLogin} />}
    </div>
  )
}

export default App
