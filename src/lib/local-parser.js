import { CLIPART_LIBRARY } from "./clipart";

const CAPTION_MAP = [
  { keywords: ["স্বরবর্ণ"], standard: "স্বরবর্ণ লিখ (অ - ঔ):" },
  { keywords: ["ব্যঞ্জনবর্ণ"], standard: "ব্যঞ্জনবর্ণ লিখ (ক - ঁ):" },
  { keywords: ["capital letter", "a to z"], standard: "Write Capital Letters (A to Z):" },
  { keywords: ["small letter", "a-z"], standard: "Write Small Letters (a to z):" },
  { keywords: ["blanks", "শূন্যস্থান"], standard: "শূন্যস্থান পূরণ কর।" },
  { keywords: ["খালি ঘর", "খালিঘর", "blank box", "ঘর পূরণ"], standard: "খালি ঘর পূরণ কর:" },
  { keywords: ["কবিতা", "poem"], standard: "কবিতা লিখ।" },
  { keywords: ["শব্দার্থ", "অর্থ লিখ"], standard: "শব্দার্থ লিখ:" },
  { keywords: ["বিপরীত", "opposite"], standard: "বিপরীত শব্দ লিখ:" },
  { keywords: ["মিল কর", "matching", "match"], standard: "বাম পাশের শব্দের সাথে ডান পাশের শব্দ মিল কর।" },
  { keywords: ["ছবি দেখে", "picture", "ছবি"], standard: "ছবি দেখে প্রথম অক্ষর লিখ:" },
  { keywords: ["এলোমেলো", "সাজিয়ে", "sajiye", "rearrange"], standard: "এলোমেলো বর্ণ সাজিয়ে লিখ:" }
];

const BYANJONBORNA = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন", "প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ", "স", "হ", "ড়", "ঢ়", "য়", "ৎ", "ং", "ঃ", "ঁ"];
const SWAROBORNA = ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ"];
const ENGLISH_ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

function getRangeCount(startChar, endChar) {
  // Try Byanjonborna
  let startIdx = BYANJONBORNA.indexOf(startChar);
  let endIdx = BYANJONBORNA.indexOf(endChar);
  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    return endIdx - startIdx + 1;
  }

  // Try Swaroborna
  startIdx = SWAROBORNA.indexOf(startChar);
  endIdx = SWAROBORNA.indexOf(endChar);
  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    return endIdx - startIdx + 1;
  }

  // Try English
  startIdx = ENGLISH_ALPHABET.indexOf(startChar.toUpperCase());
  endIdx = ENGLISH_ALPHABET.indexOf(endChar.toUpperCase());
  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    return endIdx - startIdx + 1;
  }

  return null;
}

function normalizeCaption(caption) {
  const lower = caption.toLowerCase();
  for (const item of CAPTION_MAP) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.standard;
    }
  }
  return caption;
}

