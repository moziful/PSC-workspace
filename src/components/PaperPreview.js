"use client";

import React from "react";
import { getClipartById, CLIPART_LIBRARY } from "@/lib/clipart";
import TextQuestion from "./questions/TextQuestion";
import GridQuestion from "./questions/GridQuestion";
import TableQuestion from "./questions/TableQuestion";
import MatchingQuestion from "./questions/MatchingQuestion";
import ImageQuestion from "./questions/ImageQuestion";
import BlanksQuestion from "./questions/BlanksQuestion";
import ColumnsQuestion from "./questions/ColumnsQuestion";

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
  const [modalUploadOpen, setModalUploadOpen] = React.useState(false);
  const [modalUploadEng, setModalUploadEng] = React.useState("");
  const [modalUploadBng, setModalUploadBng] = React.useState("");
  const [modalUploadFile, setModalUploadFile] = React.useState(null);
  const [modalUploadLoading, setModalUploadLoading] = React.useState(false);
  const [modalUploadError, setModalUploadError] = React.useState(null);

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
                      
                      {q.type === "text" && (
                        <TextQuestion q={q} onChange={handleQuestionChange} />
                      )}

                      {q.type === "grid" && (
                        <GridQuestion
                          q={q}
                          onChange={handleQuestionChange}
                          activeGridId={activeGridId}
                          gridPopoverStyle={gridPopoverStyle}
                          handleGridMouseEnter={handleGridMouseEnter}
                          setActiveGridId={setActiveGridId}
                        />
                      )}

                      {q.type === "table" && (
                        <TableQuestion q={q} onChange={handleQuestionChange} />
                      )}

                      {q.type === "matching" && (
                        <MatchingQuestion q={q} onChange={handleQuestionChange} />
                      )}

                      {q.type === "image" && (
                        <ImageQuestion
                          q={q}
                          onChange={handleQuestionChange}
                          allClipartsMap={allClipartsMap}
                          setActiveImageSelect={setActiveImageSelect}
                        />
                      )}

                      {q.type === "blanks" && (
                        <BlanksQuestion q={q} onChange={handleQuestionChange} />
                      )}

                      {q.type === "columns" && (
                        <ColumnsQuestion q={q} onChange={handleQuestionChange} />
                      )}

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setModalUploadOpen(!modalUploadOpen);
                      setModalUploadError(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-lg transition-all text-xs cursor-pointer"
                  >
                    {modalUploadOpen ? "← Show Library" : "📤 Upload Custom"}
                  </button>
                  <button
                    onClick={() => {
                      setActiveImageSelect(null);
                      setModalUploadOpen(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg p-1.5 transition-all text-xs font-semibold cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              {modalUploadOpen ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!modalUploadEng || !modalUploadFile) {
                      setModalUploadError("Please enter English name and select file");
                      return;
                    }
                    setModalUploadLoading(true);
                    setModalUploadError(null);
                    try {
                      const formData = new FormData();
                      formData.append("nameEnglish", modalUploadEng);
                      formData.append("nameBangla", modalUploadBng);
                      formData.append("image", modalUploadFile);
                      
                      const res = await fetch("/api/clipart", {
                        method: "POST",
                        body: formData
                      });
                      const data = await res.json();
                      if (!data.success) throw new Error(data.error || "Upload failed");
                      
                      // Refresh list
                      const listRes = await fetch("/api/clipart");
                      const listData = await listRes.json();
                      if (listData.success) {
                        setCustomCliparts(listData.cliparts);
                      }
                      
                      // Auto select newly uploaded clipart
                      const newItems = [...activeQ.content.items];
                      newItems[activeImageSelect.iIdx] = { 
                        ...newItems[activeImageSelect.iIdx], 
                        imageId: data.clipart.id
                      };
                      onChange({ 
                        ...paper, 
                        questions: paper.questions.map(qu => qu.id === activeImageSelect.qId ? { ...qu, content: { ...qu.content, items: newItems } } : qu)
                      });
                      
                      // Reset and Close Modal
                      setModalUploadEng("");
                      setModalUploadBng("");
                      setModalUploadFile(null);
                      setModalUploadOpen(false);
                      setActiveImageSelect(null);
                    } catch(err) {
                      setModalUploadError(err.message);
                    } finally {
                      setModalUploadLoading(false);
                    }
                  }}
                  className="p-6 max-w-md mx-auto flex flex-col gap-4"
                >
                  {modalUploadError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
                      {modalUploadError}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">English Name (Required)</label>
                    <input
                      type="text"
                      placeholder="e.g. Lion, Apple"
                      value={modalUploadEng}
                      onChange={(e) => setModalUploadEng(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white placeholder-slate-600"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Bengali Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. সিংহ, আপেল"
                      value={modalUploadBng}
                      onChange={(e) => setModalUploadBng(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white placeholder-slate-600"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Select Image (Required)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setModalUploadFile(e.target.files[0])}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={modalUploadLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 text-white font-semibold py-2.5 rounded-xl transition-all text-sm mt-2 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    {modalUploadLoading ? "Uploading to ImgBB..." : "Upload & Auto-Select"}
                  </button>
                </form>
              ) : (
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
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
