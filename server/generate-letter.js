import express from "express"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post("/", async (req, res) => {
  const { appealId, payer, denialCode } = req.body

  if (!appealId || !payer || !denialCode) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    const prompt = `
You are a medical billing specialist. Please generate a professional, factual insurance denial appeal letter for the following:

Payer: ${payer}
Denial Code: ${denialCode}

The appeal should be polite, compliant, and formatted in clear paragraphs.
`

    /*const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const letter = completion.choices[0]?.message?.content?.trim()
    */
    //Temporary letter until paying for ChatGPT API
    const letter = `Dear Insurance Reviewer,

      We are writing to appeal the recent denial for services submitted under denial code ${denialCode} to ${payer}. We believe this claim was wrongly denied and respectfully request a reconsideration.

      Sincerely,  
      Your Clinic Billing Team
      `

    if (!letter) {
      console.error("No letter returned from OpenAI:", completion)
      return res.status(500).json({ error: "No letter was generated" })
    }


    const { error } = await supabase
      .from("appeals")
      .update({ letter_text: letter, status: "generated" })
      .eq("id", appealId)

    if (error) {
      throw error
    }

    return res.status(200).json({ message: "Letter saved", letter })
  } catch (err) {
    console.error("GPT error:", err.message)
    return res.status(500).json({ error: "Failed to generate letter" })
  }
})

export default router
