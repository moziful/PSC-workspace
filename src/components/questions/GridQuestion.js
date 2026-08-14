import React from "react";

export default function GridQuestion({ 
  q, 
  onChange, 
  activeGridId, 
  gridPopoverStyle, 
  handleGridMouseEnter, 
  setActiveGridId 
}) {
  const gridData = q.content || { rows: 1, cols: 10, values: Array(10).fill(""), prefilled: {} };
  const cellsCount = gridData.rows * gridData.cols;

  return (
    <div 
      onMouseEnter={(e) => handleGridMouseEnter(e, q.id)}
      onMouseLeave={() => setActiveGridId(null)}
      className="mt-2 relative group/grid-editor"
    >
      {/* Hover Edit Popover - Centered above the cursor entry point, locks position */}
      <div 
        style={activeGridId === q.id ? gridPopoverStyle : { display: "none" }}
        className="absolute flex flex-row items-center gap-4 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-1.5 shadow-xl no-print z-20 text-[11px] animate-in fade-in zoom-in-95 duration-100 select-none after:absolute after:content-[''] after:h-4 after:w-full after:top-full after:left-0"
      >
        {/* Rows Adjuster */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-400">Rows:</span>
          <button
            onClick={() => {
              const rows = Math.max(1, (gridData.rows || 1) - 1);
              const values = Array(rows * (gridData.cols || 10)).fill("");
              onChange(q.id, { ...q, content: { ...gridData, rows, values } });
            }}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-all font-bold cursor-pointer text-slate-200"
          >
            -
          </button>
          <span className="w-4 text-center font-bold text-xs text-white">
            {gridData.rows || 1}
          </span>
          <button
            onClick={() => {
              const rows = (gridData.rows || 1) + 1;
              const values = Array(rows * (gridData.cols || 10)).fill("");
              onChange(q.id, { ...q, content: { ...gridData, rows, values } });
            }}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-all font-bold cursor-pointer text-slate-200"
          >
            +
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-800" />

        {/* Cols Adjuster */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-400">Cols:</span>
          <button
            onClick={() => {
              const cols = Math.max(1, (gridData.cols || 10) - 1);
              const values = Array((gridData.rows || 1) * cols).fill("");
              onChange(q.id, { ...q, content: { ...gridData, cols, values } });
            }}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-all font-bold cursor-pointer text-slate-200"
          >
            -
          </button>
          <span className="w-4 text-center font-bold text-xs text-white">
            {gridData.cols || 10}
          </span>
          <button
            onClick={() => {
              const cols = (gridData.cols || 10) + 1;
              const values = Array((gridData.rows || 1) * cols).fill("");
              onChange(q.id, { ...q, content: { ...gridData, cols, values } });
            }}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded transition-all font-bold cursor-pointer text-slate-200"
          >
            +
          </button>
        </div>
      </div>

      {q.instruction && (
        <input
          type="text"
          value={q.instruction}
          onChange={(e) => onChange(q.id, { ...q, instruction: e.target.value })}
          className="w-full text-center text-sm font-semibold tracking-wider text-slate-800 border-none outline-none focus:bg-slate-100 p-0.5 mb-2"
        />
      )}

      <div
        className="grid border-t border-l border-black"
        style={{
          gridTemplateColumns: `repeat(${gridData.cols || 10}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: cellsCount }).map((_, cIdx) => {
          const val = gridData.values?.[cIdx] || "";
          const isPrefilled = !!gridData.prefilled?.[cIdx];
          return (
            <div 
              key={cIdx} 
              className={`border-r border-b border-black aspect-square flex items-center justify-center p-0.5 transition-all
                ${isPrefilled ? "bg-slate-50" : ""}`}
            >
              <input
                type="text"
                value={val}
                readOnly={isPrefilled}
                onChange={(e) => {
                  if (isPrefilled) return;
                  const newValues = [...(gridData.values || Array(cellsCount).fill(""))];
                  newValues[cIdx] = e.target.value;
                  onChange(q.id, { ...q, content: { ...gridData, values: newValues } });
                }}
                className={`w-full text-center border-none outline-none text-lg
                  ${isPrefilled ? "text-slate-900 font-extrabold select-none cursor-default" : "text-black font-medium"}`}
                placeholder=""
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
