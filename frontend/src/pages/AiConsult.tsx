import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import api from '../services/api'
import ReactMarkdown from 'react-markdown'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const STORAGE_KEY = 'ai_chat_history'
const OWNER_NAME = import.meta.env.VITE_OWNER_NAME || 'there'
const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: `Hola ${OWNER_NAME}, ¿en qué puedo ayudarte hoy?`
}

export default function AiConsult() {
    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : [INITIAL_MESSAGE]
        } catch {
            return [INITIAL_MESSAGE]
        }
    })
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        } catch {
            // sessionStorage full or unavailable
        }
    }, [messages])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const question = input.trim()
        setInput('')

        const newMessages: Message[] = [...messages, { role: 'user', content: question }]
        setMessages(newMessages)
        setLoading(true)

        try {
            // Send last 10 messages as history (excluding initial greeting)
            const history = newMessages.slice(1, -1).slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }))

            const res = await api.post('/ai/query', { question, history })
            const answer = res.data.answer

            setMessages(prev => [...prev, { role: 'assistant', content: answer }])
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Ocurrió un error procesando tu pregunta. Intenta de nuevo.'
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
                    <p className="text-sm text-gray-500">Consulta datos de Silver Star Logistics</p>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={14} className="text-white" />
                            </div>
                        )}

                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                            }`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none prose-table:text-xs prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm">{msg.content}</p>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                                <User size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-sm">Consultando datos...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex gap-3 items-end shadow-sm">
                <textarea
                    ref={inputRef}
                    className="flex-1 text-sm resize-none focus:outline-none max-h-32 min-h-[40px]"
                    placeholder="Escribe tu pregunta sobre los datos de la empresa..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
                    <Send size={15} className="text-white" />
                </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-2">
                Enter para enviar · Shift+Enter para nueva línea
            </p>
        </div>
    )
}