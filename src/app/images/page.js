"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CLIPART_LIBRARY } from "@/lib/clipart";

export default function ImagesGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customCliparts, setCustomCliparts] = useState([]);
  
  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newEng, setNewEng] = useState("");
  const [newBng, setNewBng] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const fetchCustomCliparts = () => {
    fetch("/api/clipart")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomCliparts(data.cliparts);
        }
      })
      .catch(err => console.error("Failed to load custom cliparts:", err));
  };

  useEffect(() => {
    fetchCustomCliparts();
  }, []);

  // Merge static and custom cliparts
  const allClipartsMap = React.useMemo(() => {
    const map = { ...CLIPART_LIBRARY };
    customCliparts.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [customCliparts]);

  const filteredClipartKeys = Object.keys(allClipartsMap).filter(key => {
    const clipart = allClipartsMap[key];
    const text = (clipart.nameEnglish + " " + (clipart.nameBangla || "") + " " + key + " " + (clipart.tags || []).join(" ")).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newEng || !file) {
      setError("Please fill in English Name and select an image file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nameEnglish", newEng);
      formData.append("nameBangla", newBng);
      formData.append("image", file);

      const res = await fetch("/api/clipart", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      // Success
      fetchCustomCliparts();
      setNewEng("");
      setNewBng("");
      setFile(null);
      setShowUploadModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-lg p-1.5 font-bold text-sm tracking-wider shadow-md shadow-blue-500/10">
            A4
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              Clipart Library
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Vector Assets for Nursery & KG Exams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            📤 Upload Custom Clipart
          </button>
          
          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold py-1.5 px-3 rounded-xl transition-all text-xs border border-slate-700"
          >
            ← Back to Editor
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search clipart by name, language, or tags (e.g. apple, ছাতা, animal)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition-all placeholder-slate-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-medium shrink-0">
            Showing {filteredClipartKeys.length} of {Object.keys(allClipartsMap).length} cliparts
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredClipartKeys.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredClipartKeys.map(key => {
              const clipart = allClipartsMap[key];
              return (
                <div key={key} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 group">
                  {/* Image Display */}
                  <div className="aspect-square bg-white rounded-xl p-4 flex items-center justify-center text-slate-900 shadow-inner group-hover:scale-[1.02] transition-all min-h-[100px]">
                    {clipart.isCustom ? (
                      <img src={clipart.url} alt={clipart.nameEnglish} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: clipart.svg }} />
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex flex-col text-center">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {clipart.nameEnglish}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                      {clipart.nameBangla || "N/A"}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 rounded px-1.5 py-0.5 mt-2 self-center border border-slate-800">
                      ID: {key}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl min-h-[300px]">
            <span className="text-sm font-semibold text-slate-400">No clipart matches your search.</span>
            <button 
              onClick={() => setSearchTerm("")}
              className="text-xs text-blue-500 hover:underline mt-2 font-medium"
            >
              Clear search query
            </button>
          </div>
        )}
      </main>

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-white">Upload Custom Clipart</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Images will be stored on ImgBB and saved locally</p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setError(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg p-1.5 transition-all text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">English Name (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. Lion, Apple"
                  value={newEng}
                  onChange={(e) => setNewEng(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white placeholder-slate-600"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Bengali Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. সিংহ, আপেল"
                  value={newBng}
                  onChange={(e) => setNewBng(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white placeholder-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Image (Required)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 text-white font-semibold py-2.5 rounded-xl transition-all text-sm mt-2 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {uploading ? "Uploading to ImgBB..." : "Upload & Save Clipart"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
