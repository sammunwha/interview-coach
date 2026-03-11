export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { meta, ...anthropicBody } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    // Google 시트 저장
    if (meta && meta.name) {
      try {
        const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(raw);
        const avg = Math.round(Object.values(parsed.scores).reduce((a, b) => a + b, 0) / 4);
        const grade = avg >= 9 ? "S" : avg >= 7 ? "A" : avg >= 5 ? "B" : "C";

        await fetch(process.env.GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: meta.name,
            technique: meta.technique,
            question: meta.question,
            answer: meta.fullAnswer,
            scores: parsed.scores,
            avg,
            grade
          }),
        });
      } catch (e) {
        console.error("시트 저장 오류:", e);
      }
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