export function localParsePaper(text) {
  const paper = {
    schoolName: "পপুলার স্কুল এন্ড কলেজ, রাজশাহী",
    schoolAddress: "বসুন্ধরা আবাসিক এলাকা, রাজশাহী",
    schoolContact: "মোবাইল: ০১৭৮৮-৮৬৬৩৯০, ০১৭১২-২৪০৪২১",
    examName: "সাময়িক পরীক্ষা",
    session: "২০২৬",
    className: "কেজি",
    subjectName: "বাংলা",
    examTime: "২:৩০ ঘন্টা",
    fullMarks: 70,
    questions: []
  };

  if (!text) return paper;

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Detect overall metadata
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];

    if ((line.includes("স্কুল") || line.includes("কলেজ") || line.includes("School") || line.includes("College")) && line.length > 8) {
      paper.schoolName = line;
      continue;
    }

    if (line.includes("পরীক্ষা") || line.includes("Examination") || line.includes("Terminal") || line.includes("Test")) {
      paper.examName = line;
      const yearMatch = line.match(/(২০[২-৯][০-৯]|20[2-9][0-9])/);
      if (yearMatch) paper.session = yearMatch[0];
      continue;
    }

    const classMatch = line.match(/(শ্রেণী|শ্রেণি|Class)\s*[:\-–]?\s*([^\s]+)/i);
    if (classMatch) {
      paper.className = classMatch[2];
      continue;
    }

    const subMatch = line.match(/(বিষয়|বিষয়|Subject)\s*[:\-–]?\s*([^\s]+)/i);
    if (subMatch) {
      paper.subjectName = subMatch[2];
      continue;
    }

    const timeMatch = line.match(/(সময়|সময়|Time)\s*[:\-–]?\s*([^\s]+(?:\s*(?:ঘন্টা|ঘণ্টা|Hour|Min))?)/i);
    if (timeMatch) {
      paper.examTime = timeMatch[2];
      continue;
    }

    const marksMatch = line.match(/(পূর্ণমান|মান|Marks)\s*[:\-–]?\s*([০-৯\d]+)/i);
    if (marksMatch) {
      const numStr = marksMatch[2];
      const enNum = numStr.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
      paper.fullMarks = parseInt(enNum) || 70;
      continue;
    }
  }

  // Find where the questions start (lines starting with numbers like ১, 1, etc.)
  const questionNumberRegex = /^([০-৯]+|\d+)\s*[\।\.\/\|\)]/;
  
  // 2. Parse questions
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(questionNumberRegex);

    if (match) {
      if (currentQuestion) {
        finalizeQuestion(currentQuestion);
        paper.questions.push(currentQuestion);
      }

      const num = match[1];
      const captionText = line.substring(match[0].length).trim();
      
      let marks = 5;
      let caption = captionText;
      const marksMatch = captionText.match(/[\t\s]+([০-৯]+|\d+)$/);
      if (marksMatch) {
        const rawM = marksMatch[1];
        const enM = rawM.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
        marks = parseInt(enM) || 5;
        caption = captionText.substring(0, marksMatch.index).trim();
      }

      caption = normalizeCaption(caption);

      currentQuestion = {
        id: `local_q_${Math.random().toString(36).substring(2, 9)}`,
        number: num,
        caption: caption,
        instruction: "",
        marks: marks,
        type: "text",
        content: []
      };
    } else {
      if (currentQuestion) {
        if (currentQuestion.content.length === 0 && line.length > 10 && !line.includes("-") && !line.includes("=") && !line.includes("____") && !line.includes("\t")) {
          if (currentQuestion.caption.includes("কবিতা") || currentQuestion.caption.includes("Poem") || currentQuestion.caption.toLowerCase().includes("poem")) {
            currentQuestion.caption += " — " + line;
          } else {
            currentQuestion.instruction = line;
          }
        } else {
          if (line.includes("\t") || line.includes("  ")) {
            const parts = line.split(/[\t\s]+/).map(p => p.trim()).filter(Boolean);
            currentQuestion.content.push(...parts);
          } else {
            currentQuestion.content.push(line);
          }
        }
      }
    }
  }

  if (currentQuestion) {
    finalizeQuestion(currentQuestion);
    paper.questions.push(currentQuestion);
  }

  return paper;
}

