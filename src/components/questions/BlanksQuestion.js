import React from "react";

export default function BlanksQuestion({ q, onChange }) {
  const blankData = q.content || { items: [] };

  return (
    <div className="mt-2 space-y-2">
      {blankData.items?.map((item, bIdx) => (
        <div key={bIdx} className="flex gap-2 items-center">
          <input
            type="text"
            value={item.text || ""}
            onChange={(e) => {
              const newItems = [...blankData.items];
              newItems[bIdx] = { ...newItems[bIdx], text: e.target.value };
              onChange(q.id, { ...q, content: { ...blankData, items: newItems } });
            }}
            className="w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black font-semibold text-lg"
            placeholder="Blank sentence..."
          />
        </div>
      ))}
      <button
        onClick={() => {
          const newItems = [...(blankData.items || []), { text: "______", answer: "" }];
          onChange(q.id, { ...q, content: { ...blankData, items: newItems } });
        }}
        className="text-xs text-blue-600 hover:underline no-print mt-1"
      >
        + Add blank sentence
      </button>
    </div>
  );
}
