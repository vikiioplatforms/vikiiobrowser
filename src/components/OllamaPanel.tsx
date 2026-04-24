import { useState } from 'react'
import { useOllamaAI, POPULAR_MODELS } from '../hooks/useOllamaAI'
import { useBrowser } from '../store/browserStore'
import styles from './OllamaPanel.module.css'

export function OllamaPanel() {
  const { state, dispatch } = useBrowser()
  const {
    models,
    selectedModel,
    setSelectedModel,
    ollamaAvailable,
    provider,
    checkOllama,
    pullModel,
    pullProgress,
    isLoading,
    error,
  } = useOllamaAI({
    openaiApiKey: state.settings.aiApiKey,
  })

  const [testPrompt, setTestPrompt] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testing, setTesting] = useState(false)
  const [pullingModel, setPullingModel] = useState<string | null>(null)
  const [customModel, setCustomModel] = useState('')

  const { chat } = useOllamaAI({
    openaiApiKey: state.settings.aiApiKey,
  })

  const handleTest = async () => {
    if (!testPrompt.trim()) return
    setTesting(true)
    setTestResponse('')
    try {
      const res = await chat([{ role: 'user', content: testPrompt }])
      setTestResponse(res)
    } catch (e: any) {
      setTestResponse(`Error: ${e.message}`)
    } finally {
      setTesting(false)
    }
  }

  const handlePull = async (modelName: string) => {
    setPullingModel(modelName)
    try {
      await pullModel(modelName)
    } finally {
      setPullingModel(null)
    }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`
  }

  return (
    <div className={styles.panel}>
      {/* Provider Status */}
      <div className={`${styles.statusCard} ${ollamaAvailable ? styles.statusOllama : styles.statusCloud}`}>
        <div className={styles.statusLeft}>
          <div className={styles.statusDot} />
          <div>
            <div className={styles.statusTitle}>
              {ollamaAvailable ? '🏠 Local AI (Ollama)' : provider === 'openai' ? '☁️ Cloud AI (OpenAI)' : '⚠️ No AI Provider'}
            </div>
            <div className={styles.statusSub}>
              {ollamaAvailable
                ? `${models.length} model${models.length !== 1 ? 's' : ''} available · 100% private`
                : provider === 'openai'
                  ? 'Using OpenAI API · Data sent to cloud'
                  : 'Install Ollama or add an OpenAI key'}
            </div>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={checkOllama} title="Refresh">↻</button>
      </div>

      {/* Ollama Setup Guide (if not running) */}
      {!ollamaAvailable && (
        <div className={styles.setupGuide}>
          <div className={styles.setupTitle}>Install Ollama for Local AI</div>
          <div className={styles.setupSteps}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <div>
                <div className={styles.stepTitle}>Download Ollama</div>
                <code className={styles.code}>brew install ollama</code>
                <span className={styles.stepOr}> or visit </span>
                <span className={styles.stepLink}>ollama.com</span>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <div>
                <div className={styles.stepTitle}>Start the server</div>
                <code className={styles.code}>ollama serve</code>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <div>
                <div className={styles.stepTitle}>Pull a model</div>
                <code className={styles.code}>ollama pull llama3.2:3b</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installed Models */}
      {ollamaAvailable && models.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Installed Models</div>
          <div className={styles.modelList}>
            {models.map(model => (
              <div
                key={model.name}
                className={`${styles.modelRow} ${selectedModel === model.name ? styles.modelSelected : ''}`}
                onClick={() => setSelectedModel(model.name)}
              >
                <div className={styles.modelIcon}>🤖</div>
                <div className={styles.modelInfo}>
                  <div className={styles.modelName}>{model.name}</div>
                  <div className={styles.modelMeta}>
                    {model.details?.parameter_size && <span>{model.details.parameter_size}</span>}
                    {model.details?.quantization_level && <span>{model.details.quantization_level}</span>}
                    <span>{formatSize(model.size)}</span>
                  </div>
                </div>
                {selectedModel === model.name && (
                  <span className={styles.activeTag}>Active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Popular Models */}
      {ollamaAvailable && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Download Models</div>
          <div className={styles.popularList}>
            {POPULAR_MODELS.map(m => {
              const installed = models.find(im => im.name === m.name)
              const isPulling = pullingModel === m.name
              return (
                <div key={m.name} className={styles.popularRow}>
                  <div>
                    <div className={styles.popularName}>{m.name}</div>
                    <div className={styles.popularLabel}>{m.label}</div>
                  </div>
                  {installed ? (
                    <span className={styles.installedBadge}>✓ Installed</span>
                  ) : (
                    <button
                      className={styles.pullBtn}
                      onClick={() => handlePull(m.name)}
                      disabled={isPulling || pullingModel !== null}
                    >
                      {isPulling ? `${pullProgress ?? 0}%` : '⬇ Pull'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom model pull */}
          <div className={styles.customPull}>
            <input
              className={styles.input}
              value={customModel}
              onChange={e => setCustomModel(e.target.value)}
              placeholder="Custom model name (e.g. codellama:7b)"
            />
            <button
              className={styles.pullBtn}
              onClick={() => { if (customModel) handlePull(customModel) }}
              disabled={!customModel || pullingModel !== null}
            >
              Pull
            </button>
          </div>

          {/* Pull progress bar */}
          {pullProgress !== null && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${pullProgress}%` }} />
              <span className={styles.progressLabel}>Downloading... {pullProgress}%</span>
            </div>
          )}
        </div>
      )}

      {/* OpenAI Fallback Key */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>OpenAI Fallback</div>
        <div className={styles.apiKeyRow}>
          <input
            className={styles.input}
            type="password"
            value={state.settings.aiApiKey}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { aiApiKey: e.target.value } })}
            placeholder="sk-... (used when Ollama is offline)"
          />
        </div>
        <div className={styles.apiKeyNote}>
          {ollamaAvailable
            ? '✅ Ollama is running — OpenAI key used as fallback only'
            : '⚠️ Ollama not detected — OpenAI key required for AI features'}
        </div>
      </div>

      {/* Test Prompt */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Test AI</div>
        <div className={styles.testRow}>
          <input
            className={styles.input}
            value={testPrompt}
            onChange={e => setTestPrompt(e.target.value)}
            placeholder="Ask something..."
            onKeyDown={e => e.key === 'Enter' && handleTest()}
          />
          <button className={styles.testBtn} onClick={handleTest} disabled={testing || !testPrompt}>
            {testing ? '...' : 'Ask'}
          </button>
        </div>
        {testResponse && (
          <div className={styles.testResponse}>
            <div className={styles.testResponseLabel}>
              {ollamaAvailable ? `🤖 ${selectedModel}` : '☁️ OpenAI'}
            </div>
            <div className={styles.testResponseText}>{testResponse}</div>
          </div>
        )}
        {error && <div className={styles.errorMsg}>❌ {error}</div>}
      </div>
    </div>
  )
}
