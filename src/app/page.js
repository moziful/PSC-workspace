"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SidebarEditor from "@/components/SidebarEditor";
import PaperPreview from "@/components/PaperPreview";

const DEFAULT_PAPER = {
  schoolName: "পপুলার স্কুল এন্ড কলেজ, রাজশাহী",
  schoolAddress: "বসুন্ধরা আবাসিক এলাকা, রাজশাহী",
  schoolContact: "মোবাইল: ০১৭৮৮-৮৬৬৩৯০, ০১৭১২-২৪০৪২১",
  examName: "১ম সাময়িক পরীক্ষা – ২০২৬",
  className: "কেজি",
  subjectName: "বাংলা",
  examTime: "২:৩০ ঘন্টা",
  fullMarks: 70,
  questions: [
    {
      id: "q1",
      number: "১",
      caption: "কবিতা লিখ।",
      instruction: "আমার পণ কবিতার নাম সহ ৪ লাইন লিখ।",
      marks: 10,
      type: "text",
      content: ["", "", "", ""]
    },
    {
      id: "q2",
      number: "২",
      caption: "শব্দার্থ:",
      instruction: "",
      marks: 2,
      type: "text",
      content: [
        "চরণ - ",
        "বাদল - ",
        "এখন - ",
        "মোর - ",
        "বায়না - "
      ]
    },
    {
      id: "q3",
      number: "৩",
      caption: "ৃ - কার দিয়ে ৫ টি শব্দ লিখ।",
      instruction: "",
      marks: 5,
      type: "grid",
      content: {
        rows: 1,
        cols: 5,
        values: ["", "", "", "", ""],
        prefilled: {}
      }
    },
    {
      id: "q4",
      number: "৪",
      caption: "বিপরীত শব্দ লিখ।",
      instruction: "",
      marks: 5,
      type: "text",
      content: [
        "মৃত - ",
        "কৃপণ - ",
        "উঁচু - ",
        "হাসি - ",
        "দূর - "
      ]
    },
    {
      id: "q5",
      number: "৫",
      caption: "শূন্যস্থান পূরণ কর।",
      instruction: "",
      marks: 5,
      type: "blanks",
      content: {
        items: [
          { text: "ক) ধুকুর পুতুলের ______ বিয়ে তাই।", answer: "" },
          { text: "খ) চোখে ঘুম ______।", answer: "" },
          { text: "গ) ______ নূপুর পায়ে।", answer: "" },
          { text: "ঘ) নদীর ______ যায়।", answer: "" },
          { text: "ঙ) চিঁড়ে মুড়ি ______।", answer: "" }
        ]
      }
    }
  ]
};

