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
        background: DARK,
        fontFamily: "'Syne', sans-serif",
        color: TEXT,
        padding: "0 0 60px"
      }}>
        {/* Header */}
        <div style={{
          borderBottom: \`1px solid \${BORDER}\`,
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: CARD
        }}>
          <LOGO />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>
              2K AI Accounting
            </div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
              Invoice & Receipt Processor
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span className="tag tag-success" style={{ fontSize: 10 }}>
              <CheckIcon /> AI Active
            </span>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>
              Invoice Processing
            </h1>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
              Upload an invoice or receipt — Claude AI will extract all key financial data automatically.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            {/* Left: Upload */}
            <div className="fade-up-2">
              <div style={{
                background: CARD,
                border: \`1px solid \${BORDER}\`,
                borderRadius: 12,
                overflow: "hidden"
              }}>
                <div style={{ padding: "20px 24px", borderBottom: \`1px solid \${BORDER}\` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED }}>
                    Document Upload
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  {!file ? (
                    <div
                      className={\`drop-zone \${dragging ? "dragging" : ""}\`}
                      style={{ padding: "48px 24px", textAlign: "center" }}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => fileRef.current?.click()}
                    >
                      <UploadIcon />
                      <div style={{ marginTop: 16, fontWeight: 700, fontSize: 15 }}>
                        Drop your invoice here
                      </div>
                      <div style={{ color: MUTED, fontSize: 12, marginTop: 8 }}>
                        JPG, PNG, WEBP, PDF supported
                      </div>
                      <div style={{
                        marginTop: 20,
                        display: "inline-block",
                        padding: "8px 20px",
                        border: \`1px solid \${BORDER}\`,
                        borderRadius: 8,
                        fontSize: 12,
                        color: MUTED,
                        cursor: "pointer"
                      }}>
                        Browse files
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: "none" }}
                        onChange={e => handleFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  ) : (
                    <div>
                      {preview && preview !== "pdf" ? (
                        <img
                          src={preview}
                          alt="Invoice preview"
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            border: \`1px solid \${BORDER}\`,
                            maxHeight: 320,
                            objectFit: "contain",
                            background: "#1a1f27"
                          }}
                        />
                      ) : (
                        <div style={{
                          background: "#1a1f27",
                          border: \`1px solid \${BORDER}\`,
                          borderRadius: 8,
                          padding: "40px 20px",
                          textAlign: "center"
                        }}>
                          <div style={{ fontSize: 40 }}>📄</div>
                          <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>
                            {file.name}
                          </div>
                          <div style={{ color: MUTED, fontSize: 12, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                            {(file.size / 1024).toFixed(1)} KB · PDF
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                        <button
                          className="btn-primary"
                          onClick={processInvoice}
                          disabled={loading}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        >
                          {loading ? <><Spinner /> Processing…</> : "⚡ Extract Data"}
                        </button>
                        <button className="btn-ghost" onClick={reset}>
                          Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      background: "rgba(248,81,73,0.1)",
                      border: \`1px solid rgba(248,81,73,0.3)\`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: ERROR
                    }}>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div style={{
                marginTop: 16,
                padding: "16px 20px",
                background: "rgba(240,180,41,0.06)",
                border: \`1px solid rgba(240,180,41,0.2)\`,
                borderRadius: 12
              }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: ACCENT, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tips for best results
                </div>
                {["Ensure the document is well-lit and in focus", "All text should be legible and not cut off", "Works with printed & digital invoices/receipts"].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: MUTED, alignItems: "flex-start" }}>
                    <span style={{ color: ACCENT, marginTop: 1 }}>→</span> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div className="fade-up-3">
              <div style={{
                background: CARD,
                border: \`1px solid \${BORDER}\`,
                borderRadius: 12,
                overflow: "hidden",
                minHeight: 420
              }}>
                <div style={{
                  padding: "20px 24px",
                  borderBottom: \`1px solid \${BORDER}\`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED }}>
                    Extracted Data
                  </div>
                  {result && (
                    <button
                      className="btn-ghost"
                      onClick={copyJSON}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12 }}
                    >
                      {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy JSON</>}
                    </button>
                  )}
                </div>

                <div style={{ padding: 24 }}>
                  {loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <Spinner />
                        <span style={{ color: MUTED, fontSize: 13 }}>Claude is analyzing your document…</span>
                      </div>
                      {[80, 60, 90, 50, 70].map((w, i) => (
                        <div key={i} className="skeleton" style={{ height: 18, width: \`\${w}%\` }} />
                      ))}
                    </div>
                  )}

                  {!loading && !result && (
                    <div style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: MUTED
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>No data yet</div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>Upload a document and click Extract Data</div>
                    </div>
                  )}

                  {result && !loading && (
                    <div style={{ animation: "fadeUp 0.4s ease" }}>
                      {/* Confidence + Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: \`1px solid \${BORDER}\` }}>
                        <div>
                          <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Total Amount</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{result.currency} {result.total || 'N/A'}</div>
                        </div>
                        <div>
                          {confidenceTag(result.confidence)}
                        </div>
                      </div>

                      {/* Key Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Vendor</div>
                          <div style={{ fontWeight: 600 }}>{result.vendor || 'Unknown'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Invoice No.</div>
                          <div style={{ fontWeight: 600 }}>{result.invoice_number || 'N/A'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                          <div style={{ fontWeight: 600 }}>{result.invoice_date || 'N/A'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Due Date</div>
                          <div style={{ fontWeight: 600 }}>{result.due_date || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Line Items */}
                      {result.line_items && result.line_items.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottom: \`1px solid \${BORDER}\` }}>
                            Line Items
                          </div>
                          {result.line_items.map((item: any, idx: number) => (
                            <div key={idx} className="line-item-row">
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.description}</div>
                              </div>
                              <div style={{ fontSize: 13, color: MUTED }}>
                                {item.quantity ? \`\${item.quantity} × \` : ''}{item.currency || result.currency} {item.unit_price || ''}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>
                                {item.currency || result.currency} {item.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8 }}>
                        <div className="field-row">
                          <span style={{ fontSize: 13, color: MUTED }}>Subtotal</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{result.currency} {result.subtotal || '0.00'}</span>
                        </div>
                        <div className="field-row">
                          <span style={{ fontSize: 13, color: MUTED }}>Tax ({result.tax_rate || '0%'})</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{result.currency} {result.tax || '0.00'}</span>
                        </div>
                        {result.discount && (
                          <div className="field-row">
                            <span style={{ fontSize: 13, color: MUTED }}>Discount</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: SUCCESS }}>-{result.currency} {result.discount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}