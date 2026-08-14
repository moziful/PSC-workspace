"use client";

import React, { useState } from "react";
import { localParsePaper } from "@/lib/local-parser";

export default function SidebarEditor({
  paper,
  onPaperLoaded,
  onSave,
  onPrint,
  history,
  onLoadHistory,
  onDeleteHistory,
  isScanning,
  scanProgress,
  scanStatus
}) {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState(null);

  const handleParse = () => {
    if (!rawText.trim()) {
      setError("Please paste some text first.");
      return;
    }
    setError(null);
    try {
      // 1. Run local parser instantly
      const parsed = localParsePaper(rawText);
      // 2. Load draft to canvas and trigger Gemini scan
      onPaperLoaded(parsed, true);
    } catch (err) {
      setError("Failed to parse text: " + err.message);
    }
  };

  return (
    <div className="w-full lg:w-[450px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto no-print h-full text-white">
      {/* App Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          A4 Question Maker
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Convert typed unstructured text into structured exam papers instantly using Gemini AI.
        </p>
      </div>

      {/* Raw Text Input Zone */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-200">
            Paste Unstructured Exam Text
          </label>
          {rawText && (
            <button
              onClick={() => setRawText("")}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
          placeholder="Paste raw exam draft here (e.g. Q1. কবিতা লিখ. Q2. বিপরীত শব্দ...)"
        />

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isScanning}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {isScanning ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Scanning Questions... {scanProgress}%
            </>
          ) : (
            "Process Draft"
          )}
        </button>
      </div>


      {/* History Log */}
      <div className="flex-1 flex flex-col gap-3 border-t border-slate-800 pt-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Saved Papers History
        </h2>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
          {history && history.length > 0 ? (
            history.map((hPaper) => (
              <div
                key={hPaper.id}
                className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 flex justify-between items-center hover:bg-slate-800/70 transition-all group"
              >
                <button
                  onClick={() => onLoadHistory(hPaper)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                    {hPaper.schoolName || "Unnamed School"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {hPaper.className} • {hPaper.subjectName} • {new Date(hPaper.updatedAt).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => onDeleteHistory(hPaper.id)}
                  className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-slate-500 py-6">
              No saved papers yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
