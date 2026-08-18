"use client";

import { ChangeEvent, DragEvent, useState } from "react";

const PRESET_STUDIO_PHOTOS = [
  { label: "Cloud Mug (Oat)", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80" },
  { label: "Stoneware Arch Vase", url: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80" },
  { label: "Olive Oil Cruet", url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80" },
  { label: "Linen Throw", url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80" },
  { label: "Cedar Candle", url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80" },
  { label: "Glass Carafe", url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80" },
  { label: "Terracotta Planter", url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80" },
  { label: "Walnut Board", url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
];

export default function ImageUploader({
  value,
  onChange,
  label = "Product Photography",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file (PNG, JPG, WebP).");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#33463a" }}>{label}</span>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          style={{
            background: "none",
            border: "none",
            fontSize: "12px",
            color: "#2c6b45",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {showPresets ? "✕ Close presets" : "📷 Pick from Studio Library"}
        </button>
      </div>

      {/* Preset Picker */}
      {showPresets && (
        <div
          style={{
            background: "#f4efe2",
            border: "1px solid #e1e7df",
            borderRadius: "8px",
            padding: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          {PRESET_STUDIO_PHOTOS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                onChange(p.url);
                setShowPresets(false);
              }}
              style={{
                border: value === p.url ? "2px solid #17372e" : "1px solid #d8e0d6",
                borderRadius: "6px",
                overflow: "hidden",
                cursor: "pointer",
                padding: 0,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img src={p.url} alt="" style={{ width: "100%", height: "54px", objectFit: "cover" }} />
              <small style={{ fontSize: "10px", padding: "3px 4px", color: "#17372e", fontWeight: "bold" }}>
                {p.label}
              </small>
            </button>
          ))}
        </div>
      )}

      {/* Drag-and-drop Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? "#2c6b45" : "#d8e0d6"}`,
          background: isDragging ? "#edf4da" : "#fff",
          borderRadius: "10px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
            height: "100%",
          }}
        />

        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
            <img
              src={value}
              alt="Preview"
              style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "1px solid #d8e0d6" }}
            />
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: "13px", color: "#1f3529", display: "block" }}>Image loaded &amp; ready</b>
              <small style={{ color: "#8a978c", fontSize: "12px" }}>Click or drag a new file here to replace</small>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              style={{
                background: "#fbeeea",
                border: "1px solid #f2d4cc",
                color: "#b0402f",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "24px", marginBottom: "4px" }}>📸</div>
            <b style={{ fontSize: "13px", color: "#1f3529", display: "block" }}>
              {uploading ? "Processing photo…" : "Drop high-res photo here, or click to browse"}
            </b>
            <small style={{ color: "#8a978c", fontSize: "11px" }}>Supports PNG, JPG, WebP (up to 10MB)</small>
          </div>
        )}
      </div>
    </div>
  );
}
