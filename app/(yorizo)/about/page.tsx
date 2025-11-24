"use client"

export default function AboutPage() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <div className="card p-5 space-y-3 bg-white/95 rounded-3xl shadow-sm border border-white/80">
        <p className="text-sm text-slate-700 leading-relaxed">
          Yorizo は、小規模事業者の「経営のモヤモヤ」を整える AI パートナーです。チャットで悩みを言語化し、
          かんたん診断で状況をまとめ、よろず支援拠点などの公的支援につなげます。専門用語を使いすぎず、
          やさしいトーンで寄り添いながら、次の一歩を一緒に考えます。
        </p>
      </div>
    </div>
  )
}

