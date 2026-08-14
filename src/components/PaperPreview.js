"use client";

import React from "react";
import { getClipartById, CLIPART_LIBRARY } from "@/lib/clipart";

export default function PaperPreview({
  paper,
  onChange,
  pendingSuggestions = {},
  onAcceptSuggestion,
  onRejectSuggestion
}) {


  const [activeGridId, setActiveGridId] = React.useState(null);
  const [gridPopoverStyle, setGridPopoverStyle] = React.useState({});
  const [activeImageSelect, setActiveImageSelect] = React.useState(null);
  const [customCliparts, setCustomCliparts] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/clipart")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomCliparts(data.cliparts);
        }
      })
      .catch(err => console.error("Failed to load custom cliparts:", err));
  }, []);

  // Merge static cliparts with custom uploaded cliparts
  const allClipartsMap = React.useMemo(() => {
    const map = { ...CLIPART_LIBRARY };
    customCliparts.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [customCliparts]);

  const handleGridMouseEnter = (e, qId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Position 45px above where the cursor entered, centered horizontally
    setGridPopoverStyle({
      left: `${x}px`,
      top: `${y - 45}px`,
      transform: "translateX(-50%)"
    });
    setActiveGridId(qId);
  };

  if (!paper) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No paper loaded. Paste text on the left to start!
      </div>
    );
  }

  const handleHeaderChange = (field, value) => {
    onChange({
      ...paper,
      [field]: value
    });
  };

  const handleQuestionChange = (qId, updatedQuestion) => {
    const updatedQuestions = paper.questions.map(q => 
      q.id === qId ? updatedQuestion : q
    );
    onChange({
      ...paper,
      questions: updatedQuestions
    });
  };

  const deleteQuestion = (qId) => {
    const updatedQuestions = paper.questions.filter(q => q.id !== qId);
    onChange({
      ...paper,
      questions: updatedQuestions
    });
  };

  const moveQuestion = (qId, direction) => {
    const index = paper.questions.findIndex(q => q.id === qId);
    if (index === -1) return;
    const updatedQuestions = [...paper.questions];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < updatedQuestions.length) {
      const temp = updatedQuestions[index];
      updatedQuestions[index] = updatedQuestions[targetIndex];
      updatedQuestions[targetIndex] = temp;
      onChange({
        ...paper,
        questions: updatedQuestions
      });
    }
  };

  // Estimate height of each question in pixels (96 DPI)
  const estimateHeight = (q) => {
    let h = 50; // Question title & margin
    if (q.type === "text") {
      const isKarChinho = q.caption.includes("কার চিহ্ন") || q.caption.toLowerCase().includes("kar chinho");
      if (isKarChinho) {
        h += 32 * Math.ceil((q.content?.length || 1) / 8);
      } else {
        h += 24 * (q.content?.length || 1);
      }
      if (q.instruction) h += 20;
    } else if (q.type === "grid") {
      h += 80 * (q.content?.rows || 1);
      if (q.instruction) h += 24; // Add space for jumbled letters
    } else if (q.type === "table") {
      h += 45 * (q.content?.rows?.length || 1) + 40;
    } else if (q.type === "matching") {
      h += 38 * Math.max(q.content?.left?.length || 1, q.content?.right?.length || 1) + 20;
    } else if (q.type === "image") {
      h += 140;
    } else if (q.type === "blanks") {
      h += 30 * (q.content?.items?.length || 1);
    } else if (q.type === "columns") {
      h += 35 * Math.ceil((q.content?.items?.length || 1) / 2);
    }
    return h;
  };

  // Group questions into pages dynamically based on estimated heights
  const paginateQuestions = () => {
    const pages = [];
    let currentPageQuestions = [];
    
    // Page height budget: A4 page printable height is ~950px
    const firstPageBudget = 680; // Minus school header block (~270px)
    const otherPageBudget = 940;
    
    let currentBudget = firstPageBudget;
    let accumulatedHeight = 0;

    (paper.questions || []).forEach((q) => {
      const qHeight = estimateHeight(q);
      if (accumulatedHeight + qHeight > currentBudget && currentPageQuestions.length > 0) {
        pages.push(currentPageQuestions);
        currentPageQuestions = [q];
        accumulatedHeight = qHeight;
        currentBudget = otherPageBudget;
      } else {
        currentPageQuestions.push(q);
        accumulatedHeight += qHeight;
      }
    });

    if (currentPageQuestions.length > 0) {
      pages.push(currentPageQuestions);
    }

    if (pages.length === 0) {
      pages.push([]);
    }

    return pages;
  };

  const pages = paginateQuestions();

  return (
    <div className="flex flex-col gap-8 select-text" id="printable-area">
      {pages.map((pageQuestions, pageIdx) => (
        <div key={pageIdx} className="a4-page text-black relative flex flex-col justify-between">
          
          {/* Main content area */}
          <div>
            {/* School Header only on Page 1 */}
            {pageIdx === 0 && (
              <div className="exam-header flex flex-col items-center justify-center relative group">
                <input
                  type="text"
                  value={paper.schoolName || ""}
                  onChange={(e) => handleHeaderChange("schoolName", e.target.value)}
                  className="w-full text-center font-bold text-xl border-none outline-none focus:bg-slate-100 p-1 text-black font-serif"
                  placeholder="School Name"
                />
                <input
                  type="text"
                  value={paper.schoolAddress || "বসুন্ধরা আবাসিক এলাকা, রাজশাহী"}
                  onChange={(e) => handleHeaderChange("schoolAddress", e.target.value)}
                  className="w-full text-center text-xs border-none outline-none focus:bg-slate-100 text-slate-700 font-sans"
                  placeholder="School Address"
                />
                <input
                  type="text"
                  value={paper.schoolContact || "মোবাইল: ০১৭৮৮-৮৬৬৩৯০, ০১৭১২-২৪০৪২১"}
                  onChange={(e) => handleHeaderChange("schoolContact", e.target.value)}
                  className="w-full text-center text-xs border-none outline-none focus:bg-slate-100 text-slate-700 font-sans mt-0.5"
                  placeholder="School Contact"
                />
                
                <input
                  type="text"
                  value={paper.examName || ""}
                  onChange={(e) => handleHeaderChange("examName", e.target.value)}
                  className="w-full text-center font-bold text-lg mt-2 border-none outline-none focus:bg-slate-100 p-1 text-black border-t border-black font-serif"
                  placeholder="Exam Name"
                />

                <div className="w-full grid grid-cols-4 gap-2 text-xs font-semibold mt-2 border-t border-black pt-1.5 font-sans">
                  <div className="flex gap-1 items-center">
                    <span>শ্রেণি:</span>
                    <input
                      type="text"
                      value={paper.className || ""}
                      onChange={(e) => handleHeaderChange("className", e.target.value)}
                      className="w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black"
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span>বিষয়:</span>
                    <input
                      type="text"
                      value={paper.subjectName || ""}
                      onChange={(e) => handleHeaderChange("subjectName", e.target.value)}
                      className="w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black"
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span>সময়:</span>
                    <input
                      type="text"
                      value={paper.examTime || ""}
                      onChange={(e) => handleHeaderChange("examTime", e.target.value)}
                      className="w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black"
                    />
                  </div>
                  <div className="flex gap-1 items-center justify-end">
                    <span>পূর্ণমান:</span>
                    <input
                      type="number"
                      value={paper.fullMarks || 70}
                      onChange={(e) => handleHeaderChange("fullMarks", parseInt(e.target.value) || 0)}
                      className="w-12 border-none outline-none focus:bg-slate-100 p-0.5 text-black text-right"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Questions for this page */}
            <div className="space-y-6">
              {pageQuestions.map((q) => {
                // Find global index in master list
                const globalIdx = paper.questions.findIndex(mq => mq.id === q.id);
                return (
                  <div key={q.id} className="relative group/question pb-3 border-b border-dashed border-transparent hover:border-slate-200">
                    
                    {/* Inline Controls */}
                    <div className="absolute -right-14 top-0 flex flex-col gap-1 no-print opacity-0 group-hover/question:opacity-100 transition-opacity bg-slate-800 text-white rounded p-1 shadow-lg z-10">
                      <button
                        onClick={() => moveQuestion(q.id, -1)}
                        disabled={globalIdx === 0}
                        className="p-1 hover:bg-slate-700 rounded text-xs disabled:opacity-30"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveQuestion(q.id, 1)}
                        disabled={globalIdx === paper.questions.length - 1}
                        className="p-1 hover:bg-slate-700 rounded text-xs disabled:opacity-30"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1 hover:bg-red-600 rounded text-xs"
                        title="Delete Question"
                      >
                        ✕
                      </button>
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(q.id, { ...q, type: e.target.value })}
                        className="text-[10px] bg-slate-900 text-white p-1 rounded border-none outline-none mt-1"
                      >
                        <option value="text">Standard Text</option>
                        <option value="grid">Grid (Boxes)</option>
                        <option value="table">Table (Cells)</option>
                        <option value="matching">Matching Columns</option>
                        <option value="image">Pictures Grid</option>
                        <option value="blanks">Fill blanks</option>
                        <option value="columns">Sum/Spelling</option>
                      </select>
                    </div>

                    {/* Question Title & Marks */}
                    <div className="flex justify-between items-start gap-4 mb-2 font-bold font-serif">
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={q.number || ""}
                          onChange={(e) => handleQuestionChange(q.id, { ...q, number: e.target.value })}
                          className="w-8 border-none outline-none focus:bg-slate-100 text-black font-semibold"
                        />
                        <input
                          type="text"
                          value={q.caption || ""}
                          onChange={(e) => handleQuestionChange(q.id, { ...q, caption: e.target.value })}
                          className="w-full border-none outline-none focus:bg-slate-100 text-black font-semibold"
                          placeholder="Question caption"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={q.marks || 0}
                          onChange={(e) => handleQuestionChange(q.id, { ...q, marks: parseInt(e.target.value) || 0 })}
                          className="w-8 text-right border-none outline-none focus:bg-slate-100 text-black"
                        />
                      </div>
                    </div>

                    {/* Question Body / Content Renderers */}
                    <div className="pl-10 pr-2">
                      
                      {q.type === "text" && (() => {
                        const isKarChinho = q.caption.includes("কার চিহ্ন") || q.caption.toLowerCase().includes("kar chinho");
                        return (
                          <div className="space-y-1">
                            {q.instruction && (
                              <input
                                type="text"
                                value={q.instruction}
                                onChange={(e) => handleQuestionChange(q.id, { ...q, instruction: e.target.value })}
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
                                      handleQuestionChange(q.id, { ...q, content: newContent });
                                    }}
                                    className={`w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black font-sans text-base 
                                      ${isKarChinho && lIdx % 2 === 0 ? "text-right font-bold pr-1 select-none pointer-events-none" : ""} 
                                      ${isKarChinho ? (lIdx % 2 === 1 ? "border-b border-dotted border-black min-h-[28px] mt-1" : "") : (line.trim() === "" ? "border-b border-dotted border-black min-h-[28px] mt-1" : "")}`}
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleQuestionChange(q.id, { ...q, content: [...(q.content || []), ""] })}
                              className="text-xs text-blue-600 mt-1 hover:underline no-print"
                            >
                              + Add line
                            </button>
                          </div>
                        );
                      })()}

                      {/* Type: Grid (Boxes) */}
                      {q.type === "grid" && (() => {
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
                                    handleQuestionChange(q.id, { ...q, content: { ...gridData, rows, values } });
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
                                    handleQuestionChange(q.id, { ...q, content: { ...gridData, rows, values } });
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
                                    handleQuestionChange(q.id, { ...q, content: { ...gridData, cols, values } });
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
                                    handleQuestionChange(q.id, { ...q, content: { ...gridData, cols, values } });
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
                                onChange={(e) => handleQuestionChange(q.id, { ...q, instruction: e.target.value })}
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
                                        handleQuestionChange(q.id, { ...q, content: { ...gridData, values: newValues } });
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
                      })()}

                      {/* Type: Table */}
                      {q.type === "table" && (() => {
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
                                            handleQuestionChange(q.id, { ...q, content: { ...tableData, headers: newHeaders } });
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
                                          handleQuestionChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
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
                                          handleQuestionChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
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
                                  handleQuestionChange(q.id, { ...q, content: { ...tableData, rows: newRows } });
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                + Add row
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Type: Matching Columns */}
                      {q.type === "matching" && (() => {
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
                                      handleQuestionChange(q.id, { ...q, content: { ...matchData, left: newLeft } });
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
                                      handleQuestionChange(q.id, { ...q, content: { ...matchData, right: newRight } });
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
                                  handleQuestionChange(q.id, { ...q, content: { left: newLeft, right: newRight } });
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                + Add row
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Type: Clipart Pictures */}
                      {q.type === "image" && (() => {
                        const imgData = q.content || { items: [] };
                        return (
                          <div className="mt-4">
                            <div className="grid grid-cols-5 gap-3 border border-black p-2 bg-white">
                              {imgData.items?.map((item, iIdx) => {
                                const clipart = allClipartsMap[item.imageId];
                                return (
                                  <div key={iIdx} className="flex flex-col border border-black rounded overflow-hidden">
                                    <div className="no-print bg-slate-100 p-1 border-b border-black">
                                      <select
                                        value={item.imageId}
                                        onChange={(e) => {
                                          const newItems = [...imgData.items];
                                          newItems[iIdx] = { ...newItems[iIdx], imageId: e.target.value };
                                          handleQuestionChange(q.id, { ...q, content: { ...imgData, items: newItems } });
                                        }}
                                        className="w-full text-[10px] bg-white border border-slate-300 rounded"
                                      >
                                        {Object.keys(allClipartsMap).map(key => {
                                          const clipartItem = allClipartsMap[key];
                                          const banglaLabel = clipartItem.nameBangla ? ` (${clipartItem.nameBangla})` : "";
                                          return (
                                            <option key={key} value={key}>
                                              {clipartItem.nameEnglish}{banglaLabel}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    
                                    <div 
                                      onClick={() => setActiveImageSelect({ qId: q.id, iIdx: iIdx })}
                                      className="aspect-square p-3 flex items-center justify-center text-slate-800 min-h-[70px] cursor-pointer hover:bg-slate-50 transition-colors"
                                      title="Click to select another clipart image"
                                    >
                                      {clipart ? (
                                        clipart.isCustom ? (
                                          <img src={clipart.url} alt={clipart.nameEnglish} className="w-full h-full object-contain" />
                                        ) : (
                                          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: clipart.svg }} />
                                        )
                                      ) : (
                                        <span className="text-[10px] text-slate-400">No Image</span>
                                      )}
                                    </div>
                                    
                                    <div className="border-t border-black p-1 bg-white min-h-[30px] flex items-center justify-center">
                                      <input
                                        type="text"
                                        value={item.value || ""}
                                        onChange={(e) => {
                                          const newItems = [...imgData.items];
                                          newItems[iIdx] = { ...newItems[iIdx], value: e.target.value };
                                          handleQuestionChange(q.id, { ...q, content: { ...imgData, items: newItems } });
                                        }}
                                        className="w-full text-center text-xs font-semibold border-none outline-none focus:bg-slate-100 text-black"
                                        placeholder="Answer Box"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex gap-2 mt-2 no-print">
                              <button
                                onClick={() => {
                                  const newItems = [...(imgData.items || []), { imageId: "umbrella", label: "", value: "" }];
                                  handleQuestionChange(q.id, { ...q, content: { ...imgData, items: newItems } });
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                + Add image
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Type: Fill Blanks */}
                      {q.type === "blanks" && (() => {
                        const blankData = q.content || { items: [] };
                        return (
                          <div className="mt-2 space-y-2">
                            {blankData.items?.map((item, bIdx) => (
                              <div key={bIdx} className="flex gap-2 items-center text-base">
                                <span className="text-black font-semibold">
                                  {String.fromCharCode(bIdx + 97) || bIdx + 1})
                                </span>
                                <input
                                  type="text"
                                  value={item.text || ""}
                                  onChange={(e) => {
                                    const newItems = [...blankData.items];
                                    newItems[bIdx] = { ...newItems[bIdx], text: e.target.value };
                                    handleQuestionChange(q.id, { ...q, content: { ...blankData, items: newItems } });
                                  }}
                                  className="w-full border-none outline-none focus:bg-slate-100 p-0.5 text-black font-sans"
                                  placeholder="ক) ধুকুর পুতুলের ______ বিয়ে তাই।"
                                />
                              </div>
                            ))}
                            
                            <button
                              onClick={() => {
                                const newItems = [...(blankData.items || []), { text: "______", answer: "" }];
                                handleQuestionChange(q.id, { ...q, content: { ...blankData, items: newItems } });
                              }}
                              className="text-xs text-blue-600 hover:underline no-print mt-1"
                            >
                              + Add blank sentence
                            </button>
                          </div>
                        );
                      })()}

                      {/* Type: Spelling Sum Columns */}
                      {q.type === "columns" && (() => {
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
                                    handleQuestionChange(q.id, { ...q, content: { ...columnData, items: newItems } });
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
                                    handleQuestionChange(q.id, { ...q, content: { ...columnData, items: newItems } });
                                  }}
                                  className="w-1/3 border-none outline-none focus:bg-slate-100 p-0.5 text-black font-semibold"
                                  placeholder=""
                                />
                              </div>
                            ))}
                            
                            <button
                              onClick={() => {
                                const newItems = [...(columnData.items || []), { left: "", right: "" }];
                                handleQuestionChange(q.id, { ...q, content: { ...columnData, items: newItems } });
                              }}
                              className="text-xs text-blue-600 hover:underline no-print mt-1"
                            >
                              + Add line
                            </button>
                          </div>
                        );
                      })()}

                    {/* AI Suggestion Overlay */}
                    {pendingSuggestions?.[q.id] && (
                      <div className="mt-4 ml-10 mr-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 tracking-wider">
                              AI SUGGESTION
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Enhancement Available
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1.5 leading-relaxed">
                            {pendingSuggestions[q.id].explanation}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => onRejectSuggestion(q.id)}
                            className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => onAcceptSuggestion(q.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer / Add Question Trigger / Page Numbers */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 no-print">
            <div>Page {pageIdx + 1} of {pages.length}</div>
            
            {pageIdx === pages.length - 1 && (
              <button
                onClick={() => {
                  const newQuestions = [...(paper.questions || [])];
                  newQuestions.push({
                    id: Math.random().toString(36).substring(2, 9),
                    number: String(newQuestions.length + 1),
                    caption: "নতুন প্রশ্ন",
                    marks: 5,
                    type: "text",
                    content: [""]
                  });
                  onChange({ ...paper, questions: newQuestions });
                }}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] hover:bg-slate-700 font-semibold"
              >
                + Add Section to Last Page
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Clipart Selection Modal */}
      {activeImageSelect && (() => {
        const activeQ = paper.questions.find(qu => qu.id === activeImageSelect.qId);
        const usedIds = activeQ?.content?.items?.map(item => item.imageId) || [];
        const availableClipartKeys = Object.keys(allClipartsMap).filter(key => !usedIds.includes(key));
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h3 className="text-base font-bold text-white">Select Clipart Image</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose an image from the library (in-use items are hidden)</p>
                </div>
                <button
                  onClick={() => setActiveImageSelect(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg p-1.5 transition-all text-xs font-semibold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              
              {/* Modal Grid body */}
              <div className="flex-1 overflow-y-auto p-6">
                {availableClipartKeys.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {availableClipartKeys.map(key => {
                      const clipart = allClipartsMap[key];
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            const newItems = [...activeQ.content.items];
                            newItems[activeImageSelect.iIdx] = { 
                              ...newItems[activeImageSelect.iIdx], 
                              imageId: key 
                            };
                            handleQuestionChange(activeImageSelect.qId, { 
                              ...activeQ, 
                              content: { ...activeQ.content, items: newItems } 
                            });
                            setActiveImageSelect(null);
                          }}
                          className="bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-3 flex flex-col gap-2 transition-all hover:-translate-y-0.5 cursor-pointer group"
                        >
                          <div className="aspect-square bg-white rounded-xl p-3 flex items-center justify-center text-slate-900">
                            {clipart.isCustom ? (
                              <img src={clipart.url} alt={clipart.nameEnglish} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: clipart.svg }} />
                            )}
                          </div>
                          <div className="flex flex-col text-center">
                            <span className="text-[10px] font-bold text-slate-200 truncate">{clipart.nameEnglish}</span>
                            <span className="text-[9px] text-slate-500 truncate mt-0.5">{clipart.nameBangla || ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-sm font-semibold text-slate-400">All available clipart images are already in use!</span>
                    <button
                      onClick={() => setActiveImageSelect(null)}
                      className="mt-4 text-xs text-blue-500 hover:underline font-semibold"
                    >
                      Go back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
