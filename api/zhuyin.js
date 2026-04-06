export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { words } = request.body || {};
  if (!Array.isArray(words) || words.length === 0) {
    return response.status(400).json({ error: "words must be a non-empty array" });
  }

  try {
    const upstreamResponse = await fetch("https://api.zhconvert.org/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams({
        converter: "Bopomofo",
        text: words.join("\n")
      })
    });

    if (!upstreamResponse.ok) {
      return response.status(502).json({ error: `Upstream failed: HTTP ${upstreamResponse.status}` });
    }

    const payload = await upstreamResponse.json();
    const text = payload?.data?.text;
    if (typeof text !== "string") {
      return response.status(502).json({ error: "Upstream returned no text result" });
    }

    return response.status(200).json({
      zhuyin: text.split("\n").map((item) => item.trim())
    });
  } catch (error) {
    return response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown zhuyin proxy error"
    });
  }
}
