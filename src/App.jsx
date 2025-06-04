import { useEffect, useState } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { supabase } from "./supabase"
import Auth from "./Auth"
import Dashboard from "./Dashboard"
import NewAppeal from "./NewAppeal"
import LetterViewer from "./LetterViewer"
import AdminPanel from "./AdminPanel"

export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/new-appeal" element={session ? <NewAppeal /> : <Navigate to="/auth" />} />
      <Route path="/appeal/:id" element={<LetterViewer />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to={session ? "/dashboard" : "/auth"} />} />
    </Routes>
  )
}
