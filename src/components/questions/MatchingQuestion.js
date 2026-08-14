import React from "react";

export default function MatchingQuestion({ q, onChange }) {
  const matchData = q.content || { left: [], right: [] };
  const maxLength = Math.max(matchData.left.length, matchData.right.length);

  return (
    <div className="mt-2 grid grid-cols-2 gap-8 relative max-w-md mx-auto">
      <div className="space-y-4 text-right pr-4">
        {Array.from({ length: maxLength }).map((_, idx) => (
          <div key={`left-${idx}`} className="flex items-center justify-end gap-2">
            <input
              type="text"
              value={matchData.left[idx] || ""}
              onChange={(e) => {
                const newLeft = [...matchData.left];
                newLeft[idx] = e.target.value;
                onChange(q.id, { ...q, content: { ...matchData, left: newLeft } });
              }}
              className="w-full text-right border-none outline-none focus:bg-slate-100 text-black font-semibold text-lg"
              placeholder="A"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4 text-left pl-4 border-l border-black">
        {Array.from({ length: maxLength }).map((_, idx) => (
          <div key={`right-${idx}`} className="flex items-center justify-start gap-2">
            <input
              type="text"
              value={matchData.right[idx] || ""}
              onChange={(e) => {
                const newRight = [...matchData.right];
                newRight[idx] = e.target.value;
                onChange(q.id, { ...q, content: { ...matchData, right: newRight } });
              }}
              className="w-full text-left border-none outline-none focus:bg-slate-100 text-black font-semibold text-lg"
              placeholder="1"
            />
          </div>
        ))}
      </div>

      <div className="col-span-2 flex gap-2 justify-center mt-2 no-print">
        <button
          onClick={() => {
            const newLeft = [...matchData.left, ""];
            const newRight = [...matchData.right, ""];
            onChange(q.id, { ...q, content: { left: newLeft, right: newRight } });
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add row
        </button>
      </div>
    </div>
  );
}
