import React, { useState, useRef, useEffect, useCallback } from 'react'
import { generateVoice } from '../utils/generateVoice'

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Gordon Ramsay. What would you like to know about cooking today? Ask me anything about recipes, techniques, or cooking tips!"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [playingMessageId, setPlayingMessageId] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return

    setMessages(prevMessages => {
      const newMessages = [...prevMessages, { role: 'user', content: userMessage.trim() }]
      
      // Send message asynchronously
      setIsLoading(true)
      ;(async () => {
        try {
          // Build conversation history (excluding system message)
          const conversationHistory = newMessages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }))

          const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userMessage.trim(),
              conversationHistory: conversationHistory.slice(0, -1), // Exclude current user message
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to get response')
          }

          const data = await response.json()
          setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        } catch (error) {
          console.error('Chat error:', error)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sorry, I'm having trouble right now. ${error.message || 'Please try again.'}`
          }])
        } finally {
          setIsLoading(false)
        }
      })()

      return newMessages
    })
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      let finalTranscriptText = ''

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        finalTranscriptText = ''
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        finalTranscriptText = finalTranscript || interimTranscript
        setTranscript(finalTranscriptText)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setTranscript('')
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        const textToSend = finalTranscriptText.trim()
        setTranscript('')
        
        if (textToSend) {
          // Auto-send when speech recognition ends with text
          handleSendMessage(textToSend)
        }
      }

      recognitionRef.current = recognition
    } else {
      console.warn('Speech recognition not supported in this browser')
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
    }
  }, [handleSendMessage])

  // Auto-play Gordon's responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && !isLoading && !isPlayingAudio) {
      // Auto-play the latest assistant message
      const playResponse = async () => {
        try {
          const audioUrl = await generateVoice(lastMessage.content)
          
          if (audioRef.current) {
            audioRef.current.pause()
            if (audioRef.current.src.startsWith('blob:')) {
              URL.revokeObjectURL(audioRef.current.src)
            }
          }

          const audio = new Audio(audioUrl)
          audioRef.current = audio

          setIsPlayingAudio(true)
          setPlayingMessageId(messages.length - 1)

          audio.onended = () => {
            setIsPlayingAudio(false)
            setPlayingMessageId(null)
            URL.revokeObjectURL(audioUrl)
          }

          audio.onerror = () => {
            setIsPlayingAudio(false)
            setPlayingMessageId(null)
            URL.revokeObjectURL(audioUrl)
          }

          await audio.play()
        } catch (error) {
          console.error('Auto-play audio error:', error)
          setIsPlayingAudio(false)
          setPlayingMessageId(null)
        }
      }
      
      playResponse()
    }
  }, [messages, isLoading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    await handleSendMessage(userMessage)
  }

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        alert('Failed to start voice recognition. Please try again.')
      }
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handlePlayAudio = async (message, messageId, autoPlay = false) => {
    // If clicking the same message that's playing, stop it (only if not auto-playing)
    if (!autoPlay && isPlayingAudio && playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlayingAudio(false)
      setPlayingMessageId(null)
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src)
      }
      return
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }

    setIsPlayingAudio(true)
    setPlayingMessageId(messageId)
    try {
      const audioUrl = await generateVoice(message)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlayingAudio(false)
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsPlayingAudio(false)
        setPlayingMessageId(null)
        if (!autoPlay) {
          alert('Failed to play audio. Please try again.')
        }
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Audio error:', error)
      setIsPlayingAudio(false)
      setPlayingMessageId(null)
      if (!autoPlay) {
        alert(`Failed to generate audio: ${error.message}`)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-[#F7F3E9] rounded-2xl shadow-lg border border-[#E8DDC8] flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-[#E8DDC8] bg-[#2C2416] text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Voice Chat with Gordon Ramsay</h1>
              <p className="text-sm text-gray-300 mt-1">Speak to me about cooking!</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-[#D4A574] text-white'
                    : 'bg-white text-[#2C2416] border border-[#E8DDC8]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handlePlayAudio(msg.content, idx)}
                      className="flex-shrink-0 p-1 hover:bg-[#F0E8D8] rounded transition-colors"
                      title={isPlayingAudio && playingMessageId === idx ? "Stop audio" : "Play audio"}
                    >
                      {isPlayingAudio && playingMessageId === idx ? (
                        <svg className="w-4 h-4 text-[#2C2416]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeWidth="2" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#2C2416]" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 border border-[#E8DDC8]">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#D4A574]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#5A4A3A]">Gordon is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-[#E8DDC8] bg-white rounded-b-2xl">
          {isListening && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-700">
                  Listening... {transcript && `"${transcript}"`}
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#D4A574] text-white hover:bg-[#C49564]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                  Speak
                </>
              )}
            </button>
            <div className="flex-1 border border-[#E8DDC8] rounded-lg px-4 py-3 flex items-center text-[#5A4A3A]">
              {isListening ? (
                <span className="text-sm">Speak now...</span>
              ) : (
                <span className="text-sm">Click "Speak" to start voice conversation</span>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Text
            </button>
          </div>
          {!isListening && (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or type your message here..."
              className="mt-2 w-full px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent text-sm"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(e)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage

