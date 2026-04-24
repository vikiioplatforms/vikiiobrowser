/**
 * useOllamaAI — Local AI via Ollama with OpenAI fallback
 *
 * Priority:
 * 1. Ollama (local, private, free) — http://localhost:11434
 * 2. OpenAI API (cloud fallback if Ollama not running)
 *
 * Ollama API is OpenAI-compatible via /v1/chat/completions endpoint
 * so we use the same request shape for both.
 */

import { useState, useCallback, useEffect } from 'react'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: {
    family: string
    parameter_size: string
    quantization_level: string
  }
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface UseOllamaAIOptions {
  ollamaBaseUrl?: string
  openaiApiKey?: string
  defaultModel?: string
  systemPrompt?: string
}

export interface UseOllamaAIReturn {
  models: OllamaModel[]
  selectedModel: string
  setSelectedModel: (m: string) => void
  ollamaAvailable: boolean
  isLoading: boolean
  error: string | null
  provider: 'ollama' | 'openai' | 'none'
  chat: (messages: AIMessage[], pageContext?: string) => Promise<string>
  checkOllama: () => Promise<boolean>
  pullModel: (modelName: string) => Promise<void>
  pullProgress: number | null
}

const OLLAMA_BASE = 'http://localhost:11434'

const POPULAR_MODELS = [
  { name: 'llama3.2:3b', label: 'Llama 3.2 (3B) — Fast, lightweight' },
  { name: 'llama3.2:1b', label: 'Llama 3.2 (1B) — Ultra fast' },
  { name: 'mistral:7b', label: 'Mistral 7B — Balanced' },
  { name: 'phi3:mini', label: 'Phi-3 Mini — Microsoft, fast' },
  { name: 'gemma2:2b', label: 'Gemma 2 (2B) — Google, small' },
  { name: 'qwen2.5:3b', label: 'Qwen 2.5 (3B) — Alibaba' },
  { name: 'deepseek-r1:7b', label: 'DeepSeek R1 (7B) — Reasoning' },
]

export { POPULAR_MODELS }

export function useOllamaAI(options: UseOllamaAIOptions = {}): UseOllamaAIReturn {
  const {
    ollamaBaseUrl = OLLAMA_BASE,
    openaiApiKey = '',
    defaultModel = 'llama3.2:3b',
    systemPrompt = 'You are Vikiio AI, a helpful browser assistant. Be concise and accurate.',
  } = options

  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState(defaultModel)
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<'ollama' | 'openai' | 'none'>('none')
  const [pullProgress, setPullProgress] = useState<number | null>(null)

  const checkOllama = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      })
      if (!res.ok) return false
      const data = await res.json()
      const modelList: OllamaModel[] = data.models || []
      setModels(modelList)
      setOllamaAvailable(true)
      setProvider('ollama')
      if (modelList.length > 0 && !modelList.find(m => m.name === selectedModel)) {
        setSelectedModel(modelList[0].name)
      }
      return true
    } catch {
      setOllamaAvailable(false)
      setProvider(openaiApiKey ? 'openai' : 'none')
      return false
    }
  }, [ollamaBaseUrl, openaiApiKey, selectedModel])

  useEffect(() => {
    checkOllama()
    // Re-check every 30 seconds
    const interval = setInterval(checkOllama, 30000)
    return () => clearInterval(interval)
  }, [checkOllama])

  const chatWithOllama = async (messages: AIMessage[], pageContext?: string): Promise<string> => {
    const systemMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(pageContext ? [{ role: 'system' as const, content: `Current page context:\n${pageContext.slice(0, 2000)}` }] : []),
    ]

    const res = await fetch(`${ollamaBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: [...systemMessages, ...messages],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        },
      }),
    })

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  const chatWithOpenAI = async (messages: AIMessage[], pageContext?: string): Promise<string> => {
    const systemMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(pageContext ? [{ role: 'system' as const, content: `Current page context:\n${pageContext.slice(0, 3000)}` }] : []),
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [...systemMessages, ...messages],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  const chat = useCallback(async (messages: AIMessage[], pageContext?: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      if (ollamaAvailable) {
        const result = await chatWithOllama(messages, pageContext)
        return result
      } else if (openaiApiKey) {
        const result = await chatWithOpenAI(messages, pageContext)
        return result
      } else {
        throw new Error('No AI provider available. Install Ollama or add an OpenAI API key.')
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [ollamaAvailable, openaiApiKey, selectedModel])

  const pullModel = useCallback(async (modelName: string): Promise<void> => {
    setPullProgress(0)
    try {
      const res = await fetch(`${ollamaBaseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      })

      if (!res.ok) throw new Error(`Pull failed: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.total && data.completed) {
              setPullProgress(Math.round((data.completed / data.total) * 100))
            }
            if (data.status === 'success') {
              setPullProgress(100)
              await checkOllama()
            }
          } catch {
            // ignore parse errors in stream
          }
        }
      }
    } finally {
      setTimeout(() => setPullProgress(null), 2000)
    }
  }, [ollamaBaseUrl, checkOllama])

  return {
    models,
    selectedModel,
    setSelectedModel,
    ollamaAvailable,
    isLoading,
    error,
    provider,
    chat,
    checkOllama,
    pullModel,
    pullProgress,
  }
}
