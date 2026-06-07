// ============================================================
// TriSight リレーサーバー  ―  Anthropic（なぎさ）中継用
// Vercel Serverless Function  ファイル名: api/anthropic.js
// ------------------------------------------------------------
// 目的：APIキーをサーバー内に隠し、ブラウザに露出させない。
//       （Anthropicはブラウザから直接呼ぶことも可能だが、その場合
//         キーが画面のソースに見えてしまう。OpenAIと同様、サーバー
//         経由にしてキーを隠す）
// キー：Vercelの環境変数 ANTHROPIC_API_KEY に保存（コードには書かない）
// ============================================================

export default async function handler(req, res) {
  // --- CORS：TriSight本体（GitHub Pages）からの呼び出しを許可 ---
  // ※当面は '*'。動作確認後、'https://testarossa1209-claude.github.io' に絞ると安全。
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライト（ブラウザが事前に送る確認）に応答
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'POSTのみ受け付けます' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'サーバーに ANTHROPIC_API_KEY が設定されていません（Vercelの環境変数を確認）' });
    return;
  }

  try {
    // ブラウザから受け取った中身（model / system / messages / max_tokens 等）を
    // そのままAnthropicへ転送する。なぎさ用。
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);   // Anthropicの応答をそのまま返す
  } catch (e) {
    res.status(500).json({ error: 'リレーエラー: ' + e.message });
  }
}
