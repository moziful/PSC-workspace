import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { question, className, subjectName } = await request.json();
    
    if (!question) {
      return NextResponse.json({ success: false, error: "Missing question details" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing API Key" }, { status: 400 });
    }

    const prompt = `
You are an expert exam reviewer for Nursery and KG school papers.
Analyze the following single question structure and contents.
Decide if it can be improved structurally to look identical to premium school question papers (with grids, column matching, blanks, blanks grid tables, or image clipart).

Clipart list: "umbrella", "tree", "cat", "parrot", "fish", "ant", "egg", "kite", "bat", "flag", "apple", "ball", "mango", "book", "pen".

Question to review:
${JSON.stringify(question, null, 2)}

Context: Class is "${className || "Nursery/KG"}", Subject is "${subjectName || "Bangla/English"}".

Guidelines:
1. If the caption asks to identify pictures (e.g. "ছবি দেখে প্রথম অক্ষর লিখ" or "Identify the picture"), convert type to "image" and map each item to a valid clipart ID. Content structure: { items: [{ imageId: "umbrella", label: "", value: "" }] }
2. If the caption is about matching columns (e.g. "এলোমেলো শব্দ মিল কর" or "Match the letters"), convert type to "matching" and extract left and right lists. Content structure: { left: ["ক", "খ"], right: ["খ", "ক"] }
3. If it's a spelling sums / breakdown question (e.g. "ত + প + ন ="), convert type to "columns". Content structure: { items: [{ left: "ত + প + ন =", right: "" }] }
4. If it's a writing grid (e.g. "১। স্বরবর্ণ লিখ।"), convert type to "grid" and suggest row/cols. Content structure: { rows: 1, cols: 10, values: ["", ...], prefilled: {} }
5. If it's blanks, convert to "blanks".
6. If the local structure is already optimal, output modified: false.

Return a JSON response following this EXACT format (DO NOT wrap in markdown blocks):
{
  "modified": true/false,
  "explanation": "Brief explanation of the improvement made",
  "suggestion": {
    ...updated question properties (id MUST match input question.id)
  }
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ success: false, error: err }, { status: response.status });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ success: false, error: "Empty response from Gemini" });
    }

    let cleanText = resultText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?\s*/i, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanText);
    return NextResponse.json({ success: true, ...parsed });
  } catch (err) {
    console.error("Scan API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