function finalizeQuestion(q) {
  const text = q.caption.toLowerCase() + " " + q.instruction.toLowerCase();

  // 1. Detect Vowel Signs / Kar Chinho (splits to 8 columns: Vowel + Empty Writing slot)
  if (text.includes("কার চিহ্ন") || text.includes("kar chinho")) {
    q.type = "text";
    const cleanedContent = [];
    q.content.forEach(line => {
      const char = line.replace(/[-–—\s]+/g, "").trim();
      if (char) {
        cleanedContent.push(`${char} —`, "");
      }
    });
    q.content = cleanedContent;
    return;
  }

  // 2. Detect Grid Blanks (e.g. "খালি ঘর পূরণ কর") and align to alphabet sequences
  if (text.includes("খালি ঘর") || text.includes("খালিঘর") || text.includes("ঘর পূরণ") || text.includes("blank box")) {
    q.type = "grid";
    
    // Extract present letters
    const rawText = (q.instruction || "") + " " + (Array.isArray(q.content) ? q.content.join(" ") : "");
    const items = rawText.split(/[\s,，、।\-]+/i).filter(x => x.trim().length > 0);
    
    let alphabetSet = null;
    if (items.some(char => BYANJONBORNA.includes(char))) {
      alphabetSet = BYANJONBORNA;
    } else if (items.some(char => SWAROBORNA.includes(char))) {
      alphabetSet = SWAROBORNA;
    } else {
      const hasUpper = items.some(char => /^[A-Z]$/.test(char));
      const hasLower = items.some(char => /^[a-z]$/.test(char));
      if (hasUpper) {
        alphabetSet = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      } else if (hasLower) {
        alphabetSet = Array.from("abcdefghijklmnopqrstuvwxyz");
      }
    }
    
    if (alphabetSet) {
      const indices = items
        .map(char => alphabetSet.indexOf(char))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b);
        
      if (indices.length > 0) {
        const minIdx = Math.max(0, indices[0] - (indices[0] % 2 === 1 ? 1 : 0));
        const maxIdx = indices[indices.length - 1];
        const count = maxIdx - minIdx + 1;
        
        let cols = count;
        let rows = 1;
        if (count > 15) {
          cols = 13;
          rows = Math.ceil(count / 13);
        }
        
        const values = Array(rows * cols).fill("");
        const prefilled = {};
        
        items.forEach(char => {
          const idx = alphabetSet.indexOf(char);
          if (idx >= minIdx && idx <= maxIdx) {
            const gridOffset = idx - minIdx;
            values[gridOffset] = char;
            prefilled[gridOffset] = char;
          }
        });
        
        q.instruction = "";
        q.content = {
          rows: rows,
          cols: cols,
          values: values,
          prefilled: prefilled
        };
        return;
      }
    }
  }

  // 3. Detect Vowel Symbol Words Grid ("কার দিয়ে শব্দ লিখ")
  const karWordMatch = text.match(/([\d০-৯]+)\s*টি\s*(শব্দ|word)/);
  if (karWordMatch && (text.includes("কার দিয়ে") || text.includes("কার যোগে") || text.includes("কার চিহ্ণ") || text.includes("চিহ্ন দিয়ে"))) {
    q.type = "grid";
    const rawNum = karWordMatch[1];
    const enNum = rawNum.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
    const wordCount = parseInt(enNum) || 5;
    
    let symbol = "";
    if (q.content.length > 0) {
      symbol = q.content[0].trim();
    } else if (q.instruction) {
      symbol = q.instruction.trim();
    }
    
    const cols = 1 + wordCount;
    const values = Array(cols).fill("");
    const prefilled = {};
    if (symbol) {
      values[0] = symbol;
      prefilled[0] = symbol;
    }
    
    q.instruction = "";
    q.content = {
      rows: 1,
      cols: cols,
      values: values,
      prefilled: prefilled
    };
    return;
  }

  // 4. Detect Grid Types & setup fixed prefilled templates
  if (text.includes("এলোমেলো") || text.includes("সাজিয়ে") || text.includes("rearrange")) {
    q.type = "grid";
    let itemsCount = 10;
    const rawText = (q.instruction || "") + " " + (Array.isArray(q.content) ? q.content.join(" ") : "");
    const items = rawText.split(/[\s,，、।\-]+/i).filter(x => x.trim().length > 0);
    if (items.length > 0) {
      itemsCount = items.length;
      q.instruction = items.join("    ");
    } else if (rawText.trim()) {
      q.instruction = rawText.trim();
    }
    
    let cols = itemsCount;
    let rows = 1;
    if (itemsCount > 15) {
      cols = 13;
      rows = Math.ceil(itemsCount / 13);
    }
    
    q.content = {
      rows: rows,
      cols: cols,
      values: Array(rows * cols).fill(""),
      prefilled: {}
    };
    return;
  }

  // 2. Range Grid Detectors (e.g. "ট থেকে ম পর্যন্ত লিখ" or "A to Z")
  const rangeMatch = text.match(/([\u0980-\u09FFa-zA-Z])\s*(থেকে|to|–|-)\s*([\u0980-\u09FFa-zA-Z])/);
  if (rangeMatch) {
    const startChar = rangeMatch[1];
    const endChar = rangeMatch[3];
    const count = getRangeCount(startChar, endChar);
    if (count && count > 0) {
      q.type = "grid";
      let cols = count;
      let rows = 1;
      if (count > 15) {
        cols = 13;
        rows = Math.ceil(count / 13);
      }
      q.content = {
        rows: rows,
        cols: cols,
        values: Array(rows * cols).fill(""),
        prefilled: {}
      };
      return;
    }
  }

  // 3. Number Range Grid Detectors (e.g. "১ থেকে ৫০" or "Write 1 to 20")
  const numRangeMatch = text.match(/(\d+|[০-৯]+)\s*(থেকে|to|–|-)\s*(\d+|[০-৯]+)/);
  if (numRangeMatch) {
    const convertBanglaDigits = (str) => str.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
    const startNum = parseInt(convertBanglaDigits(numRangeMatch[1]));
    const endNum = parseInt(convertBanglaDigits(numRangeMatch[3]));
    if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
      const count = endNum - startNum + 1;
      q.type = "grid";
      let cols = count;
      let rows = 1;
      if (count > 15) {
        cols = 13;
        rows = Math.ceil(count / 13);
      }
      q.content = {
        rows: rows,
        cols: cols,
        values: Array(rows * cols).fill(""),
        prefilled: {}
      };
      return;
    }
  }

  if (text.includes("স্বরবর্ণ")) {
    q.type = "grid";
    q.content = {
      rows: 2,
      cols: 6,
      values: Array(12).fill(""),
      prefilled: { 0: "অ", 2: "ই", 4: "উ", 6: "ঋ", 8: "ঐ", 10: "ও" }
    };
    return;
  }
  if (text.includes("ব্যঞ্জনবর্ণ")) {
    q.type = "grid";
    q.content = {
      rows: 5,
      cols: 8,
      values: Array(40).fill(""),
      prefilled: { 0: "ক", 4: "ঙ", 8: "চ", 12: "ঞ", 16: "ট", 20: "ণ", 24: "ত", 28: "ন", 32: "প", 36: "ম" }
    };
    return;
  }
  if (text.includes("capital letter") || text.includes("a to z")) {
    q.type = "grid";
    q.content = {
      rows: 4,
      cols: 7,
      values: Array(28).fill(""),
      prefilled: { 0: "A", 4: "E", 8: "I", 12: "M", 16: "Q", 20: "U", 24: "Y" }
    };
    return;
  }
  if (text.includes("small letter") || text.includes("a-z")) {
    q.type = "grid";
    q.content = {
      rows: 4,
      cols: 7,
      values: Array(28).fill(""),
      prefilled: { 0: "a", 4: "e", 8: "i", 12: "m", 16: "q", 20: "u", 24: "y" }
    };
    return;
  }

  // 4. Detect Columns / Sum breakdown (e.g. ত + প + ন = )
  const hasSpellingSum = q.content.some(line => line.includes("+") && line.includes("="));
  if (hasSpellingSum) {
    q.type = "columns";
    q.content = {
      items: q.content.map(line => {
        const parts = line.split("=");
        return {
          left: parts[0] ? parts[0].trim() + " =" : "",
          right: parts[1] ? parts[1].trim() : ""
        };
      })
    };
    return;
  }

  // 5. Detect Blanks
  const hasBlanks = q.content.some(line => line.includes("______") || line.includes("___"));
  if (hasBlanks || text.includes("খালি") || text.includes("শূন্যস্থান") || text.includes("blank")) {
    q.type = "blanks";
    q.content = {
      items: q.content.map(line => ({
        text: line.includes("______") ? line : line + " ______ ",
        answer: ""
      }))
    };
    return;
  }

  // 6. Detect Picture/Image Clipart Grid ("ছবি দেখে প্রথম অক্ষর লিখ")
  if (text.includes("ছবি দেখে") || text.includes("picture") || text.includes("ছবি")) {
    q.type = "image";
    const rawText = (q.instruction || "") + " " + (Array.isArray(q.content) ? q.content.join(" ") : "");
    const names = rawText.split(/[\s,，、।\-]+/i).filter(x => x.trim().length > 0);
    
    if (names.length > 0) {
      const items = names.map(name => {
        let foundKey = "";
        const lowerName = name.toLowerCase();
        
        for (const key of Object.keys(CLIPART_LIBRARY)) {
          const clipart = CLIPART_LIBRARY[key];
          if (
            clipart.nameEnglish.toLowerCase() === lowerName ||
            (clipart.nameBangla && clipart.nameBangla.toLowerCase() === lowerName) ||
            (clipart.tags && clipart.tags.map(t => t.toLowerCase()).includes(lowerName))
          ) {
            foundKey = key;
            break;
          }
        }
        return {
          imageId: foundKey || "",
          value: ""
        };
      });
      q.content = { items };
    } else {
      q.content = {
        items: Array(5).fill(null).map(() => ({
          imageId: "",
          value: ""
        }))
      };
    }
    q.instruction = "";
    return;
  }

  // 7. Detect Poem/Writing lines
  if (text.includes("কবিতা") || text.includes("কবিতার") || text.includes("poem")) {
    if (q.content.length === 0) {
      q.content = ["", "", "", ""];
    }
    return;
  }

  // 7. Detect Word Meanings / Opposites list
  if (q.content.length > 0) {
    q.content = q.content.map(line => {
      if (line.endsWith("-") || line.endsWith("–") || line.endsWith(":")) {
        return line;
      }
      return line + " - ";
    });
  }
}
