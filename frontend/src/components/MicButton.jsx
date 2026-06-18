import { useRef, useState, useCallback } from 'react'

export default function MicButton({ onTranscript, onNoResult, onInterim, disabled }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const gotResultRef = useRef(false)

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.\nPlease use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    gotResultRef.current = false

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript.trim()
      if (result.isFinal) {
        if (text) {
          gotResultRef.current = true
          onTranscript(text)
        }
      } else {
        onInterim?.(text)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      if (!gotResultRef.current) {
        onNoResult?.()
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [onTranscript, onNoResult])

  const handleClick = useCallback(() => {
    if (disabled) return
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [disabled, isListening, startListening, stopListening])

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple rings while listening */}
      {isListening && (
        <>
          <span className="absolute w-28 h-28 rounded-full bg-red-400 animate-ripple" />
          <span className="absolute w-28 h-28 rounded-full bg-red-400 animate-ripple [animation-delay:0.4s]" />
        </>
      )}

      <button
        onClick={handleClick}
        disabled={disabled}
        className={[
          'relative z-10 w-28 h-28 rounded-full flex items-center justify-center',
          'transition-all duration-150 shadow-lg focus:outline-none select-none',
          isListening
            ? 'bg-red-500 scale-110 shadow-red-300'
            : disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer shadow-indigo-200',
        ].join(' ')}
        aria-label={isListening ? 'Tap to stop' : 'Tap to speak'}
      >
        {isListening ? (
          /* Waveform bars */
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 3].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-white rounded-full animate-bounce"
                style={{ height: `${h * 6}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          /* Microphone icon */
          <svg viewBox="0 0 24 24" fill="white" className="w-12 h-12">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      <p className="absolute -bottom-8 text-xs text-gray-400 whitespace-nowrap">
        {isListening ? 'Tap to stop · speak now' : 'Tap to speak'}
      </p>
    </div>
  )
}
