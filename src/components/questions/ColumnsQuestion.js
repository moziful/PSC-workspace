import React from "react";

export default function ColumnsQuestion({ q, onChange }) {
  const columnData = q.content || { items: [] };

  return (
    <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2">
      {columnData.items?.map((item, cIdx) => (
        <div key={cIdx} className="flex gap-2 items-center text-lg">
          <input
            type="text"
            value={item.left || ""}
            onChange={(e) => {
              const newItems = [...columnData.items];
              newItems[cIdx] = { ...newItems[cIdx], left: e.target.value };
              onChange(q.id, { ...q, content: { ...columnData, items: newItems } });
            }}
            className="w-2/3 border-none outline-none focus:bg-slate-100 p-0.5 text-black font-semibold"
            placeholder="ঔ + ষ + ধ ="
          />
          <input
            type="text"
            value={item.right || ""}
            onChange={(e) => {
              const newItems = [...columnData.items];
              newItems[cIdx] = { ...newItems[cIdx], right: e.target.value };
              onChange(q.id, { ...q, content: { ...columnData, items: newItems } });
            }}
            className="w-1/3 border-none outline-none focus:bg-slate-100 p-0.5 text-black font-semibold"
            placeholder=""
          />
        </div>
      ))}
      
      <button
        onClick={() => {
          const newItems = [...(columnData.items || []), { left: "", right: "" }];
          onChange(q.id, { ...q, content: { ...columnData, items: newItems } });
        }}
        className="text-xs text-blue-600 hover:underline no-print mt-1"
      >
        + Add line
      </button>
    </div>
  );
}
