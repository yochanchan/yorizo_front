import { Suspense } from "react"

import ChatClient from "./ChatClient"

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

function ChatPageContent({ searchParams }: PageProps) {
  const topic = typeof searchParams?.topic === "string" ? searchParams.topic : undefined
  const reset = searchParams?.reset === "true"
  const initialConversationId =
    reset || typeof searchParams?.conversationId !== "string" ? null : searchParams.conversationId

  return <ChatClient topic={topic} initialConversationId={initialConversationId} reset={reset} />
}

export default function ChatPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-[var(--yori-ink-soft)]">チャットを準備しています...</div>}>
      <ChatPageContent {...props} />
    </Suspense>
  )
}
