import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate("/auth")
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(profileData)

      // Fetch appeals
      const { data: appealData } = await supabase
        .from("appeals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setAppeals(appealData || [])
      setLoading(false)
    }

    fetchData()
  }, [navigate])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(profile.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)
  )

    const handleGenerateLetter = async (appealId, payer, denialCode) => {
        try {
            const response = await fetch("http://localhost:3001/api/generate-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ appealId, payer, denialCode }),
            })

            const data = await response.json()

            if (!response.ok) {
            throw new Error(data.error || "Failed to generate letter")
            }

            // Optional: reload appeals or show success
            alert("Letter generated successfully!")
            window.location.reload()
        } catch (err) {
            alert("Error: " + err.message)
        }
    }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6 mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">
          Welcome, {profile.name} 👋
        </h1>
        <p className="text-gray-700 mb-4">
          Plan: <span className="font-semibold capitalize">{profile.plan}</span> | Trial: {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
        </p>
        <Link to="/new-appeal">
            <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
            + New Appeal
            </button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Your Appeals</h2>
        {appeals.length === 0 ? (
          <p className="text-gray-500">No appeals yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="pb-2">Payer</th>
                <th className="pb-2">Denial Code</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody>
                {appeals.map((appeal) => (
                    <tr key={appeal.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{appeal.payer}</td>
                    <td className="py-2">{appeal.denial_code}</td>
                    <td className="py-2 capitalize">{appeal.status}</td>
                    <td className="py-2">{new Date(appeal.created_at).toLocaleDateString()}</td>
                    <td className="py-2">
                        <button
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                        onClick={() => handleGenerateLetter(appeal.id, appeal.payer, appeal.denial_code)}
                        >
                        Generate Letter
                        </button>
                    </td>
                    </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
