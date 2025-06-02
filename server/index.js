import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import generateLetter from "./generate-letter.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())

app.use("/api/generate-letter", generateLetter)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
