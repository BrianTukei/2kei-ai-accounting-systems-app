import React, { useState, useRef, useCallback } from "react";

const ACCENT = "#F0B429";
const DARK = "#0D1117";
const CARD = "#161B22";
const BORDER = "#30363D";
const TEXT = "#E6EDF3";
const MUTED = "#8B949E";
const SUCCESS = "#3FB950";
const ERROR = "#F85149";

const styles = {
  "@import": `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap')`,
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${DARK}; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .fade-up { animation: fadeUp 0.4s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.4s 0.1s ease forwards; opacity: 0; }
  .fade-up-3 { animation: fadeUp 0.4s 0.2s ease forwards; opacity: 0; }
  .fade-up-4 { animation: fadeUp 0.4s 0.3s ease forwards; opacity: 0; }

  .drop-zone {
    border: 2px dashed ${BORDER};
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .drop-zone:hover, .drop-zone.dragging {
    border-color: ${ACCENT};
    background: rgba(240,180,41,0.05);
  }
  .btn-primary {
    background: ${ACCENT};
    color: #0D1117;
    border: none;
    border-radius: 8px;
    padding: 12px 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.5px;
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent;
    color: ${MUTED};
    border: 1px solid ${BORDER};
    border-radius: 8px;
    padding: 10px 20px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-ghost:hover { color: ${TEXT}; border-color: ${MUTED}; }

  .field-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid ${BORDER};
  }
  .field-row:last-child { border-bottom: none; }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
  }
  .tag-success { background: rgba(63,185,80,0.15); color: ${SUCCESS}; }
  .tag-warn { background: rgba(240,180,41,0.15); color: ${ACCENT}; }
  .tag-error { background: rgba(248,81,73,0.15); color: ${ERROR}; }

  .line-item-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .line-item-row:hover { background: rgba(255,255,255,0.03); }

  .skeleton {
    background: linear-gradient(90deg, ${CARD} 25%, #1e252e 50%, ${CARD} 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${CARD}; }
  ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
\`;

const LOGO = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill={ACCENT} />
    <path d="M8 24V8l6 5 6-5v16" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 16h4" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const Spinner = () => (
  <div style={{
    width: 20, height: 20,
    border: \`2px solid \${BORDER}\`,
    borderTop: \`2px solid \${ACCENT}\`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block"
  }} />
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function InvoiceProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    if (f.type !== "application/pdf") {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("pdf");
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const processInvoice = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = () => rej(new Error("File read failed"));
        reader.readAsDataURL(file);
      });

      const isPDF = file.type === "application/pdf";
      const contentBlock = isPDF
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: file.type, data: base64 } };

      const prompt = \`You are an expert accounting AI. Analyze this invoice or receipt and extract all data.
Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vendor": "string",
  "vendor_address": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "string or null",
  "due_date": "string or null",
  "bill_to": "string or null",
  "line_items": [
    { "description": "string", "quantity": "string or null", "unit_price": "string or null", "amount": "string" }
  ],
  "subtotal": "string or null",
  "tax": "string or null",
  "tax_rate": "string or null",
  "discount": "string or null",
  "total": "string",
  "currency": "string",
  "payment_method": "string or null",
  "notes": "string or null",
  "confidence": "high | medium | low"
}
If any field cannot be determined, use null. Always include line_items array (can be empty). Return only the JSON.\`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "", 
          "anthropic-version": "2023-06-01",
          "anthropic-dangerously-allow-browser": "true" 
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1000,
          messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(\`API returned \${response.status}\`);
      }

      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err: any) {
      setError("Failed to process the invoice. Please try again or check that your file is a clear invoice/receipt image.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const confidenceTag = (c: string) => {
    if (c === "high") return <span className="tag tag-success"><CheckIcon /> High confidence</span>;
    if (c === "medium") return <span className="tag tag-warn">⚡ Medium confidence</span>;
    return <span className="tag tag-error">⚠ Low confidence</span>;
  };

  return (
    <>
      <style>{css}</style>
      <div style={{
        minHeight: "100vh",
  return null;
}