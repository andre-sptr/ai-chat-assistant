import { executeTool } from '@/lib/tools/tools'

export const maxDuration = 30;

const SUMOPOD_API_URL = 'https://ai.sumopod.com/v1/chat/completions'

const SYSTEM_PROMPT = `
PERAN & IDENTITAS:
Kamu adalah "Reka", Asisten Coding AI Senior yang ahli dalam:
- Html
- Python
- C/C++
- PHP
- TypeScript
- Tailwind CSS

GAYA KOMUNIKASI:
- Profesional, to-the-point, namun ramah.
- Fokus pada solusi kode yang bersih (clean code) dan modern.
- Jangan bertele-tele.

⚠️ ATURAN KRUSIAL PENGGUNAAN TOOLS (WAJIB PATUH) ⚠️:

1. **JANGAN MENEBAK** data real-time, hitungan, atau konten web. WAJIB GUNAKAN TOOL.
2. **FORMAT JSON:** Outputkan JSON di baris pertama.
3. **HASIL TOOL ADALAH FAKTA MUTLAK.** Jangan ubah angka/hasil dari tool.
4. **INTERNET AKSES:**
  - Jika user bertanya tentang BERITA TERKINI, HARGA PASAR, ACARA HARI INI, atau fakta yang mungkin berubah setelah 2023 -> **WAJIB GUNAKAN TOOL search_web**.
  - Jangan menjawab "Saya tidak tahu" atau "Data saya hanya sampai 2023" tanpa mencoba mencari dulu.

DAFTAR TOOLS (FORMAT JSON):

1. **Calculator**: {"tool": "calculator", "expression": "25 * 4"}
2. **Time**: {"tool": "get_current_time", "timezone": "Asia/Jakarta"}
3. **Todo**: {"tool": "generate_todo_list", "project_description": "..."}
4. **Definisi**: {"tool": "search_definition", "term": "react"}-
5. **Cuaca**: {"tool": "get_weather", "city": "Bandung"}
6. **Kurs**: {"tool": "convert_currency", "amount": 100, "from": "USD", "to": "IDR"}
7. **Unit**: {"tool": "convert_unit", "value": 10, "from": "cm", "to": "inch"} (Support: cm, inch, kg, lbs, c, f)
8. **Scraper**: {"tool": "scrape_website", "url": "https://example.com"}
9. **Analisis Data**: {"tool": "analyze_data", "data": "...", "format": "json"} (Format data harus raw string)
10. **Warna**: {"tool": "generate_colors", "count": 5}
11. **Cek Email**: {"tool": "validate_email", "email": "test@example.com"}
12. **Password**: {"tool": "generate_password", "length": 16, "use_symbols": true}
13. **Internet Search**: {"tool": "search_web", "query": "Harga emas hari ini Antam"}

CONTOH INTERAKSI YANG BENAR (TIU):
User: "Jam berapa di London?"
You: {"tool": "get_current_time", "timezone": "Europe/London"}

(System memberikan hasil tool...)

User: "Hitung 50 pangkat 2"
You: {"tool": "calculator", "expression": "50^2"}

User: "Apa itu Python?"
You: {"tool": "search_definition", "term": "python", "language": "id"}

User: "Buatkan password aman 12 karakter"
You: {"tool": "generate_password", "length": 12, "use_symbols": true}

User: "Berapa 100 USD ke IDR?"
You: {"tool": "convert_currency", "amount": 100, "from": "USD", "to": "IDR"}

User: "Apa isi web google.com?"
You: {"tool": "scrape_website", "url": "https://google.com"}

User: "Siapa pemenang Oscar 2025?"
You: {"tool": "search_web", "query": "Oscar 2025 winners list"}

PANDUAN KODE:
- Gunakan Tailwind CSS v4 untuk styling.
- Gunakan lucide-react untuk ikon.
- Tulis kode dalam blok \`\`\`tsx atau \`\`\`typescript.
- **DIAGRAM & VISUALISASI (MERMAID):**
  - Gunakan blok kode: \`\`\`mermaid
  - **ATURAN WAJIB SYNTAX:**
    1. **SELALU GUNAKAN TANDA KUTIP** untuk label node. 
       - ❌ Salah: A[Mulai (Start)]
       - ✅ Benar: A["Mulai (Start)"]
    2. Hindari simbol aneh di dalam ID node (gunakan A, B, C, atau Node1, Node2).
  - Contoh Flowchart:
    \`\`\`mermaid
    graph TD
      A["Mulai"] --> B{"Login Sukses?"}
      B -- "Ya" --> C["Dashboard User"]
      B -- "Tidak" --> D["Tampilkan Pesan Error"]
    \`\`\`
  - Contoh Sequence:
    \`\`\`mermaid
    sequenceDiagram
      participant U as "User"
      participant S as "System"
      U->>S: "Request Login"
      S-->>U: "Token Valid"
    \`\`\`

INSTRUKSI:
Fokus pada request terakhir user. Jika user minta sesuatu yang bisa diselesaikan dengan tool di atas, LANGSUNG panggil toolnya. Gunakan tool dengan bijak. Prioritaskan data real-time dari search_web untuk pertanyaan non-coding yang butuh fakta aktual.
`;

