"use client"

const faqs = [
  {
    q: "相談内容はどこかに共有されますか？",
    a: "記録は「Yorizoの記憶」に保存され、あなた自身が確認できます。外部共有は行いません（よろず支援拠点へ共有する際も確認を取ります）。",
  },
  {
    q: "診断の結果はどの程度正確ですか？",
    a: "初期診断はAIによる整理メモです。実際の方針検討は、よろず支援拠点のコーディネーターなど専門家と一緒に進めてください。",
  },
  {
    q: "利用に費用はかかりますか？",
    a: "Yorizoの利用は無料です。公的支援の案内も基本は無料で進められる想定です。",
  },
]

export default function FAQPage() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 pb-24 space-y-4">
      <div className="card bg-white/95 rounded-3xl shadow-sm border border-white/80 p-5 space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">Q. {item.q}</p>
            <p className="text-sm text-slate-700 leading-relaxed">A. {item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

