export default function ApiBaseDebugPage() {
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-lg font-semibold">API Base URL Debug</h1>
      <p className="text-sm text-slate-700">
        NEXT_PUBLIC_API_BASE_URL: <code className="font-mono">{process.env.NEXT_PUBLIC_API_BASE_URL ?? "undefined"}</code>
      </p>
      <p className="text-xs text-slate-500">
        本番ではここがバックエンドの本番URLになっているか確認してください。デバッグ後はこのページを削除してかまいません。
      </p>
    </div>
  )
}
