import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = Number(process.env.PORT || 3001)

const parseEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}

  const raw = fs.readFileSync(envPath, 'utf8')
  const env = {}

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, value] = match
    env[key] = value.trim().replace(/^['"]|['"]$/g, '')
  }

  return env
}

const env = parseEnv()
const getEnvValue = (key) => process.env[key] || env[key] || ''

const cleanText = (input) =>
  String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const fallbackRewrite = (sourceText, sport) => {
  const base = cleanText(sourceText)
  const firstSentence = base.split(/(?<=[.!?])\s+/)[0] || base.slice(0, 180)
  const oneLine = firstSentence.length > 150 ? `${firstSentence.slice(0, 147).trim()}...` : firstSentence

  const rewrittenTitle = oneLine
    .replace(/The /gi, 'This ')
    .replace(/\bteams\b/gi, 'clubs')
    .replace(/\bplayers\b/gi, 'athletes')
    .replace(/\bgame\b/gi, 'matchup')
    .replace(/\bmatchup\b/gi, 'showdown')
    .replace(/\bcoach\b/gi, 'manager')
    .replace(/\bstrategy\b/gi, 'game plan')
    .replace(/\s+/g, ' ')
    .trim()

  const summary = `${sport} is moving through a fresh set of factors as ${rewrittenTitle.toLowerCase()}. The story is less about a single headline and more about how the latest matchup trends, line movement, and availability notes are changing the value picture.`

  return {
    title: rewrittenTitle.length > 82 ? `${rewrittenTitle.slice(0, 80).trim()}…` : rewrittenTitle,
    summary,
    content: [
      `${rewrittenTitle}. The latest developments paint a more complete picture of why the market is shifting, especially when recovery, rotation, and late-game execution are changing the expected tempo.`,
      `The broader takeaway is that the edge is being created by context rather than a single stat. Efficiency, health, and matchup leverage continue to matter more than raw popularity or headline numbers.`,
      `For bettors and followers of the game, the actionable insight is simple: watch the adjustments, not just the final score. That is where the smartest reads are being formed before the public fully catches up.`,
    ],
  }
}

const parseJsonResponse = (rawText) => {
  if (!rawText) return null

  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{.*\}/s)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
  }

  return null
}

const createOpenAiRequest = ({ sourceText, sport, apiKey, model, useAzure = false, azureEndpoint, azureDeployment }) => {
  const systemMessage = 'You rewrite sports news into original, concise, readable copy without copying the source text.'
  const prompt = `You are a sports columnist rewriting an article for a betting/news site. Create an original, readable summary in US English for ${sport}. Preserve the factual meaning but do not copy the original wording. Return valid JSON with keys: title, summary, content as array of 2 strings.`

  if (useAzure && azureEndpoint && azureDeployment) {
    return {
      url: `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-02-01`,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `${prompt}\n\nSource article:\n${cleanText(sourceText)}` },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    }
  }

  return {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `${prompt}\n\nSource article:\n${cleanText(sourceText)}` },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  }
}

const rewriteWithAi = async (sourceText, sport) => {
  const azureEndpoint = getEnvValue('AZURE_OPENAI_ENDPOINT')
  const azureDeployment = getEnvValue('AZURE_OPENAI_DEPLOYMENT')
  const azureKey = getEnvValue('AZURE_OPENAI_API_KEY')
  const openAiKey = getEnvValue('OPENAI_API_KEY')
  const model = getEnvValue('OPENAI_MODEL') || 'gpt-4o-mini'

  const useAzure = Boolean(azureEndpoint && azureDeployment && azureKey)
  const apiKey = useAzure ? azureKey : openAiKey

  if (!apiKey && !(azureEndpoint && azureDeployment)) {
    return fallbackRewrite(sourceText, sport)
  }

  const request = createOpenAiRequest({
    sourceText,
    sport,
    apiKey,
    model,
    useAzure,
    azureEndpoint,
    azureDeployment,
  })

  const response = await fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  })

  if (!response.ok) {
    throw new Error('AI rewrite failed')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const parsed = parseJsonResponse(content)

  if (!parsed) {
    return fallbackRewrite(sourceText, sport)
  }

  return {
    title: cleanText(parsed.title || ''),
    summary: cleanText(parsed.summary || ''),
    content: Array.isArray(parsed.content)
      ? parsed.content.map((entry) => cleanText(entry)).filter(Boolean)
      : [cleanText(parsed.summary || '')],
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true, port: PORT }))
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rewrite') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}')
        const rewritten = await rewriteWithAi(payload.sourceText || '', payload.sport || 'NBA')
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(rewritten))
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(fallbackRewrite('', 'NBA')))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: false, message: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`AllSport proxy listening on http://localhost:${PORT}`)
})
