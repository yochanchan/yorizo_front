"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { MascotIcon } from "@/components/MascotIcon"
import { getConversations, type ConversationSummary } from "@/lib/api"

const USER_ID = "demo-user"

export default function HomePage() {
  const router = useRouter()
  const [latestConversation, setLatestConversation] = useState<ConversationSummary | null>(null)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await getConversations(USER_ID, 1, 0)
        setLatestConversation(data?.[0] ?? null)
      } catch (err) {
        console.error(err)
      }
    }
    fetchLatest()
  }, [])

  const handleStart = () => {
    router.push("/chat?reset=true")
  }

  const handleMemory = () => router.push("/memory")

  return (
    <div className="flex flex-col gap-8 md:gap-10 py-4 pb-24">
      <div className="yori-card-muted p-6 space-y-4 text-center">
        <div className="flex justify-center">
          <MascotIcon size="lg" />
        </div>
        <div className="space-y-2">
          <p className="text-lg md:text-xl font-bold text-[var(--yori-ink-strong)]">
            経営のモヤモヤを、Yorizoと一緒に整理しよう。
          </p>
          <p className="text-sm text-[var(--yori-ink)]">
            いくつかの簡単な質問に答えるだけで、今の状態と「次に何をすればいいか」を3分で整理します。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStart}
            className="btn-primary w-full py-4 text-base font-semibold inline-flex items-center justify-center gap-2"
          >
            Yorizoとチャットで話す
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleMemory}
            className="w-full text-center text-sm font-semibold text-[var(--yori-ink-strong)] underline underline-offset-4"
          >
            Yorizoの記憶を見る
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--yori-ink-soft)]">機能</h2>
        <div className="yori-card p-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-3 flex-1">
            <MascotIcon size="sm" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--yori-ink-strong)]">経営のモヤモヤ かんたんチェック</p>
              <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
                短いガイド付きチャットで、今の状態をざっくり整理し、次の一歩を提案します。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/wizard")}
            className="btn-secondary w-full md:w-auto px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            かんたんチェックをはじめる
          </button>
        </div>
      </section>

      <section className="mt-2 mb-10">
        <div className="flex flex-wrap items-center justify-center gap-6 px-4">
            <Image
            src="/logos/meti.png"
            alt="経済産業省"
            width={220}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <Image
            src="/logos/chukicho.png"
            alt="中小企業庁"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />

        </div>
      </section>
    </div>
  )
}
