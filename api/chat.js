export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Google 시트에 기록 저장
    const { name, technique, question, fullAnswer, avg, grade } = req.body.meta || {};
    if (name) {
      const scores = data.content?.[0]?.text
        ? JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()).scores
        : {};
      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, technique, question,
          answer: fullAnswer,
          scores: scores || {},
          avg: avg || 0,
          grade: grade || "-"
        }),
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
