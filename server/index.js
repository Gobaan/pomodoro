import 'dotenv/config'
import express from 'express'
import nodemailer from 'nodemailer'

const PORT = process.env.PORT     ?? 3001
const TO   = process.env.FEEDBACK_TO  // set in environment — not committed to repo

if (!TO) {
  console.error('FEEDBACK_TO env var is required')
  process.exit(1)
}

const app = express()
app.use(express.json())

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
})

app.post('/flowbeats/api/feedback', async (req, res) => {
  const { message, email } = req.body ?? {}
  if (!message?.trim()) return res.status(400).json({ error: 'message is required' })

  const body = email?.trim()
    ? `From: ${email.trim()}\n\n${message.trim()}`
    : message.trim()

  try {
    await transporter.sendMail({
      from:    'pomodoro-app@gobaan.com',
      to:      TO,
      replyTo: email?.trim() || undefined,
      subject: 'Pomodoro app feedback',
      text:    body,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Mail error:', err)
    res.status(500).json({ error: 'Failed to send' })
  }
})

app.listen(PORT, () => console.log(`Feedback server listening on :${PORT}`))
