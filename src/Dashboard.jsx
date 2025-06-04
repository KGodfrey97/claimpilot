import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useNavigate, Link } from "react-router-dom"
import toast from "react-hot-toast"

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        navigate("/auth")
        return
      }

      setUserId(user.id)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(profileData)

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

  const letterQuotaReached =
    profile.appeal_quota !== null &&
    appeals.filter((a) => a.status === "generated").length >= profile.appeal_quota

  const handleGenerateLetter = async (appealId, payer, denialCode) => {
    if (letterQuotaReached) {
      toast.error("You've used your letter quota. Please upgrade your plan.")
      return
    }

    const toastId = toast.loading("Generating letter...")
    try {
      const response = await fetch("http://localhost:3001/api/generate-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ appealId, payer, denialCode, userId }),
        credentials: "omit",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate letter")
      }

      toast.success("Letter generated successfully!", { id: toastId })

      const { data: updatedAppeals } = await supabase
        .from("appeals")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })

      setAppeals(updatedAppeals || [])
    } catch (err) {
      toast.error("Error: " + err.message, { id: toastId })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">
          Welcome, {profile.name} 👋
        </h1>
        <p className="text-gray-700 mb-1">
          Plan: <span className="font-semibold capitalize">{profile.plan}</span> | Trial: {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
        </p>
        <p className="text-gray-700 mb-4">
          Appeals used: <span className="font-semibold">{appeals.filter(a => a.status === "generated").length}</span> / {profile.appeal_quota ?? "∞"}
        </p>
        <Link to={letterQuotaReached ? "#" : "/new-appeal"}>
          <button
            className={`px-4 py-2 rounded font-semibold text-white "bg-blue-600 hover:bg-blue-700"}`}
            //disabled={letterQuotaReached}
          >
            + New Appeal
          </button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
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
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{appeal.payer}</td>
                  <td className="py-2">{appeal.denial_code}</td>
                  <td className="py-2 capitalize">{appeal.status}</td>
                  <td className="py-2">{new Date(appeal.created_at).toLocaleDateString()}</td>
                  <td className="py-2 flex flex-wrap gap-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                      onClick={() => handleGenerateLetter(appeal.id, appeal.payer, appeal.denial_code)}
                      //disabled={letterQuotaReached}
                    >
                      Generate Letter
                    </button>
                    <Link to={`/appeal/${appeal.id}`}>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded">
                        View Letter
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {letterQuotaReached && (
          <p className="mt-4 text-sm text-red-600">
            You’ve used your letter quota. Please upgrade your plan to generate more appeals.
          </p>
        )}
      </div>
    </div>
  )
}
