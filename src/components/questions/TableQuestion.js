import React from "react";

export default function TableQuestion({ q, onChange }) {
  const tableData = q.content || { headers: [], rows: [] };

  return (
    <div className="mt-2">
      <table className="exam-table">
        {tableData.headers?.length > 0 && (
          <thead>
            <tr>
              {tableData.headers.map((h, hIdx) => (
                <th key={hIdx} className="font-bold border border-black bg-slate-50 text-sm">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => {
                      const newHeaders = [...tableData.headers];
                      newHeaders[hIdx] = e.target.value;
                      onChange(q.id, { ...q, content: { ...tableData, headers: newHeaders } });
                    }}
                    className="w-full text-center border-none outline-none bg-transparent font-bold text-black"
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {tableData.rows?.map((row, rIdx) => (
            <tr key={rIdx}>
              <td className="border border-black font-semibold text-base w-1/3">
                <input
                  type="text"
                  value={row.label || ""}
                  onChange={(e) => {
                    const newRows = [...tableData.rows];
                    newRows[rIdx] = { ...newRows[rIdx], label: e.target.value };
                    onChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
                  }}
                  className="w-full text-center border-none outline-none bg-transparent font-semibold text-black"
                />
              </td>
              <td className="border border-black w-2/3">
                <input
                  type="text"
                  value={row.value || ""}
                  onChange={(e) => {
                    const newRows = [...tableData.rows];
                    newRows[rIdx] = { ...newRows[rIdx], value: e.target.value };
                    onChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
                  }}
                  className="w-full text-center border-none outline-none bg-transparent text-black"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-2 no-print">
        <button
          onClick={() => {
            const newRows = [...(tableData.rows || []), { label: "", value: "" }];
            onChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add row
        </button>
      </div>
    </div>
  );
}
