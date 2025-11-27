import { API_BASE_URL } from "@/lib/config"

export default function EnvDebugPage() {
  return (
    <div style={{ padding: 16, fontFamily: "monospace" }}>
      <h1>Env debug (temporary)</h1>
      <pre>{API_BASE_URL}</pre>
      <p style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>
        本番でフロントURL/debug/env を開き、バックエンドの本番URLになっているか確認してください。デバッグ後はこのページを削除して構いません。
      </p>
    </div>
  )
}
