;(function () {
  const chatList = document.getElementById("chatList")
  const form = document.getElementById("chatForm")
  const input = document.getElementById("prompt")
  const sendBtn = document.getElementById("sendBtn")
  const memoryToggle = document.getElementById("memoryToggle")
  const saveBtn = document.getElementById("saveBtn")
  const suggestions = document.getElementById("suggestions")
  const toaster = document.getElementById("toaster")

  let messages = [
    {
      role: "assistant",
      content: "Halo! Aku OTO AI. Ada yang bisa kubantu hari ini?",
      timestamp: Date.now(),
    },
  ]
  let isTyping = false

  renderAll()
  autoResize()

  // Auto-resize textarea
  function autoResize() {
    input.style.height = "0px"
    input.style.height = Math.min(input.scrollHeight, 200) + "px"
  }
  input.addEventListener("input", autoResize)

  // Suggestions fill input
  suggestions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-suggest]")
    if (!btn) return
    input.value = btn.dataset.suggest || ""
    autoResize()
    input.focus()
  })

  // Enter to send, Shift+Enter for newline
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      form.requestSubmit()
    }
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text || isTyping) return

    appendMessage("user", text)
    input.value = ""
    autoResize()

    setTyping(true)
    sendBtn.disabled = true

    try {
      // Kirim prompt + memory (opsional)
      const payload = {
        prompt: text,
        memory: memoryToggle.checked
          ? messages.map((m) => ({
              role: m.role, // "user" | "assistant"
              content: m.content,
            }))
          : null,
      }

      const res = await fetch("/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        throw new Error(errText || "Gagal mengambil respons")
      }

      const data = await res.json()
      const output = data.output || "Maaf, aku tidak bisa memproses permintaan."
      appendMessage("assistant", output)
    } catch (err) {
      console.error(err)
      appendMessage("assistant", "Maaf, terjadi kesalahan saat memproses permintaanmu.")
    } finally {
      setTyping(false)
      sendBtn.disabled = false
    }
  })

  saveBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("savedConversations") || "[]")
    saved.push({ date: new Date().toISOString(), messages })
    localStorage.setItem("savedConversations", JSON.stringify(saved))
    toast("Percakapan disimpan (lokal).")
  })

  function setTyping(state) {
    isTyping = state
    renderTyping()
    scrollToBottom()
  }

  function appendMessage(role, content) {
    const msg = { role, content, timestamp: Date.now() }
    messages.push(msg)
    chatList.appendChild(renderMessage(msg))
    scrollToBottom()
  }

  function renderAll() {
    chatList.innerHTML = ""
    messages.forEach((m) => chatList.appendChild(renderMessage(m)))
    renderTyping()
    scrollToBottom()
  }

  function renderMessage(m) {
    const row = document.createElement("div")
    row.className = "msg " + (m.role === "user" ? "msg--user" : "msg--ai")

    const avatar = document.createElement("div")
    avatar.className = "msg__avatar"
    avatar.setAttribute("aria-hidden", "true")
    avatar.textContent = m.role === "user" ? "U" : "A"

    const body = document.createElement("div")
    body.className = "msg__body"

    const bubble = document.createElement("div")
    bubble.className = "bubble " + (m.role === "user" ? "bubble--user" : "bubble--ai")
    bubble.textContent = m.content

    const time = document.createElement("div")
    time.className = "timestamp"
    time.textContent = new Date(m.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (m.role === "user") {
      row.appendChild(body)
      row.appendChild(avatar)
    } else {
      row.appendChild(avatar)
      row.appendChild(body)
    }
    body.appendChild(bubble)
    body.appendChild(time)
    return row
  }

  function renderTyping() {
    const existing = document.getElementById("typingRow")
    if (existing) existing.remove()
    if (!isTyping) return

    const row = document.createElement("div")
    row.id = "typingRow"
    row.className = "msg msg--ai"

    const avatar = document.createElement("div")
    avatar.className = "msg__avatar"
    avatar.textContent = "A"

    const body = document.createElement("div")
    body.className = "msg__body"
    const wrap = document.createElement("div")
    wrap.className = "typing"

    const dots = document.createElement("div")
    dots.className = "typing__dots"
    for (let i = 0; i < 3; i++) {
      const d = document.createElement("span")
      d.className = "typing__dot"
      dots.appendChild(d)
    }

    wrap.appendChild(dots)
    body.appendChild(wrap)
    row.appendChild(avatar)
    row.appendChild(body)
    chatList.appendChild(row)
  }

  function scrollToBottom() {
    chatList.scrollTop = chatList.scrollHeight
  }

  function toast(message) {
    const el = document.createElement("div")
    el.className = "toast"
    el.textContent = message
    toaster.appendChild(el)
    setTimeout(() => {
      el.style.opacity = "0"
      el.style.transform = "translateY(6px)"
      setTimeout(() => el.remove(), 250)
    }, 1800)
  }
})()