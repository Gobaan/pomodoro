import express from 'express'
import nodemailer from 'nodemailer'

const PORT = process.env.PORT ?? 3001
const TO   = 'hi+pomodoro@gobaaan.com'

const app = express()
app.use(express.json())

// Use the system sendmail binary — works on any Linode with postfix/sendmail installed.
// No SMTP credentials needed.
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
})

app.post('/pomodoro/api/feedback', async (req, res) => {
  const { message } = req.body ?? {}
  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  try {
    await transporter.sendMail({
      from: 'pomodoro-app@gobaan.com',
      to:   TO,
      subject: 'Pomodoro app feedback',
      text: message.trim(),
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Mail error:', err)
    res.status(500).json({ error: 'Failed to send' })
  }
})

app.listen(PORT, () => console.log(`Feedback server listening on :${PORT}`))
