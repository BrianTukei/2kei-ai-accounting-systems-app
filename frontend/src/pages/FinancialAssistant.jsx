import { useState, useRef, useEffect, useCallback } from "react";

const SYSTEM_PROMPT = `You are 2KEI AI \u2014 the intelligent financial co-pilot of 2K AI Accounting Systems.
You operate as a CFO-grade financial analyst, forensic accountant, tax strategist,
and business intelligence engine combined into one.

IDENTITY & ROLE:
- Name: 2KEI AI, core intelligence of 2K AI Accounting Systems
- Role: Elite AI CFO, Financial Analyst, Tax Strategist, Risk Officer
- Depth: Big 4 accounting firm precision + Fortune 500 CFO strategy
- Tone: Direct, data-driven, clear \u2014 like a trusted senior financial advisor

DOCUMENT ANALYSIS \u2014 When a file or image is uploaded, immediately:
1. Identify the document type (invoice, receipt, bank statement, P&L, balance sheet, tax doc, payroll, contract, CSV data, etc.)
2. Extract ALL financial figures, dates, parties, line items, totals
3. Flag any anomalies, missing fields, math errors, or red flags
4. Provide actionable insights specific to that document type:
   INVOICES: payment terms, due dates, amounts, tax, discounts, late fee risk, AR aging impact
   RECEIPTS: expense category, deductibility, tax implications, coding recommendation
   BANK STATEMENTS: cash flow summary, unusual transactions, burn rate, runway, spending patterns
   P&L STATEMENTS: compute all margins, flag compression, YoY comparison if multi-period, benchmark
   BALANCE SHEETS: liquidity/leverage ratios, solvency assessment, working capital health
   TAX DOCUMENTS: deductions taken vs missed, compliance flags, optimization opportunities
   CONTRACTS: payment terms, financial obligations, penalty clauses, revenue recognition timing
   PAYROLL REPORTS: payroll-to-revenue ratio, misclassification risks, benefit cost analysis
   CSV/SPREADSHEET DATA: parse all numbers, compute trends, flag outliers, build mini-forecast

FINANCIAL HEALTH SCORING (0-100) across 6 weighted pillars:
Pillar 1 Liquidity (20%): Current Ratio, Quick Ratio, Cash Ratio, Operating CF Ratio
Pillar 2 Profitability (20%): Gross Margin, Net Margin, EBITDA Margin, ROE, ROA, ROCE
Pillar 3 Efficiency (15%): Asset Turnover, DSO, DPO, Inventory Turns, Cash Conversion Cycle
Pillar 4 Leverage (20%): D/E, D/A, Interest Coverage, Net Debt/EBITDA, Altman Z-Score (<1.81=distress)
Pillar 5 Cash Flow Quality (15%): Operating CF/Net Income, Free Cash Flow, CF Conversion Rate
Pillar 6 Growth Trajectory (10%): YoY Revenue, Margin Expansion/Compression, Cost Scaling

ANOMALY & RISK DETECTION \u2014 auto-flag:
🔴 CRITICAL: expense spike >15% MoM, AR aging >60 days, Z-Score <1.81, revenue irregularities, negative FCF 2+ periods
🟡 WATCH: margin compression 2+ periods, customer concentration >30%, rising payroll ratio, declining cash

TAX INTELLIGENCE: Section 179, Bonus Depreciation, R&D Credits (Sec 41), QBI Deduction,
SEP-IRA/Solo 401k/SIMPLE IRA, S-Corp election timing, quarterly estimated taxes, safe harbor rules,
home office, vehicle, travel deductions, health insurance deductions, employee vs contractor classification

SCENARIO MODELING: Bear/Base/Bull cases with sensitivity (5/10/20% revenue swings on gross profit,
net income, cash position). Break-even = Fixed Costs / Gross Margin %. Unit economics: CAC, LTV, LTV:CAC >3:1

INDUSTRY BENCHMARKS:
SaaS/Tech: GM 70-85%, EBITDA 20-30%, LTV:CAC >3:1, ARR Growth >30%
Retail: GM 30-50%, Inventory 8-12x/yr, Net Margin 2-6%, DSO <15d
Manufacturing: GM 25-40%, Asset Util >75%, Inventory Days 30-60, Net Margin 5-10%
Services: GM 50-70%, Util Rate >75%, Rev/Employee $150-300K, DSO 30-45d
Healthcare: EBITDA 10-20%, Days AR <50, track payer mix
Restaurants: F&B 28-35%, Labor 30-35%, EBITDA 10-15%, Prime Cost <60%

OUTPUT STRUCTURE for full analysis:
1. Executive Summary (2-3 sentences, most critical finding FIRST)
2. Financial Health Score: XX/100 with pillar breakdown
3. 🔴 CRITICAL ISSUES (act within 30 days) | 🟡 WATCH ITEMS (90 days) | 🟢 STRENGTHS | 🚀 GROWTH LEVERS
4. 90-Day Action Plan: 3 actions with owner, deadline, dollar/percent impact

HARD RULES:
- Never fabricate numbers. Show formula + calculation for every ratio computed.
- Quantify every recommendation: "$47K recoverable cash" not "some cash"
- For uploaded documents: EXTRACT data first, THEN analyze \u2014 never skip extraction step
- Always close full analysis with exactly 3 THIS-WEEK priority actions
- Never confuse revenue vs profit, cash vs income, gross vs net`;

