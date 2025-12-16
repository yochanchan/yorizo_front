"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getSpeechToken } from "@/lib/api"

type VoiceStatus = "idle" | "recording" | "transcribing"
type SpeechRecognizer = import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer
type SpeechSdkModule = typeof import("microsoft-cognitiveservices-speech-sdk")

type UseChatSpeechRecognitionOptions = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

const MAX_SECONDS = 60

export function useChatSpeechRecognition({ onTranscript, disabled = false }: UseChatSpeechRecognitionOptions) {
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const recognizerRef = useRef<SpeechRecognizer | null>(null)
  const transcriptRef = useRef<string[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const forceStopRef = useRef<NodeJS.Timeout | null>(null)
  const finishingRef = useRef(false)
  const mountedRef = useRef(true)

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (forceStopRef.current) {
      clearTimeout(forceStopRef.current)
      forceStopRef.current = null
    }
  }, [])

  const resetRecognizer = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.close()
      recognizerRef.current = null
    }
  }, [])

  const finalizeTranscript = useCallback(
    (reason?: "error") => {
      if (finishingRef.current) return
      finishingRef.current = true
      cleanupTimers()
      const transcript = transcriptRef.current.join(" ").trim()
      transcriptRef.current = []
      resetRecognizer()
      if (mountedRef.current) {
        setElapsed(0)
      }

      if (transcript) {
        if (mountedRef.current) {
          setError(null)
          setStatus("idle")
        }
        onTranscript(transcript)
        finishingRef.current = false
        return
      }

      if (mountedRef.current) {
        setError(reason ? "音声入力でエラーが発生しました。" : "音声を認識できませんでした。")
        setStatus("idle")
      }
      finishingRef.current = false
    },
    [cleanupTimers, onTranscript, resetRecognizer],
  )

  const stop = useCallback(() => {
    if (status === "idle") return
    if (mountedRef.current) setStatus("transcribing")
    cleanupTimers()

    const recognizer = recognizerRef.current
    if (!recognizer) {
      finalizeTranscript()
      return
    }

    recognizer.stopContinuousRecognitionAsync(
      () => {
        // ここでは finalize しない（sessionStopped 側で確定する）
      },
      () => finalizeTranscript("error"),
    )
  }, [cleanupTimers, finalizeTranscript, status])


  const start = useCallback(async () => {
    if (disabled || status !== "idle") return
    finishingRef.current = false
    transcriptRef.current = []
    if (mountedRef.current) {
      setElapsed(0)
      setError(null)
      setStatus("transcribing")
    }

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
      recognizer.canceled = (_, e) => {
        if (e.reason === sdk.CancellationReason.Error) finalizeTranscript("error")
      }
      recognizer.sessionStopped = () => finalizeTranscript()

      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(resolve, reject)
      })

      if (mountedRef.current) {
        setStatus("recording")
      }
      timerRef.current = setInterval(() => {
        if (!mountedRef.current) return
        setElapsed((prev) => Math.min(prev + 1, MAX_SECONDS))
      }, 1000)
      forceStopRef.current = setTimeout(() => stop(), MAX_SECONDS * 1000)
    } catch (err) {
      resetRecognizer()
      cleanupTimers()
      if (mountedRef.current) {
        setStatus("idle")
        setError("音声入力を開始できませんでした。")
      }
    }
  }, [cleanupTimers, disabled, finalizeTranscript, resetRecognizer, status, stop])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; cleanupTimers(); resetRecognizer() }
  }, [cleanupTimers, resetRecognizer])


  return {
    status,
    error,
    elapsed,
    start,
    stop,
  }
}
