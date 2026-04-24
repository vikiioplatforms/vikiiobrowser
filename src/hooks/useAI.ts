import { useBrowser } from '../store/browserStore'
import type { AIMessage } from '../types'

const OPENAI_BASE = 'https://api.openai.com/v1'

export function useAI() {
  const { state, dispatch } = useBrowser()

  const getSystemPrompt = () => {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    const mode = state.settings.mode

    let modeInstructions = ''
    switch (mode) {
      case 'private':
        modeInstructions = 'You are in Private Mode. Do NOT remember any user data. Do NOT reference previous conversations.'
        break
      case 'anonymous':
        modeInstructions = 'You are in Anonymous Mode. Do NOT send any sensitive data to external services. Use only local context.'
        break
      case 'locked':
        modeInstructions = 'You are in Locked Mode. Minimal AI functionality. Do NOT access any external data.'
        break
      case 'work':
        modeInstructions = 'You are in Work Mode. Focus on productivity, organization, and professional tasks.'
        break
      default:
        modeInstructions = 'You are in Normal Mode. Full AI capabilities available.'
    }

    return `You are Vikiio AI, a privacy-first browser assistant built into the Vikiio Browser.
${modeInstructions}
Current page: ${activeTab?.title || 'New Tab'} (${activeTab?.url || 'newtab'})
Open tabs: ${state.tabs.map(t => t.title).join(', ')}
Be helpful, concise, and privacy-aware. Format responses clearly with markdown when appropriate.`
  }

  const chat = async (userMessage: string): Promise<string> => {
    if (!state.settings.aiApiKey) {
      return 'Please add your OpenAI API key in Settings → AI Assistant to enable AI features.'
    }

    if (state.settings.mode === 'locked') {
      return 'AI is disabled in Locked Mode for maximum security.'
    }

    const messages = state.currentConversation?.messages ?? []

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          ...messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `API error ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No response generated.'
  }

  const summarizePage = async (url: string, title: string): Promise<string> => {
    if (!state.settings.aiApiKey) {
      return 'Please add your OpenAI API key in Settings to use page summarization.'
    }

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a browser assistant. Provide a concise 3-5 bullet point summary of what this webpage likely contains based on its URL and title. Be factual and helpful.' },
          { role: 'user', content: `Summarize this page:\nTitle: ${title}\nURL: ${url}` },
        ],
        max_tokens: 300,
      }),
    })

    if (!response.ok) throw new Error('Failed to summarize page')
    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Could not generate summary.'
  }

  const compareTabs = async (): Promise<string> => {
    if (!state.settings.aiApiKey) return 'API key required.'

    const tabs = state.tabs.filter(t => t.url !== 'newtab')
    if (tabs.length < 2) return 'Open at least 2 tabs to compare them.'

    const tabList = tabs.map(t => `- ${t.title} (${t.url})`).join('\n')

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a browser assistant. Compare the following open tabs and identify themes, relationships, and key differences.' },
          { role: 'user', content: `Compare these open tabs:\n${tabList}` },
        ],
        max_tokens: 400,
      }),
    })

    if (!response.ok) throw new Error('Failed to compare tabs')
    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Could not compare tabs.'
  }

  return { chat, summarizePage, compareTabs }
}
