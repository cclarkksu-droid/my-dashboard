/**
 * Daily digest generator — runs in GitHub Actions at 07:00 GMT.
 * Fetches last-24h emails via Gmail API, then uses Claude to produce
 * src/data/digest.json, which Vite bundles into the static site.
 *
 * Required env vars (stored as GitHub secrets):
 *   ANTHROPIC_API_KEY
 *   GMAIL_CLIENT_ID
 *   GMAIL_CLIENT_SECRET
 *   GMAIL_REFRESH_TOKEN
 */

import Anthropic from '@anthropic-ai/sdk'
import { google } from 'googleapis'
import { writeFileSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIGEST_PATH = join(__dirname, '..', 'src', 'data', 'digest.json')
const MAX_EMAILS = 40

// ─── Gmail ───────────────────────────────────────────────────────────────────

async function fetchEmails() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

  const gmail = google.gmail({ version: 'v1', auth })

  // emails from the last 24 hours
  const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
  const list = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${since} -category:promotions`,
    maxResults: MAX_EMAILS
  })

  const messages = list.data.messages ?? []
  if (messages.length === 0) return []

  const details = await Promise.all(
    messages.map((msg) =>
      gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      })
    )
  )

  return details.map(({ data }) => {
    const h = Object.fromEntries(
      (data.payload?.headers ?? []).map(({ name, value }) => [name, value])
    )
    return {
      subject: h.Subject ?? '(no subject)',
      from: h.From ?? '',
      date: h.Date ?? '',
      snippet: data.snippet ?? ''
    }
  })
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Chris Clark's personal morning briefing assistant based in London.
Given a list of emails from the past 24 hours, produce a structured morning briefing as JSON.

Rules:
- Group related emails into named sections (e.g. Family, School, Golf, Finance, Work, Transport).
- Each section may have zero or more alert banners (for urgent action items) and cards (one per email thread or topic).
- Omit sections, alerts, and cards if there is nothing relevant.
- Card text should be 1-3 concise sentences. Avoid bullet points inside card text.
- Only set "alert" on a card when there is a genuine deadline or required action.
- Choose a single relevant emoji per section.
- Card "tag" must be one of: finance, academic, events, booking, admin, newsletter, work, personal.
- Return ONLY valid JSON — no markdown fences, no commentary.

JSON schema:
{
  "generated_at": "<ISO-8601 UTC timestamp>",
  "sections": [
    {
      "id": "<kebab-case slug>",
      "title": "<Section Title>",
      "emoji": "<single emoji>",
      "subtitle": "<optional comma/bullet list of topics, or empty string>",
      "alerts": [
        {
          "id": "<unique-kebab-id>",
          "icon": "<emoji>",
          "title": "<Alert Title>",
          "items": ["<action item>"]
        }
      ],
      "cards": [
        {
          "id": "<unique-kebab-id>",
          "title": "<Card Title>",
          "tag": "<tag>",
          "date": "<human-readable date string or null>",
          "text": "<summary>",
          "alert": "<urgent note string or null>"
        }
      ]
    }
  ]
}`

async function generateDigest(emails) {
  const client = new Anthropic()

  const emailBlock = emails.length === 0
    ? 'No new emails in the last 24 hours.'
    : emails
        .map((e, i) => `[${i + 1}] From: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nSnippet: ${e.snippet}`)
        .join('\n\n')

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: `Today is ${new Date().toUTCString()}.\n\nEmails:\n\n${emailBlock}`
      }
    ]
  })

  const raw = message.content[0].text.trim()
  return JSON.parse(raw)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching emails…')
  const emails = await fetchEmails()
  console.log(`Found ${emails.length} email(s).`)

  console.log('Generating digest with Claude…')
  const digest = await generateDigest(emails)

  writeFileSync(DIGEST_PATH, JSON.stringify(digest, null, 2))
  console.log(`Wrote digest: ${digest.sections.length} section(s) → ${DIGEST_PATH}`)
}

main().catch((err) => {
  console.error('Digest generation failed:', err)
  process.exit(1)
})