const SYSTEM_PROMPT_NO_TOOLS = `
Kamu adalah "Reka", Asisten Coding AI Senior.
Spesialisasi: Html, Python, C/C++, PHP, TypeScript, Tailwind CSS.

Tugasmu membantu user menulis kode. Berikan jawaban yang ringkas, tepat, dan menggunakan praktik terbaik (best practices).
`;

interface SumopodMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function parseToolCalls(text: string): { toolCalls: any[], cleanText: string } {
  const toolCalls: any[] = []
  let cleanText = text

  const jsonRegex = /\{"tool":\s*"([^"]+)"[^}]*\}/g
  let match

  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[0]
      const toolCall = JSON.parse(jsonStr)

      if (toolCall.tool) {
        toolCalls.push({
          id: `tool_${Date.now()}_${toolCalls.length}`,
          name: toolCall.tool,
          arguments: { ...toolCall }
        })

        cleanText = cleanText.replace(jsonStr, '').trim()
      }
    } catch (e) {
      console.error("Error parsing tool JSON:", e)
    }
  }

  return { toolCalls, cleanText }
}

async function callSumopodAPI(
  model: string,
  messages: SumopodMessage[],
  stream: boolean = false,
  maxTokens: number = 4096,
  temperature: number = 0.7
): Promise<Response> {
  const response = await fetch(SUMOPOD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUMOPOD_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }),
  })

  return response
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUMOPOD_API_KEY) {
      console.error("❌ ERROR: SUMOPOD_API_KEY belum dipasang di .env.local");
      return new Response("API Key not found", { status: 500 });
    }

    const { messages, model, useTools } = await req.json();
    const selectedModel = model || 'gemini/gemini-2.5-flash';

    // Format messages for Sumopod API (OpenAI-compatible format)
    const formattedMessages: SumopodMessage[] = messages.map((m: any) => {
      if (m.role === 'user' && m.imageUrl) {
        // For image messages, include image description in text
        return {
          role: 'user',
          content: `[User mengirim gambar]\n${m.content}`,
        }
      }

      if (m.role === 'tool') {
        return {
          role: 'user',
          content: `[Tool Result for ${m.toolName || 'unknown'}]: ${JSON.stringify(m.result)}`
        }
      }

      return { role: m.role, content: m.content }
    })

    if (useTools && formattedMessages.length > 0) {
      const lastMsgIndex = formattedMessages.length - 1
      const lastMsg = formattedMessages[lastMsgIndex]

      if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n(SYSTEM NOTE: Jika pertanyaan ini butuh data realtime/hitungan, JANGAN MENJAWAB LANGSUNG. Gunakan JSON tool yang sesuai terlebih dahulu.)`
      }
    }

    // ============= TOOLS MODE =============
    if (useTools) {
      try {
        const systemMessages: SumopodMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...formattedMessages
        ]

        const response = await callSumopodAPI(selectedModel, systemMessages, false)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Sumopod API Error:', errorText)
          return new Response(JSON.stringify({
            text: `Error dari API: ${errorText}`,
            error: errorText
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: response.status
          })
        }

        const data = await response.json()
        const responseText = data.choices?.[0]?.message?.content || ''
        const { toolCalls, cleanText } = parseToolCalls(responseText)

        if (toolCalls.length > 0) {
          const toolResults = await Promise.all(
            toolCalls.map(async (tc: any) => {
              const { tool, ...args } = tc.arguments
              const result = await executeTool(tc.name, args)
              return {
                toolCallId: tc.id,
                toolName: tc.name,
                result
              }
            })
          )

          const newHistory: SumopodMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...formattedMessages,
            {
              role: 'assistant',
              content: responseText
            },
            {
              role: 'user',
              content: toolResults.map(tr =>
                `[Tool Result for ${tr.toolName}]: ${JSON.stringify(tr.result)}`
              ).join('\n\n')
            }
          ];

          const secondResponse = await callSumopodAPI(selectedModel, newHistory, false)

          if (!secondResponse.ok) {
            const errorText = await secondResponse.text()
            console.error('Sumopod API Error (second call):', errorText)
            return new Response(JSON.stringify({
              text: `Error dari API: ${errorText}`,
              toolCalls,
              toolResults
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: secondResponse.status
            })
          }

          const secondData = await secondResponse.json()
          const secondText = secondData.choices?.[0]?.message?.content || ''

          return new Response(JSON.stringify({
            text: secondText,
            toolCalls,
            toolResults
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({
          text: responseText
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Tools error:', error)
        return new Response(JSON.stringify({
          text: 'Maaf, terjadi kesalahan saat menggunakan tools. Silakan coba lagi atau matikan tools.',
          error: String(error)
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        })
      }
    }

    // ============= STREAMING MODE (No Tools) =============
    const systemMessages: SumopodMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_NO_TOOLS },
      ...formattedMessages
    ]

    const response = await callSumopodAPI(selectedModel, systemMessages, true)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sumopod API Error:', errorText)
      return new Response(JSON.stringify({ error: errorText }), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status
      })
    }

    // Transform SSE stream to plain text stream for frontend compatibility
    const reader = response.body?.getReader()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    return new Response(JSON.stringify({ error: "Gagal memproses pesan" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}