export default function Home() {
  const [paper, setPaper] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [zoom, setZoom] = useState(0.85);
  const [modalConfig, setModalConfig] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [pendingSuggestions, setPendingSuggestions] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Load history list on mount
  useEffect(() => {
    fetchHistory();
    // Start with default template
    setPaper(DEFAULT_PAPER);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      if (data.success) {
        setHistory(data.papers);
      }
    } catch (err) {
      console.error("Failed to load papers history:", err);
    }
  };

  const startBackgroundScan = async (targetPaper) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("Initializing scan...");
    setPendingSuggestions({});

    const questions = targetPaper.questions || [];
    if (questions.length === 0) {
      setIsScanning(false);
      setScanProgress(100);
      setScanStatus("Scan complete. No questions.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      setScanStatus(`Analyzing Q${q.number || (i + 1)}: "${q.caption.substring(0, 15)}..."`);
      setScanProgress(Math.round((i / questions.length) * 100));

      try {
        const res = await fetch("/api/scan-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: q,
            className: targetPaper.className,
            subjectName: targetPaper.subjectName
          })
        });

        const data = await res.json();
        if (data.success && data.modified) {
          setPendingSuggestions(prev => ({
            ...prev,
            [q.id]: {
              suggestion: data.suggestion,
              explanation: data.explanation
            }
          }));
        }
      } catch (err) {
        console.error("Scan error on question:", q.id, err);
      }
    }

    setScanProgress(100);
    setScanStatus("Scan complete! Suggestions loaded.");
    setIsScanning(false);
    setTimeout(() => {
      setScanStatus("");
    }, 4000);
  };

  const handlePaperLoaded = (newPaper) => {
    setIsProcessing(true);
    setTimeout(() => {
      setPaper(newPaper);
      setIsProcessing(false);
    }, 850);
  };

  const handleAcceptSuggestion = (qId) => {
    const sug = pendingSuggestions[qId];
    if (!sug) return;
    
    const updatedQuestions = paper.questions.map(q => 
      q.id === qId ? sug.suggestion : q
    );
    
    setPaper({
      ...paper,
      questions: updatedQuestions
    });

    const newSugs = { ...pendingSuggestions };
    delete newSugs[qId];
    setPendingSuggestions(newSugs);
  };

  const handleRejectSuggestion = (qId) => {
    const newSugs = { ...pendingSuggestions };
    delete newSugs[qId];
    setPendingSuggestions(newSugs);
  };

  const handleSave = async () => {
    if (!paper) return;
    setStatusMessage("Saving...");
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paper)
      });
      const data = await res.json();
      if (data.success) {
        setPaper(data.paper);
        setStatusMessage("Paper saved successfully!");
        fetchHistory();
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setStatusMessage("Failed to save: " + err.message);
    }
  };

  const handleDeleteHistory = (id) => {
    setModalConfig({
      title: "Delete Paper",
      message: "Are you sure you want to delete this saved paper from database?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/papers?id=${id}`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (data.success) {
            fetchHistory();
            if (paper && paper.id === id) {
              setPaper(DEFAULT_PAPER);
            }
          }
        } catch (err) {
          console.error("Delete failed:", err);
        }
      }
    });
  };

  const handleResetTemplate = () => {
    setModalConfig({
      title: "Clear Paper Canvas",
      message: "Are you sure you want to clear the entire paper canvas? All questions and headers will be reset.",
      onConfirm: () => {
        setPaper({
          schoolName: "",
          schoolAddress: "",
          schoolContact: "",
          examName: "",
          className: "",
          subjectName: "",
          examTime: "",
          fullMarks: 0,
          questions: []
        });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewPaper = () => {
    setModalConfig({
      title: "Start New Paper",
      message: "Are you sure you want to start a new blank paper? Any unsaved changes will be lost.",
      onConfirm: () => {
        setPaper({
          schoolName: "পপুলার স্কুল এন্ড কলেজ, রাজশাহী",
          schoolAddress: "বসুন্ধরা আবাসিক এলাকা, রাজশাহী",
          schoolContact: "মোবাইল: ০১৭৮৮-৮৬৬৩৯০, ০১৭১২-২৪০৪২১",
          examName: "১ম সাময়িক পরীক্ষা – ২০২৬",
          className: "কেজি / নাসারি",
          subjectName: "বিষয়",
          examTime: "২:৩০ ঘন্টা",
          fullMarks: 70,
          questions: []
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 no-print shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-lg p-1.5 font-bold text-sm tracking-wider shadow-md shadow-blue-500/10">
            A4
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              A4 Question Maker
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Nursery & KG Exam Paper Suite
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {isScanning && (
            <div className="flex flex-col items-end gap-1 mr-2 select-none">
              <span className="text-[10px] text-slate-400 font-mono font-medium max-w-[180px] truncate">
                {scanStatus}
              </span>
              <div className="w-32 bg-slate-800 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <span className="text-xs text-blue-400 bg-blue-950/40 border border-blue-800/50 px-3 py-1.5 rounded-full animate-fade-in font-medium">
              {statusMessage}
            </span>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-700 text-xs text-slate-300">
            <span className="font-semibold select-none mr-1">Zoom:</span>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.05))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded transition-all font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <span className="w-12 text-center font-mono select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(1.5, z + 0.05))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded transition-all font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="text-[10px] ml-1.5 hover:text-white hover:bg-slate-700 px-1.5 py-0.5 rounded transition-all"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <button
            onClick={handleNewPaper}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs border border-slate-700"
          >
            + New Paper
          </button>

          <button
            onClick={handleResetTemplate}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs border border-slate-700"
          >
            Reset Template
          </button>
          
          {paper && paper.questions && paper.questions.length > 0 && !isScanning && (
            <button
              onClick={() => startBackgroundScan(paper)}
              className="bg-indigo-900 hover:bg-indigo-800 border border-indigo-700 text-indigo-100 hover:text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer"
            >
              ✨ AI Review Scan
            </button>
          )}

          <Link
            href="/images"
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 font-semibold transition-all"
          >
            🖼️ Clipart Library
          </Link>

          <button
            onClick={handleSave}
            disabled={!paper}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs shadow-md shadow-emerald-500/10"
          >
            Save Progress
          </button>

          <button
            onClick={handlePrint}
            disabled={!paper}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-500/10"
          >
            Print A4 Paper
          </button>
        </div>
      </header>

      {/* Main Workspace (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Control Panel */}
        <SidebarEditor
          paper={paper}
          onPaperLoaded={handlePaperLoaded}
          onSave={handleSave}
          onPrint={handlePrint}
          history={history}
          onLoadHistory={(hPaper) => setPaper(hPaper)}
          onDeleteHistory={handleDeleteHistory}
          isScanning={isScanning}
          scanProgress={scanProgress}
          scanStatus={scanStatus}
        />

        {/* Editor Main Canvas */}
        <div className="flex-1 flex flex-col h-full bg-slate-950">
          {/* Scrollable A4 Canvas */}
          <div className="flex-1 a4-container overflow-y-auto p-8 flex flex-col items-center bg-slate-950">
            {isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white my-auto min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-500/20" />
                <span className="mt-4 text-sm font-semibold text-slate-400 animate-pulse">
                  Structuring A4 Paper Layout...
                </span>
              </div>
            ) : (
              <div style={{ zoom: zoom }} className="transition-all duration-150 animate-in fade-in duration-500">
                <PaperPreview
                  paper={paper}
                  onChange={(p) => setPaper(p)}
                  pendingSuggestions={pendingSuggestions}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onRejectSuggestion={handleRejectSuggestion}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {modalConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-white mx-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {modalConfig.message}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setModalConfig(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700/50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  modalConfig.onConfirm();
                  setModalConfig(null);
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Force hot reload re-compile to clean chunk cache
