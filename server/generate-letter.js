import express from "express"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Only safe in server-side code
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post("/", async (req, res) => {
  const { appealId, payer, denialCode, userId } = req.body

  if (!appealId || !payer || !denialCode || !userId) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    console.log("Request received:", req.body)
    const prompt = `
You are a medical billing specialist. Please generate a professional, factual insurance denial appeal letter for the following:

Payer: ${payer}
Denial Code: ${denialCode}

The appeal should be polite, compliant, and formatted in clear paragraphs.
`

    // const completion = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7,
    //   max_tokens: 500,
    // })

    // const letter = completion.choices[0]?.message?.content?.trim()

    const letter = `Dear Insurance Reviewer,

    We are writing to appeal the recent denial for services submitted under denial code ${denialCode} to ${payer}. We believe this claim was wrongly denied and respectfully request a reconsideration.

    Sincerely,  
    Your Clinic Billing Team
    `
    console.log("Letter generation complete")
    if (!letter) {
      return res.status(500).json({ error: "No letter was generated" })
    }

    // Optional: Confirm that appeal belongs to the user
    const { data: appealCheck, error: fetchError } = await supabase
      .from("appeals")
      .select("id, user_id")
      .eq("id", appealId)
      .single()

    if (fetchError || !appealCheck || appealCheck.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized access to appeal" })
    }

    const { error: updateError } = await supabase
      .from("appeals")
      .update({ letter_text: letter, status: "generated" })
      .eq("id", appealId)

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({ message: "Letter saved", letter })
  } catch (err) {
    console.error("GPT error:", err)
    return res.status(500).json({ error: "Failed to generate letter" })
  }
})

export default router
