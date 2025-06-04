import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import { useNavigate } from "react-router-dom"

export default function NewAppeal() {
  const [payer, setPayer] = useState("")
  const [denialCode, setDenialCode] = useState("")
  const [letterText, setLetterText] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [appeals, setAppeals] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate("/auth")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      const { data: appealData } = await supabase
        .from("appeals")
        .select("*")
        .eq("user_id", user.id)

      setProfile(profileData)
      setAppeals(appealData || [])
    }

    fetchData()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    if (!profile) {
      setMessage("Profile not found.")
      setSubmitting(false)
      return
    }

    const draftQuotaReached =
      profile.appeal_quota !== null &&
      appeals.filter((a) => a.status === "draft").length >= profile.appeal_quota

    if (draftQuotaReached) {
      setMessage("You’ve reached your draft quota.")
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage("You must be logged in to submit an appeal.")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("appeals").insert({
      user_id: user.id,
      payer,
      denial_code: denialCode,
      letter_text: letterText,
      status: "draft",
    })

    if (error) {
      setMessage("Error submitting appeal: " + error.message)
    } else {
      navigate("/dashboard")
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Create New Appeal</h1>

        <label className="block mb-2 text-sm font-medium">Payer</label>
        <input
          type="text"
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          required
          className="border rounded w-full p-2 mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Denial Code</label>
        <input
          type="text"
          value={denialCode}
          onChange={(e) => setDenialCode(e.target.value)}
          required
          className="border rounded w-full p-2 mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Letter Text (optional)</label>
        <textarea
          value={letterText}
          onChange={(e) => setLetterText(e.target.value)}
          className="border rounded w-full p-2 mb-4 h-28"
        />

        {message && <p className="text-red-600 text-sm mb-4">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
        >
          {submitting ? "Submitting..." : "Submit Appeal"}
        </button>
      </form>
    </div>
  )
}
