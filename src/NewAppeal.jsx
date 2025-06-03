import { useState } from "react"
import { supabase } from "./supabase"
import { useNavigate } from "react-router-dom"

export default function NewAppeal() {
  const [payer, setPayer] = useState("")
  const [denialCode, setDenialCode] = useState("")
  const [letterText, setLetterText] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setMessage("You must be logged in to submit an appeal.")
      setSubmitting(false)
      return
    }

    const userId = user.id

    // Fetch profile to check quota
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("appeal_quota")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      setMessage("Unable to retrieve profile.")
      setSubmitting(false)
      return
    }

    const { data: appeals, error: appealsError } = await supabase
      .from("appeals")
      .select("id")
      .eq("user_id", userId)

    if (appealsError) {
      setMessage("Unable to check existing appeals.")
      setSubmitting(false)
      return
    }

    if (appeals.length >= profile.appeal_quota) {
      setMessage("You have reached your appeal quota.")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("appeals").insert({
      user_id: userId,
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
