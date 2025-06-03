// src/LetterViewer.jsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "./supabase"

export default function LetterViewer() {
  const { id } = useParams()
  const [appeal, setAppeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAppeal = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate("/auth")
        return
      }

      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching appeal:", error)
        navigate("/dashboard")
        return
      }

      setAppeal(data)
      setLoading(false)
    }

    fetchAppeal()
  }, [id, navigate])

  if (loading) {
    return <div className="p-6 text-gray-600">Loading letter...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow p-6 rounded">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          Appeal Letter for {appeal.payer}
        </h1>
        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200 text-gray-800 mb-6">
          {appeal.letter_text || "No letter found."}
        </pre>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
