import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text, classStyle, subjectStyle, clientApiKey } = await request.json();
    
    if (!text || text.trim() === "") {
      return NextResponse.json({ success: false, error: "No text content provided." }, { status: 400 });
    }

    // Determine the API Key: prioritize client-passed header or body, fall back to environment variable
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Gemini API Key is missing. Please configure it in your environment or enter it in the app settings."
      }, { status: 400 });
    }


    const prompt = `
You are an expert exam question paper compiler for Nursery and KG schools.
Your task is to parse the raw unstructured copy-pasted exam paper text and structure it into a precise, valid JSON format.
The layout format/renderer of each question is determined by its CAPTION and content. You must detect the correct type without modifying the original question content or translations.

Types available:
1. "grid": Used when kids are asked to write letters, alphabets, or numbers in empty box slots. E.g. "১। স্বরবর্ণ লিখ।" with a 1x10 row grid of boxes, or "A-Z Capital letters" with a row of boxes.
   Structure content as: { rows: number, cols: number, values: string[], prefilled: { [index: number]: string } }
2. "table": Used when there are labels and cells beneath or beside them, e.g. "২। া, ি কার দিয়ে শব্দ লিখ।" (write word with vowel symbols) or "খালি ঘর পূরণ কর" with grid templates.
   Structure content as: { headers: string[], rows: Array<{ label: string, value: string }> }
3. "matching": Used for left/right column matching. E.g., matching consonants, uppercase/lowercase letters, or Bangla letters.
   Structure content as: { left: string[], right: string[] }
4. "image": Used for "picture-based questions" like "ছবি দেখে প্রথম অক্ষর লিখ" or "Identify the picture and write its name".
   Map each question item to a valid clipart ID. The available clipart IDs are exactly: "umbrella", "tree", "cat", "parrot", "fish", "ant", "egg", "kite", "bat", "flag", "apple", "ball", "mango", "book", "pen".
   Structure content as: { items: Array<{ imageId: string, label: string, value: string }> }
5. "blanks": Used for list of fill-in-the-blanks sentences. E.g., "ক) ধুকুর পুতুলের ______ বিয়ে তাই।"
   Structure content as: { items: Array<{ text: string, answer: string }> }
6. "columns": Used for word breakdown questions like "ঔ + ষ + ধ =", "ন + য + ন =".
   Structure content as: { items: Array<{ left: string, right: string }> }
7. "text": Default for standard text questions, oral questions ("মৌখিক"), poems, and lists.
   Structure content as: array of strings/sentences.

Input text is:
"""
${text}
"""

You MUST automatically detect the Class Name (e.g. "কেজি", "Nursery", "নাসারি"), Subject Name, School Name, Exam Name, Session, Time, and Full Marks from the input text.

You MUST return a JSON object following this EXACT format:
{
  "schoolName": "পপুলার স্কুল এন্ড কলেজ, রাজশাহী",
  "examName": "১ম সাময়িক পরীক্ষা – ২০২৬",
  "session": "২০২৬",
  "className": "কেজি",
  "subjectName": "বাংলা",
  "examTime": "২:৩০ ঘন্টা",
  "fullMarks": 70,
  "questions": [
    {
      "id": "q1",
      "number": "১",
      "caption": "কবিতা লিখ।",
      "instruction": "আমার পণ কবিতার নাম সহ ৪ লাইন লিখ।",
      "marks": 10,
      "type": "text",
      "content": ["", "", "", ""]
    },
    {
      "id": "q2",
      "number": "২",
      "caption": "শব্দার্থ:",
      "instruction": "",
      "marks": 2,
      "type": "text",
      "content": ["চরণ - ", "বাদল - ", "এখন - ", "মোর - ", "বায়না - "]
    }
  ]
}

DO NOT wrap the response in markdown \`\`\`json code blocks. Return ONLY the raw JSON string. Ensure all Bangla and English texts are preserved exactly as provided.
`;

    // Fetch call to Gemini API using stable gemini-3.5-flash model under v1 endpoint
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
      const errText = await response.text();
      return NextResponse.json({ success: false, error: `Gemini API responded with status ${response.status}: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ success: false, error: "Empty response from Gemini API" }, { status: 500 });
    }

    let cleanText = resultText.trim();
    // Strip markdown code block wrappers if present
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsedJson = JSON.parse(cleanText);
      return NextResponse.json({ success: true, paper: parsedJson });
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", cleanText);
      return NextResponse.json({ success: false, error: `Invalid JSON format returned by AI: ${parseErr.message}` }, { status: 500 });
    }
  } catch (err) {
    console.error("API parse error:", err);
    return NextResponse.json({ success: false, error: `Parsing failed: ${err.message}` }, { status: 500 });
  }
}
