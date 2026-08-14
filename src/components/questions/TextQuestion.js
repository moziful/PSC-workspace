import React from "react";

export default function TextQuestion({ q, onChange }) {
  const isKarChinho = q.caption.includes("কার চিহ্ন") || q.caption.toLowerCase().includes("kar chinho");

  return (
    <div className="space-y-1">
      {q.instruction && (
        <input
          type="text"
          value={q.instruction}
          onChange={(e) => onChange(q.id, { ...q, instruction: e.target.value })}
          className="w-full text-sm italic text-slate-800 border-none outline-none focus:bg-slate-100 p-0.5"
        />
      )}
      <div className={isKarChinho ? "grid grid-cols-8 gap-x-2 gap-y-3 pt-1 items-center" : "space-y-1"}>
        {Array.isArray(q.content) && q.content.map((line, lIdx) => (
          <div key={lIdx} className="flex gap-1">
            <input
              type="text"
              value={line}
              onChange={(e) => {
                const newContent = [...q.content];
                newContent[lIdx] = e.target.value;
                onChange(q.id, { ...q, content: newContent });
              }}
              className={`w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black font-sans text-base 
                ${isKarChinho && lIdx % 2 === 0 ? "text-right font-bold pr-1 select-none pointer-events-none" : ""} 
                ${isKarChinho ? (lIdx % 2 === 1 ? "border-b border-dotted border-black min-h-[28px] mt-1" : "") : (line.trim() === "" ? "border-b border-dotted border-black min-h-[28px] mt-1" : "")}`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange(q.id, { ...q, content: [...(q.content || []), ""] })}
        className="text-xs text-blue-600 mt-1 hover:underline no-print"
      >
        + Add line
      </button>
    </div>
  );
}
