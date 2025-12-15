"use client"

import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { Mic, Square } from "lucide-react"

import { getSpeechToken } from "@/lib/api"

type ChatSpeechInputProps = {
  onTranscript: (text: string) => void
  onStatusChange?: (s: "idle" | "recording" | "transcribing") => void
  disabled?: boolean
  className?: string
  "data-testid"?: string
}

type SpeechRecognizer = import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer
type SpeechSdkModule = typeof import("microsoft-cognitiveservices-speech-sdk")

const MAX_SECONDS = 60

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

export function ChatSpeechInput({
  onTranscript,
  onStatusChange,
  disabled = false,
  className,
  "data-testid": testId,
}: ChatSpeechInputProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing">("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const recognizerRef = useRef<SpeechRecognizer | null>(null)
  const transcriptRef = useRef<string[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const forceStopRef = useRef<NodeJS.Timeout | null>(null)
  const finishingRef = useRef(false)

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (forceStopRef.current) {
      clearTimeout(forceStopRef.current)
      forceStopRef.current = null
    }
  }

  const resetRecognizer = () => {
    if (recognizerRef.current) {
      recognizerRef.current.close()
      recognizerRef.current = null
    }
  }

  const emitStatus = (next: "idle" | "recording" | "transcribing") => {
    setStatus(next)
    onStatusChange?.(next)
  }

  const finalizeTranscript = (reason?: "error") => {
    if (finishingRef.current) return
    finishingRef.current = true
    cleanupTimers()
    const transcript = transcriptRef.current.join(" ").trim()
    transcriptRef.current = []
    resetRecognizer()
    setElapsed(0)

    if (transcript) {
      setError(null)
      emitStatus("idle")
      onTranscript(transcript)
      return
    }

    setError(reason ? "音声入力でエラーが発生しました" : "音声を認識できませんでした")
    emitStatus("idle")
  }

  const stopRecognition = () => {
    if (status === "idle") return
    emitStatus("transcribing")
    cleanupTimers()
    const recognizer = recognizerRef.current
    if (!recognizer) {
      finalizeTranscript()
      return
    }
    recognizer.stopContinuousRecognitionAsync(
      () => finalizeTranscript(),
      () => finalizeTranscript("error"),
    )
  }

  const startRecognition = async () => {
    if (disabled || status !== "idle") return
    finishingRef.current = false
    transcriptRef.current = []
    setElapsed(0)
    setError(null)
    emitStatus("transcribing")

    try {
      const sdk: SpeechSdkModule = await import("microsoft-cognitiveservices-speech-sdk")
      const token = await getSpeechToken()
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region)
      speechConfig.speechRecognitionLanguage = "ja-JP"
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

      recognizerRef.current = recognizer
      recognizer.recognized = (_, event) => {
        if (event.result?.reason === sdk.ResultReason.RecognizedSpeech && event.result.text) {
          transcriptRef.current.push(event.result.text)
        }
      }
      recognizer.canceled = () => finalizeTranscript("error")
      recognizer.sessionStopped = () => finalizeTranscript()

      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(resolve, reject)
      })

      emitStatus("recording")
      timerRef.current = setInterval(
        () => setElapsed((prev) => Math.min(prev + 1, MAX_SECONDS)),
        1000,
      )
      forceStopRef.current = setTimeout(() => stopRecognition(), MAX_SECONDS * 1000)
    } catch (err) {
      resetRecognizer()
      cleanupTimers()
      emitStatus("idle")
      setError("音声入力を開始できませんでした")
    }
  }

  useEffect(() => {
    return () => {
      cleanupTimers()
      resetRecognizer()
    }
  }, [])

  let content = (
    <button
      type="button"
      onClick={() => void startRecognition()}
      disabled={disabled || status !== "idle"}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--yori-ink-strong)] shadow-sm hover:bg-[var(--yori-secondary)] disabled:opacity-50 disabled:cursor-default"
    >
      <Mic className="h-4 w-4" />
      <span>音声入力</span>
    </button>
  )

  if (status === "recording") {
    content = (
      <div className="flex items-center justify-between gap-3" data-testid="speech-recording">
        <div className="flex items-center gap-3">
          <div className="flex h-6 items-end gap-[3px]">
            {[8, 12, 16, 12, 10].map((height, idx) => (
              <span
                key={height + idx}
                className="w-[6px] rounded-full bg-[var(--yori-primary)] opacity-90 animate-pulse"
                style={{ height, animationDelay: `${idx * 60}ms` }}
              />
            ))}
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-[var(--yori-ink-strong)]">
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => stopRecognition()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--yori-outline)] bg-[var(--yori-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--yori-ink-strong)] shadow-sm hover:bg-[var(--yori-secondary)]"
        >
          <Square className="h-4 w-4" />
          停止
        </button>
      </div>
    )
  } else if (status === "transcribing") {
    content = (
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--yori-ink-strong)]">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--yori-outline)] border-t-[var(--yori-primary)]" />
        <span>Yorizoが準備しています...</span>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--yori-outline)] bg-white px-4 py-3 shadow-sm",
        className,
      )}
      data-testid={testId ?? "chat-speech-input"}
    >
      {content}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
