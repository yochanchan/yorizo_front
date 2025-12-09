"use client"

import { DocumentsPanel } from "@/components/documents/DocumentsPanel"

const COMPANY_ID = "1"
const USER_ID = "demo-user"

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <section className="yori-card-muted p-5 md:p-6 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--yori-ink-soft)]">会社の資料</p>
          <h1 className="text-xl font-bold text-[var(--yori-ink-strong)]">診断に使う資料をまとめる</h1>
          <p className="text-sm text-[var(--yori-ink)] leading-relaxed">
            決算書や月次資料、事業計画などをアップロードしておくと、Yorizo がレポートでより具体的なアドバイスを行います。
          </p>
          <p className="text-[11px] text-[var(--yori-ink-soft)]">対応形式: PDF, Excel, CSV, 画像。アップロードした資料は診断とレポート生成にのみ利用されます。</p>
        </div>
      </section>

      <section className="yori-card p-5 md:p-6 space-y-4">
        <DocumentsPanel companyId={COMPANY_ID} userId={USER_ID} />
      </section>
    </div>
  )
}
