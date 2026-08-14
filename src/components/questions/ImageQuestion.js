import React from "react";

export default function ImageQuestion({ q, onChange, allClipartsMap, setActiveImageSelect }) {
  const imgData = q.content || { items: [] };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-5 gap-3 border border-black p-2 bg-white">
        {imgData.items?.map((item, iIdx) => {
          const clipart = allClipartsMap[item.imageId];
          return (
            <div key={iIdx} className="flex flex-col border border-black rounded overflow-hidden">

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
                  <span className="text-[10px] text-red-500 font-bold">No Image</span>
                )}
              </div>
              
              <div className="border-t border-black p-1 bg-white min-h-[30px] flex items-center justify-center">
                <input
                  type="text"
                  value={item.value || ""}
                  onChange={(e) => {
                    const newItems = [...imgData.items];
                    newItems[iIdx] = { ...newItems[iIdx], value: e.target.value };
                    onChange(q.id, { ...q, content: { ...imgData, items: newItems } });
                  }}
                  className="w-full text-center text-xs font-semibold border-none outline-none focus:bg-slate-100 text-black"
                  placeholder=""
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
            onChange(q.id, { ...q, content: { ...imgData, items: newItems } });
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add image
        </button>
      </div>
    </div>
  );
}
