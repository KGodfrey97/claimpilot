import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Dashboard from './Dashboard'
import NewAppeal from "./NewAppeal"

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/new-appeal" element={session ? <NewAppeal /> : <Navigate to="/auth" />} /> {/* Add this route */}
    </Routes>
  )
}

export default App
