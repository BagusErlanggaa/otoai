"use strict"

const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: "1mb" }))
app.use(express.static(path.join(__dirname, "public")))

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn("Peringatan: GEMINI_API_KEY tidak ditemukan di .env")
}
const genAI = new GoogleGenerativeAI(apiKey || "")

const generationConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
}

const systemInstruction = {
  role: "user",
  parts: [
    {
      text: `
Kamu adalah OTO AI, asisten AI yang ramah, santai, dan suka ngobrol seru! 😄
- Gunakan emoji dengan natural, jangan dipaksain
- Gaya ngobrolnya harus hangat, kayak temen deket, bukan kayak robot
- Hindari bahasa yang terlalu formal atau kaku
- Tetap bantuin user dengan jelas, tapi sambil tetap asik & fun
`.trim(),
    },
  ],
}

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt, memory } = req.body || {}
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt wajib diisi" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Mapping memory dari client ke format history Gemini
    const history = Array.isArray(memory)
      ? memory
          .filter((m) => m && typeof m.content === "string" && typeof m.role === "string")
          .map((m) => ({
            role: m.role === "user" ? "user" : "model", // "assistant" -> "model"
            parts: [{ text: m.content }],
          }))
      : []

    const chat = model.startChat({
      history,
      generationConfig,
      systemInstruction,
    })

    const result = await chat.sendMessage(prompt)
    const text = (await result.response).text().trim()
    return res.json({ output: text })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || "Terjadi kesalahan" })
  }
})

// Layani file HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`)
})