const QUICK_PROMPTS = [
  { icon: "📊", label: "Health Score", prompt: "Analyze my overall financial health and give me a detailed score across all 6 pillars with corrective actions." },
  { icon: "💰", label: "Cash Flow", prompt: "Analyze my cash flow in full. What is my runway and how do I optimize working capital?" },
  { icon: "📈", label: "Profitability", prompt: "Break down all my profitability metrics and margins vs industry benchmarks." },
  { icon: "⚠️", label: "Risk Scan", prompt: "Perform a full anomaly and risk scan. Flag every issue with 🔴/🟡 priority levels." },
  { icon: "🧾", label: "Tax Strategy", prompt: "What tax strategies should I be using right now? List everything I might be missing." },
  { icon: "🔮", label: "Forecast", prompt: "Build a Bear/Base/Bull 12-month financial forecast with sensitivity analysis." },
  { icon: "⚡", label: "Key Ratios", prompt: "Calculate all 30+ financial ratios with formulas, benchmarks, and corrective actions." },
  { icon: "🚀", label: "Growth Plan", prompt: "Identify my top 3 growth levers with projections and a 90-day action plan." },
  { icon: "🏭", label: "Benchmark", prompt: "Benchmark my business metrics against my industry. Where do I rank vs competitors?" },
  { icon: "💼", label: "Break-Even", prompt: "Calculate my exact break-even point and show sensitivity to price and cost changes." },
];

const CALC_META = {
  breakeven: { label: "Break-Even", icon: "⚖️" },
  roi: { label: "ROI", icon: "📈" },
  loan: { label: "Loan Payment", icon: "🏦" },
  margin: { label: "Margins", icon: "💹" },
  cashrunway: { label: "Cash Runway", icon: "🛫" },
  ltvcac: { label: "LTV : CAC", icon: "🎯" },
};

const CALC_FIELDS = {
  breakeven: [["fixedCosts","Monthly Fixed Costs ($)"],["grossMarginPct","Gross Margin (%)"],["pricePerUnit","Price Per Unit ($)"],["varCostPerUnit","Variable Cost Per Unit ($)"]],
  roi: [["investment","Total Investment ($)"],["netProfit","Net Profit ($)"],["periodMonths","Period (months)"]],
  loan: [["principal","Loan Amount ($)"],["annualRate","Annual Interest Rate (%)"],["termMonths","Term (months)"]],
  margin: [["revenue","Revenue ($)"],["cogs","Cost of Goods Sold ($)"],["opex","Operating Expenses ($)"]],
  cashrunway: [["cashBalance","Current Cash Balance ($)"],["monthlyBurn","Monthly Burn Rate ($)"]],
  ltvcac: [["avgRevPerCustomer","Avg Monthly Revenue / Customer ($)"],["grossMarginPct","Gross Margin (%)"],["churnRatePct","Monthly Churn Rate (%)"],["cac","Customer Acquisition Cost ($)"]],
};

const G = "#c9a84c";
const GL = "#e8c96a";
const GD = "rgba(201,168,76,0.13)";
const GB = "rgba(201,168,76,0.24)";
const BG = "#0e0c08";
const SF = "rgba(255,255,255,0.04)";
const TX = "#c8c2b8";
const MN = "'DM Mono','Courier New',monospace";

function CalcInput({ label, field, value, onChange }) {
  return (
    <div>
      <label style={{ display:"block", color:"#6b6355", fontSize:"0.7rem", fontFamily:MN, letterSpacing:"0.06em", marginBottom:"4px", textTransform:"uppercase" }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(field, e.target.value)} placeholder="0"
        style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${GB}`, borderRadius:"8px", padding:"9px 12px", color:GL, fontSize:"0.875rem", outline:"none", fontFamily:"Georgia,serif", boxSizing:"border-box" }} />
    </div>
  );
}

export default function FinancialAssistant() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `**Welcome to 2KEI AI \u2014 2K Accounting Systems** 🧠

I'm your intelligent financial co-pilot with CFO-grade analysis capabilities.

**Upload any financial document for instant analysis:**
- 📄 Invoices & Receipts \u2192 extraction + categorization + deductibility
- 🏦 Bank Statements \u2192 cash flow patterns + anomaly detection + runway
- 📊 P&L / Balance Sheets \u2192 full ratio analysis + health scoring + benchmarks
- 📋 Tax Documents \u2192 deduction audit + missed opportunities + compliance
- 📁 CSV / Spreadsheets \u2192 trend analysis + outlier detection + forecasting
- 🖼️ Any image of financial data \u2192 full extraction + CFO analysis

**Or type your financials and ask me anything.**

*I compute real numbers and give actionable intelligence \u2014 not generic advice.*`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [calcTab, setCalcTab] = useState("breakeven");
  const [calcInputs, setCalcInputs] = useState({
    breakeven: { fixedCosts:"", grossMarginPct:"", pricePerUnit:"", varCostPerUnit:"" },
    roi: { investment:"", netProfit:"", periodMonths:"12" },
    loan: { principal:"", annualRate:"", termMonths:"" },
    margin: { revenue:"", cogs:"", opex:"" },
    cashrunway: { cashBalance:"", monthlyBurn:"" },
    ltvcac: { avgRevPerCustomer:"", grossMarginPct:"", churnRatePct:"", cac:"" },
  });
  const [calcResults, setCalcResults] = useState({});
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const fmtSize = b => b > 1048576 ? `${(b/1048576).toFixed(1)}MB` : `${(b/1024).toFixed(0)}KB`;

  const processFile = useCallback((file) => new Promise(resolve => {
    const reader = new FileReader();
    const isImg = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    const isTxt = file.type.includes("text") || /\.(csv|txt|tsv)$/i.test(file.name);
    if (isImg || isPDF) {
      reader.onload = e => resolve({ name:file.name, type:file.type, base64:e.target.result.split(",")[1], isImg, isPDF, size:file.size });
      reader.readAsDataURL(file);
    } else if (isTxt) {
      reader.onload = e => resolve({ name:file.name, type:file.type, text:e.target.result, isTxt:true, size:file.size });
      reader.readAsText(file);
    } else {
      reader.onload = e => resolve({ name:file.name, type:file.type, base64:e.target.result.split(",")[1], size:file.size });
      reader.readAsDataURL(file);
    }
  }), []);

  const addFiles = useCallback(async (files) => {
    const processed = await Promise.all(Array.from(files).map(processFile));
    setPendingFiles(p => [...p, ...processed]);
  }, [processFile]);

  const buildContent = (text, files) => {
    if (!files?.length) return text;
    const parts = [];
    for (const f of files) {
      if (f.isImg) parts.push({ type:"image", source:{ type:"base64", media_type:f.type, data:f.base64 } });
      else if (f.isPDF) parts.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:f.base64 } });
      else if (f.isTxt) parts.push({ type:"text", text:`--- FILE: ${f.name} ---\n${f.text.slice(0,8000)}\n--- END ---` });
    }
    parts.push({ type:"text", text: text || `Analyze the uploaded file(s) completely. Identify the document type, extract ALL financial data, flag anomalies, compute relevant ratios, compare to benchmarks, and give a CFO-grade analysis with a prioritized 90-day action plan.` });
    return parts;
  };

  const sendMessage = async (text) => {
    const t = text || input.trim();
    if ((!t && !pendingFiles.length) || loading) return;
    const files = [...pendingFiles];
    const displayText = t || `\ud83d\udcce Analyzing ${files.length} uploaded file(s)\u2026`;
    setMessages(p => [...p, { role:"user", content:displayText, fileNames:files.map(f=>f.name) }]);
    setInput(""); setPendingFiles([]); setLoading(true);
    const msgContent = buildContent(t, files);
    const newHist = [...history, { role:"user", content:msgContent }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerously-allow-browser": "true"},
        body: JSON.stringify({ model:"claude-3-5-sonnet-20241022", max_tokens:1000, system:SYSTEM_PROMPT, messages:newHist }),
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("\n") || "\u26a0\ufe0f No response received.";
      setMessages(p => [...p, { role:"assistant", content:reply }]);
      setHistory([...newHist, { role:"assistant", content:reply }]);
    } catch {
      setMessages(p => [...p, { role:"assistant", content:"\u26a0\ufe0f Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const setCI = (field, val) => setCalcInputs(p => ({ ...p, [calcTab]:{ ...p[calcTab], [field]:val } }));

  const runCalc = () => {
    const i = calcInputs[calcTab];
    let r = {};
    const n = k => parseFloat(i[k]) || 0;
    if (calcTab === "breakeven") {
      const fc=n("fixedCosts"), gm=n("grossMarginPct")/100, p=n("pricePerUnit"), vc=n("varCostPerUnit");
      const bepRev = gm>0 ? fc/gm : 0;
      const cm = p - vc;
      const bepUnits = cm>0 ? Math.ceil(fc/cm) : "∞";
      r = { "Break-Even Revenue":`$${bepRev.toLocaleString(undefined,{maximumFractionDigits:0})}`, "Break-Even Units":`${typeof bepUnits==="number"?bepUnits.toLocaleString():bepUnits}`, "Contribution Margin":`$${cm.toFixed(2)} / unit`, "Safety Margin":"Calculate actual revenue \u2212 break-even" };
    } else if (calcTab === "roi") {
      const inv=n("investment")||1, np=n("netProfit"), mo=n("periodMonths")||12;
      r = { "ROI":`${((np/inv)*100).toFixed(1)}%`, "Annualized ROI":`${((np/inv)*(12/mo)*100).toFixed(1)}%`, "Net Profit":`$${np.toLocaleString()}`, "Payback Period":`${(inv/(np/mo)).toFixed(1)} months` };
    } else if (calcTab === "loan") {
      const p=n("principal"), rate=n("annualRate")/100/12, tm=n("termMonths");
      const pmt = rate>0&&tm>0 ? p*rate*Math.pow(1+rate,tm)/(Math.pow(1+rate,tm)-1) : (tm>0?p/tm:0);
      const total=pmt*tm;
      r = { "Monthly Payment":`$${pmt.toFixed(2)}`, "Total Paid":`$${total.toLocaleString(undefined,{maximumFractionDigits:0})}`, "Total Interest":`$${(total-p).toLocaleString(undefined,{maximumFractionDigits:0})}`, "Interest Rate (monthly)":`${(n("annualRate")/12).toFixed(2)}%` };
    } else if (calcTab === "margin") {
      const rev=n("revenue")||1, cogs=n("cogs"), opex=n("opex");
      const gp=rev-cogs, np=rev-cogs-opex;
      r = { "Gross Margin":`${(gp/rev*100).toFixed(1)}%`, "Net Margin":`${(np/rev*100).toFixed(1)}%`, "Gross Profit":`$${gp.toLocaleString(undefined,{maximumFractionDigits:0})}`, "Net Profit":`$${np.toLocaleString(undefined,{maximumFractionDigits:0})}`, "EBITDA (est.)":`$${np.toLocaleString(undefined,{maximumFractionDigits:0})}` };
    } else if (calcTab === "cashrunway") {
      const cash=n("cashBalance"), burn=n("monthlyBurn")||1;
      const months=(cash/burn);
      const status = months<3?"🔴 CRITICAL":months<6?"🟡 AT RISK":months<12?"🟡 WATCH":"🟢 HEALTHY";
      const zeroDate = new Date(Date.now()+months*30*86400000);
      r = { "Runway":`${months.toFixed(1)} months`, "Status":status, "Zero Cash Date":zeroDate.toLocaleDateString("en-US",{month:"short",year:"numeric"}), "Monthly Burn":`$${burn.toLocaleString()}` };
    } else if (calcTab === "ltvcac") {
      const rev=n("avgRevPerCustomer"), gm=n("grossMarginPct")/100, churn=n("churnRatePct")/100, cac=n("cac")||1;
      const ltv = churn>0 ? (rev*gm)/churn : 0;
      const ratio = ltv/cac;
      const payback = cac/(rev*gm)||0;
      const status = ratio>=3?"🟢 HEALTHY":ratio>=1?"🟡 WATCH":"🔴 CRITICAL";
      r = { "Customer LTV":`$${ltv.toFixed(0)}`, "LTV : CAC Ratio":`${ratio.toFixed(2)} : 1`, "Status":status, "Payback Period":`${payback.toFixed(1)} months`, "Target LTV:CAC":">3:1" };
    }
    setCalcResults(p => ({ ...p, [calcTab]:r }));
  };

  const fmtMsg = (text) => text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{height:"5px"}} />;
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) return <p key={i} style={{color:GL,fontWeight:700,margin:"10px 0 4px",fontSize:"0.88rem"}}>{line.slice(2,-2)}</p>;
    if (/^#{1,3}\s/.test(line)) return <h3 key={i} style={{color:G,fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"14px 0 5px",fontFamily:MN}}>{line.replace(/^#+\s/,"")}</h3>;
    if (/^(-|\u2022)\s/.test(line)) { const c=line.slice(2).replace(/\*\*(.*?)\*\*/g,(_,m)=>`<strong style="color:${GL}">${m}</strong>`); return <div key={i} style={{display:"flex",gap:"8px",margin:"3px 0",paddingLeft:"4px"}}><span style={{color:G,flexShrink:0}}>▸</span><span dangerouslySetInnerHTML={{__html:c}} style={{color:TX,fontSize:"0.875rem",lineHeight:1.6}}/></div>; }
    if (/^\d+\./.test(line)) { const num=line.match(/^\d+/)[0]; const c=line.replace(/^\d+\.\s*/,"").replace(/\*\*(.*?)\*\*/g,(_,m)=>`<strong style="color:${GL}">${m}</strong>`); return <div key={i} style={{display:"flex",gap:"10px",margin:"4px 0"}}><span style={{color:G,fontFamily:MN,fontSize:"0.8rem",flexShrink:0}}>{num}.</span><span dangerouslySetInnerHTML={{__html:c}} style={{color:TX,fontSize:"0.875rem",lineHeight:1.6}}/></div>; }
    if (/^-{3,}$/.test(line.trim())) return <hr key={i} style={{border:"none",borderTop:`1px solid ${GB}`,margin:"10px 0"}}/>;
    const c = line.replace(/\*\*(.*?)\*\*/g,(_,m)=>`<strong style="color:${GL}">${m}</strong>`).replace(/`(.*?)`/g,(_,m)=>`<code style="background:${GD};color:${GL};padding:1px 5px;border-radius:3px;font-size:0.82rem;font-family:${MN}">${m}</code>`);
    return <p key={i} dangerouslySetInnerHTML={{__html:c}} style={{margin:"3px 0",color:TX,fontSize:"0.875rem",lineHeight:1.65}}/>;
  });

  const TABS = [["chat","💬 Chat"],["upload","📎 Upload"],["calculators","🧮 Calc"],["notes","📝 Notes"]];

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:"600px",height:"600px",borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"400px",height:"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.03) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(201,168,76,0.04) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:0.4}}/>
      </div>

      {/* Header */}
      <header style={{position:"relative",zIndex:10,padding:"12px 20px",borderBottom:`1px solid ${GB}`,background:"rgba(14,12,8,0.97)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"9px",background:`linear-gradient(135deg,${G},#8a6a1e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",boxShadow:`0 0 18px rgba(201,168,76,0.3)`}}>⬡</div>
          <div>
            <div style={{color:GL,fontSize:"1rem",fontWeight:700,letterSpacing:"0.04em"}}>2KEI AI</div>
            <div style={{color:"#4a4035",fontSize:"0.62rem",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:MN}}>2K Accounting Systems</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"3px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",padding:"3px",border:`1px solid ${GB}`}}>
          {TABS.map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 13px",borderRadius:"7px",border:"none",cursor:"pointer",fontSize:"0.7rem",fontFamily:MN,letterSpacing:"0.03em",transition:"all 0.18s",background:tab===t?`linear-gradient(135deg,${G},#8a6a1e)`:"transparent",color:tab===t?"#fff":G,fontWeight:tab===t?700:400}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 7px #4ade80",animation:"pulse 2s infinite"}}/>
          <span style={{color:"#3a3028",fontSize:"0.62rem",letterSpacing:"0.1em",fontFamily:MN}}>ACTIVE</span>
        </div>
      </header>

      {/* ═══ CHAT TAB ═══ */}
      {tab === "chat" && (<>
        <div style={{position:"relative",zIndex:10,display:"flex",gap:"6px",overflowX:"auto",padding:"9px 18px",borderBottom:`1px solid rgba(201,168,76,0.1)`,background:"rgba(14,12,8,0.8)",scrollbarWidth:"none"}}>
          {QUICK_PROMPTS.map(qp => (
            <button key={qp.label} onClick={()=>sendMessage(qp.prompt)} disabled={loading}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:"4px",padding:"5px 11px",borderRadius:"20px",background:GD,border:`1px solid ${GB}`,color:G,fontSize:"0.7rem",cursor:"pointer",letterSpacing:"0.03em",whiteSpace:"nowrap",transition:"all 0.18s",fontFamily:MN}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.22)";e.currentTarget.style.borderColor="rgba(201,168,76,0.5)"}}
              onMouseLeave={e=>{e.currentTarget.style.background=GD;e.currentTarget.style.borderColor=GB}}>
              {qp.icon} {qp.label}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"18px 22px",position:"relative",zIndex:5,scrollbarWidth:"thin",scrollbarColor:`rgba(201,168,76,0.2) transparent`}}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:"16px"}}>
              {msg.role==="assistant" && (
                <div style={{width:"27px",height:"27px",borderRadius:"7px",flexShrink:0,background:`linear-gradient(135deg,${G},#8a6a1e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",marginRight:"9px",alignSelf:"flex-start",marginTop:"2px"}}>⬡</div>
              )}
              <div style={{maxWidth:"84%",padding:msg.role==="user"?"9px 14px":"14px 17px",borderRadius:msg.role==="user"?"17px 17px 4px 17px":"4px 17px 17px 17px",background:msg.role==="user"?`linear-gradient(135deg,rgba(201,168,76,0.18),rgba(201,168,76,0.09))`:SF,border:msg.role==="user"?`1px solid ${GB}`:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(8px)"}}>
                {msg.fileNames?.length > 0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"7px"}}>
                    {msg.fileNames.map(f => <span key={f} style={{background:GD,border:`1px solid ${GB}`,borderRadius:"6px",padding:"2px 7px",fontSize:"0.68rem",color:G,fontFamily:MN}}>📎 {f}</span>)}
                  </div>
                )}
                {msg.role==="user" ? <p style={{color:GL,margin:0,fontSize:"0.875rem",lineHeight:1.6}}>{msg.content}</p> : <div>{fmtMsg(msg.content)}</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"16px"}}>
              <div style={{width:"27px",height:"27px",borderRadius:"7px",background:`linear-gradient(135deg,${G},#8a6a1e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>⬡</div>
              <div style={{padding:"11px 16px",borderRadius:"4px 17px 17px 17px",background:SF,border:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:"5px",alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:G,opacity:0.4,animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {pendingFiles.length > 0 && (
          <div style={{position:"relative",zIndex:10,padding:"7px 22px",background:"rgba(14,12,8,0.9)",borderTop:`1px solid ${GB}`,display:"flex",flexWrap:"wrap",gap:"7px"}}>
            {pendingFiles.map((f,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:"5px",background:GD,border:`1px solid ${GB}`,borderRadius:"7px",padding:"3px 9px"}}>
                <span style={{fontSize:"0.7rem",color:G,fontFamily:MN}}>📎 {f.name} ({fmtSize(f.size)})</span>
                <button onClick={()=>setPendingFiles(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#6b4a25",cursor:"pointer",fontSize:"0.72rem",padding:"0 2px",lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{position:"relative",zIndex:10,padding:"11px 22px 16px",borderTop:`1px solid rgba(201,168,76,0.14)`,background:"rgba(14,12,8,0.97)",backdropFilter:"blur(10px)"}}>
          <div style={{display:"flex",gap:"9px",alignItems:"flex-end",background:SF,border:`1px solid ${GB}`,borderRadius:"13px",padding:"9px 12px"}}
            onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);}}>
            <button onClick={()=>fileInputRef.current?.click()} title="Attach file" style={{width:"32px",height:"32px",borderRadius:"7px",background:GD,border:`1px solid ${GB}`,color:G,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",flexShrink:0,transition:"all 0.18s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.24)"}
              onMouseLeave={e=>e.currentTarget.style.background=GD}>📎</button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.csv,.txt,.xlsx,.xls,.tsv" style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
              placeholder="Ask anything, share numbers, or drop a file to analyze\u2026 (Shift+Enter for new line)"
              rows={1} style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e8d5a0",fontSize:"0.875rem",lineHeight:1.6,resize:"none",fontFamily:"Georgia,serif",maxHeight:"110px",overflowY:"auto",scrollbarWidth:"none"}}
              onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,110)+"px"}}/>
            <button onClick={()=>sendMessage()} disabled={loading||(!input.trim()&&!pendingFiles.length)}
              style={{width:"32px",height:"32px",borderRadius:"8px",flexShrink:0,background:(input.trim()||pendingFiles.length)&&!loading?`linear-gradient(135deg,${G},#8a6a1e)`:GD,border:"none",cursor:(input.trim()||pendingFiles.length)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s",fontSize:"13px",color:"#fff"}}>↑</button>
          </div>
          <p style={{color:"#252015",fontSize:"0.6rem",textAlign:"center",marginTop:"7px",letterSpacing:"0.06em",fontFamily:MN}}>2KEI AI \u00B7 2K ACCOUNTING SYSTEMS \u00B7 NOT LICENSED FINANCIAL ADVICE</p>
        </div>
      </>)}

      {/* ═══ UPLOAD TAB ═══ */}
      {tab === "upload" && (
        <div style={{flex:1,padding:"22px",overflowY:"auto",position:"relative",zIndex:5}}>
          <div style={{maxWidth:"680px",margin:"0 auto"}}>
            <h2 style={{color:GL,fontSize:"1.05rem",fontWeight:700,marginBottom:"4px"}}>Document Analysis Center</h2>
            <p style={{color:"#5a5040",fontSize:"0.77rem",marginBottom:"22px",fontFamily:MN}}>Upload any financial document for instant CFO-grade analysis</p>

            <div onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);setTab("chat");}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onClick={()=>uploadInputRef.current?.click()}
              style={{border:`2px dashed ${dragOver?"rgba(201,168,76,0.9)":GB}`,borderRadius:"16px",padding:"44px 22px",textAlign:"center",cursor:"pointer",background:dragOver?"rgba(201,168,76,0.07)":SF,transition:"all 0.22s",marginBottom:"22px"}}>
              <div style={{fontSize:"2.8rem",marginBottom:"10px", fontFamily:"sans-serif"}}>📂</div>
              <p style={{color:GL,fontSize:"0.92rem",fontWeight:700,margin:"0 0 5px"}}>Drop files here or click to browse</p>
              <p style={{color:"#5a5040",fontSize:"0.73rem",fontFamily:MN,margin:"0 0 14px"}}>PDF \u00B7 Images (JPG/PNG/WEBP) \u00B7 CSV \u00B7 Excel \u00B7 TXT</p>
              <span style={{background:`linear-gradient(135deg,${G},#8a6a1e)`,color:"#fff",padding:"9px 24px",borderRadius:"8px",fontSize:"0.78rem",fontFamily:MN,fontWeight:700}}>BROWSE FILES</span>
            </div>
            <input ref={uploadInputRef} type="file" multiple accept="image/*,.pdf,.csv,.txt,.xlsx,.xls,.tsv" style={{display:"none"}} onChange={e=>{addFiles(e.target.files);setTab("chat");}}/>

            <h3 style={{color:G,fontSize:"0.75rem",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:MN,marginBottom:"13px"}}>What 2KEI AI analyzes per document type</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"10px"}}>
              {[
                ["📄","Invoices","Payment terms, due dates, tax amounts, discount flags, AR aging impact, late fee risk"],
                ["🧾","Receipts","Expense category, deductibility status, tax coding, spend pattern analysis"],
                ["🏦","Bank Statements","Cash flow summary, anomalous transactions, burn rate, runway projection"],
                ["📊","P&L Statements","All margins, EBITDA, ratio computation, YoY trends, industry benchmark"],
                ["⚖️","Balance Sheets","Liquidity ratios, leverage, solvency, Altman Z-Score, working capital"],
                ["📋","Tax Documents","Deduction audit, missed opportunities, compliance red flags, optimization"],
                ["👥","Payroll Reports","Payroll-to-revenue ratio, misclassification risk, benefit cost breakdown"],
                ["📁","CSV / Spreadsheets","Trend detection, outlier flags, moving averages, mini-forecast, pivot insights"],
                ["📝","Contracts","Payment obligations, penalty clauses, revenue recognition timing, risk flags"],
                ["🖼️","Financial Images","Full OCR extraction + analysis of any photographed financial document"],
              ].map(([icon,title,desc]) => (
                <div key={title} style={{background:SF,border:`1px solid ${GB}`,borderRadius:"11px",padding:"13px 15px"}}>
                  <p style={{color:GL,fontSize:"0.83rem",fontWeight:700,margin:"0 0 4px", fontFamily:"sans-serif"}}>{icon} <span style={{fontFamily:"Georgia,serif"}}>{title}</span></p>
                  <p style={{color:"#6b6355",fontSize:"0.73rem",margin:0,lineHeight:1.5}}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CALCULATORS TAB ═══ */}
      {tab === "calculators" && (
        <div style={{flex:1,padding:"22px",overflowY:"auto",position:"relative",zIndex:5}}>
          <div style={{maxWidth:"580px",margin:"0 auto"}}>
            <h2 style={{color:GL,fontSize:"1.05rem",fontWeight:700,marginBottom:"4px"}}>Financial Calculators</h2>
            <p style={{color:"#5a5040",fontSize:"0.77rem",marginBottom:"18px",fontFamily:MN}}>Compute key business metrics instantly \u2014 then send results to AI for deeper analysis</p>

            <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"18px"}}>
              {Object.entries(CALC_META).map(([k,{label,icon}]) => (
                <button key={k} onClick={()=>{setCalcTab(k);setCalcResults(p=>({...p,[k]:undefined}));}}
                  style={{padding:"6px 13px",borderRadius:"20px",border:`1px solid ${GB}`,cursor:"pointer",fontSize:"0.7rem",fontFamily:MN,transition:"all 0.18s",background:calcTab===k?`linear-gradient(135deg,${G},#8a6a1e)`:GD,color:calcTab===k?"#fff":G}}>
                  <span style={{fontFamily:"sans-serif"}}>{icon}</span> {label}
                </button>
              ))}
            </div>

            <div style={{background:SF,border:`1px solid ${GB}`,borderRadius:"14px",padding:"18px"}}>
              <h3 style={{color:G,fontSize:"0.75rem",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:MN,marginBottom:"14px"}}><span style={{fontFamily:"sans-serif"}}>{CALC_META[calcTab].icon}</span> {CALC_META[calcTab].label} Calculator</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"11px"}}>
                {CALC_FIELDS[calcTab].map(([field,label]) => (
                  <CalcInput key={field} label={label} field={field} value={calcInputs[calcTab][field]} onChange={setCI}/>
                ))}
              </div>
              <button onClick={runCalc} style={{marginTop:"16px",width:"100%",padding:"11px",borderRadius:"9px",background:`linear-gradient(135deg,${G},#8a6a1e)`,border:"none",color:"#fff",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",letterSpacing:"0.05em",fontFamily:MN}}>
                CALCULATE \u2192
              </button>

              {calcResults[calcTab] && (
                <div style={{marginTop:"16px",borderTop:`1px solid ${GB}`,paddingTop:"14px"}}>
                  <p style={{color:G,fontSize:"0.7rem",fontFamily:MN,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>Results</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"9px"}}>
                    {Object.entries(calcResults[calcTab]).map(([k,v]) => (
                      <div key={k} style={{background:"rgba(201,168,76,0.07)",border:`1px solid ${GB}`,borderRadius:"9px",padding:"11px"}}>
                        <p style={{color:"#6b6355",fontSize:"0.66rem",fontFamily:MN,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{k}</p>
                        <p style={{color:GL,fontSize:"0.95rem",fontWeight:700,margin:0}}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{sendMessage(`I calculated the following using the ${CALC_META[calcTab].label} calculator: ${Object.entries(calcResults[calcTab]).map(([k,v])=>`${k} = ${v}`).join(", ")}. What do these numbers mean for my business health? What should I do about them? Give me a full analysis with action steps.`);setTab("chat");}}
                    style={{marginTop:"11px",width:"100%",padding:"9px",borderRadius:"9px",background:GD,border:`1px solid ${GB}`,color:G,fontSize:"0.76rem",cursor:"pointer",fontFamily:MN}}>
                    🧠 Send to AI for Full Analysis \u2192
                  </button>
                </div>
              )}
            </div>

            <div style={{marginTop:"16px",background:SF,border:`1px solid ${GB}`,borderRadius:"14px",padding:"16px"}}>
              <h3 style={{color:G,fontSize:"0.75rem",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:MN,marginBottom:"12px"}}>📐 Quick Reference \u2014 Key Benchmarks</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {[["Current Ratio",">2.0 (healthy)"],["Quick Ratio",">1.0"],["Net Margin",">10% (good)"],["Gross Margin",">40% (services)"],["D/E Ratio","<2.0"],["DSO","<45 days"],["LTV:CAC Ratio",">3:1"],["Altman Z-Score",">2.99 (safe)"]].map(([m,b])=>(
                  <div key={m} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"rgba(201,168,76,0.05)",borderRadius:"7px",border:`1px solid rgba(201,168,76,0.12)`}}>
                    <span style={{color:"#6b6355",fontSize:"0.7rem",fontFamily:MN}}>{m}</span>
                    <span style={{color:GL,fontSize:"0.7rem",fontFamily:MN,fontWeight:700}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NOTES TAB ═══ */}
      {tab === "notes" && (
        <div style={{flex:1,padding:"22px",overflowY:"auto",position:"relative",zIndex:5}}>
          <div style={{maxWidth:"580px",margin:"0 auto"}}>
            <h2 style={{color:GL,fontSize:"1.05rem",fontWeight:700,marginBottom:"4px"}}>Financial Notes</h2>
            <p style={{color:"#5a5040",fontSize:"0.77rem",marginBottom:"18px",fontFamily:MN}}>Save key numbers, insights, and action items \u2014 then analyze with AI</p>

            <div style={{background:SF,border:`1px solid ${GB}`,borderRadius:"13px",padding:"15px",marginBottom:"18px"}}>
              <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} rows={4}
                placeholder="e.g. Revenue this month: $82K, expenses $61K, net $21K margin 25.6% \u2014 better than last month\u2026"
                style={{width:"100%",background:"transparent",border:"none",outline:"none",color:"#e8d5a0",fontSize:"0.875rem",lineHeight:1.65,resize:"none",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:"7px",marginTop:"10px"}}>
                <button onClick={()=>{if(noteInput.trim()){setSavedNotes(p=>[{text:noteInput.trim(),time:new Date().toLocaleString()},...p]);setNoteInput("");}}}
                  style={{flex:1,padding:"9px",borderRadius:"8px",background:`linear-gradient(135deg,${G},#8a6a1e)`,border:"none",color:"#fff",fontSize:"0.76rem",cursor:"pointer",fontFamily:MN,fontWeight:700}}>
                  + SAVE NOTE
                </button>
                {noteInput.trim() && (
                  <button onClick={()=>{sendMessage(`Here is my financial note \u2014 please give me a full CFO-grade analysis: "${noteInput}"`);setNoteInput("");setTab("chat");}}
                    style={{flex:1,padding:"9px",borderRadius:"8px",background:GD,border:`1px solid ${GB}`,color:G,fontSize:"0.76rem",cursor:"pointer",fontFamily:MN}}>
                    🧠 Analyze with AI \u2192
                  </button>
                )}
              </div>
            </div>

            {notes.length === 0 ? (
              <div style={{textAlign:"center",marginTop:"40px"}}>
                <p style={{color:"#2e2820",fontFamily:MN,fontSize:"0.77rem"}}>No notes yet. Add your first financial note above.</p>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {notes.map((n,i) => (
                  <div key={i} style={{background:SF,border:`1px solid ${GB}`,borderRadius:"11px",padding:"13px 15px"}}>
                    <p style={{color:TX,fontSize:"0.875rem",lineHeight:1.6,margin:"0 0 8px",whiteSpace:"pre-wrap"}}>{n.text}</p>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#2e2820",fontSize:"0.66rem",fontFamily:MN}}>{n.time}</span>
                      <div style={{display:"flex",gap:"7px"}}>
                        <button onClick={()=>{sendMessage(`Analyze this financial note and give me CFO-grade insights: "${n.text}"`);setTab("chat");}} style={{background:"none",border:`1px solid ${GB}`,borderRadius:"6px",color:G,fontSize:"0.67rem",cursor:"pointer",padding:"3px 8px",fontFamily:MN}}>Analyze \u2192</button>
                        <button onClick={()=>setNotes(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#4a2e15",cursor:"pointer",fontSize:"0.75rem"}}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        textarea::placeholder, input::placeholder { color: #2e2820; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.25; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

