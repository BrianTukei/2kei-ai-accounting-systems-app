import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Upload, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  Download,
  RefreshCw,
  Zap,
  Shield,
  TrendingUp,
  FileText,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { aiReceiptScannerService, AIExtractedReceipt, ReceiptValidationResult } from '@/services/ai/aiReceiptScannerService';
import { receiptParser } from '@/services/ai/receiptParser';
import { pdfService } from '@/services/pdfService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AIEnhancedReceiptScannerProps {
  onScanComplete?: (data: AIExtractedReceipt) => void;
  className?: string;
}

export default function AIEnhancedReceiptScanner({ onScanComplete, className }: AIEnhancedReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<AIExtractedReceipt | null>(null);
  const [validationResult, setValidationResult] = useState<ReceiptValidationResult | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [activeTab, setActiveTab] = useState('scan');
  const [duplicates, setDuplicates] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { org: organization } = useOrganization();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setExtractedData(null);
    setValidationResult(null);

    try {
      setScanProgress(15);
      
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

      const prompt = `You are an expert accounting AI. Analyze this invoice or receipt and extract only exact, verifiable data.
Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vendor": "string",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "string", "price": number, "quantity": number, "category": "string" }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "currency": "string",
  "originalCurrency": "string",
  "paymentMethod": "string",
  "category": "string",
  "confidence": number,
  "warnings": ["string"]
}
Rules:
- Do NOT infer or calculate missing totals
- Do NOT guess dates, vendor names, or items
- If a field is missing, set it to null and add a warning explaining what is missing
- Preserve item names exactly as shown on the receipt
Return only the JSON.`;

      setScanProgress(30);

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
        throw new Error(`API returned ${response.status}`);
      }

      setScanProgress(60);

      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      const clean = text.replace(new RegExp("```json|```", "g"), "").trim();
      const aiExtracted = JSON.parse(clean);

      const normalizedWarnings = Array.isArray(aiExtracted.warnings) ? [...aiExtracted.warnings] : [];
      if (!aiExtracted.vendor) normalizedWarnings.push('Vendor not found');
      if (!aiExtracted.date) normalizedWarnings.push('Date not found');
      if (!aiExtracted.total) normalizedWarnings.push('Total not found');
      if (!aiExtracted.items || aiExtracted.items.length === 0) normalizedWarnings.push('No line items detected');

      const normalized = {
        vendor: aiExtracted.vendor || 'Not Found',
        date: aiExtracted.date || 'Not Found',
        items: Array.isArray(aiExtracted.items) ? aiExtracted.items.map((item: any) => ({
          name: item?.name || 'Unknown Item',
          price: Number.isFinite(Number(item?.price)) ? Number(item.price) : 0,
          quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
          category: item?.category || 'Other'
        })) : [],
        subtotal: Number.isFinite(Number(aiExtracted.subtotal)) ? Number(aiExtracted.subtotal) : 0,
        tax: Number.isFinite(Number(aiExtracted.tax)) ? Number(aiExtracted.tax) : 0,
        total: Number.isFinite(Number(aiExtracted.total)) ? Number(aiExtracted.total) : 0,
        currency: aiExtracted.currency || aiExtracted.originalCurrency || 'USD',
        originalCurrency: aiExtracted.originalCurrency || aiExtracted.currency || 'USD',
        paymentMethod: aiExtracted.paymentMethod || 'Not Found',
        category: aiExtracted.category || 'Other',
        confidence: Number.isFinite(Number(aiExtracted.confidence)) ? Number(aiExtracted.confidence) : 0.7,
        warnings: normalizedWarnings
      };
      
      setOriginalText('Processed by Claude AI from image/pdf');
      setExtractedData(normalized);
      setScanProgress(70);

      // Validation
      setScanProgress(80);
      const existingExpenses = getExistingExpenses();
      const validation = await aiReceiptScannerService.validateReceipt(normalized, existingExpenses);
      setValidationResult(validation);
      setScanProgress(90);

      // Duplicate Detection
      const duplicateExpenses = await aiReceiptScannerService.detectDuplicateExpenses(normalized, existingExpenses);
      setDuplicates(duplicateExpenses);
      setScanProgress(100);

      setConfidence(normalized.confidence || 0.9);
      
      if (validation.isValid) {
        toast.success(`✅ Receipt scanned successfully! Confidence: ${((aiExtracted.confidence || 0.9) * 100).toFixed(1)}%`);
        if (onScanComplete) {
            onScanComplete(normalized);
        }
      } else {
        toast.warning(`⚠️ Receipt scanned with issues. Confidence: ${((aiExtracted.confidence || 0.9) * 100).toFixed(1)}%`);
      }

    } catch (error) {
      console.error('AI Receipt scanning failed:', error);
      toast.error('❌ Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanProgress(0), 1000);
    }
  };

  const getExistingExpenses = () => {
    // In a real app, this would fetch from your database
    const stored = localStorage.getItem('finance-app-transactions');
    return stored ? JSON.parse(stored) : [];
  };

  const handleAccept = () => {
    if (extractedData && validationResult?.isValid) {
      // Save to database/local storage
      const expenses = getExistingExpenses();
      const newExpense = {
        id: Date.now().toString(),
        ...extractedData,
        userId: user?.id,
        companyId: organization?.id,
        createdAt: new Date().toISOString(),
        scannedWithAI: true,
        confidence: extractedData.confidence
      };
      
      expenses.push(newExpense);
      localStorage.setItem('finance-app-transactions', JSON.stringify(expenses));
      
      onScanComplete?.(extractedData);
      toast.success('✅ Receipt saved to expenses!');
      
      // Reset for next scan
      setExtractedData(null);
      setValidationResult(null);
      setDuplicates([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!extractedData) return;

    try {
      const company = organization ? await import('@/services/userCompanyService').then(s => 
        s.userCompanyService.getCompany(organization.id)
      ) : undefined;
      
      const pdf = pdfService.generateReceiptPDF(extractedData, company, user || undefined);
      const filename = `ai-receipt-${extractedData.vendor}-${extractedData.date}.pdf`;
      pdfService.downloadPDF(pdf, filename);
      toast.success('📄 PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            AI Enhanced Receipt Scanner
          </h2>
          <p className="text-gray-600">
            Advanced AI-powered receipt analysis with Llama 3
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Local AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan">
            <Camera className="h-4 w-4 mr-2" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!extractedData}>
            <Eye className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="validation" disabled={!validationResult}>
            <Shield className="h-4 w-4 mr-2" />
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Upload Document</h3>
                      <p className="text-gray-600">
                        Take a photo or upload an image or PDF of your receipt/invoice for AI analysis
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {isScanning ? 'Scanning...' : 'Choose Receipt'}
                    </Button>
                  </div>
                </div>

                {/* Scanning Progress */}
                {isScanning && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">AI Analysis Progress</span>
                          <span className="text-sm text-muted-foreground">{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                          {scanProgress < 30 && "📷 Extracting text from receipt image..."}
                          {scanProgress >= 30 && scanProgress < 70 && "🧠 AI analyzing receipt structure..."}
                          {scanProgress >= 70 && scanProgress < 90 && "🔍 Validating extracted data..."}
                          {scanProgress >= 90 && "✅ Checking for duplicates..."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Features */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Capabilities
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Automatic text extraction (OCR)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Intelligent data categorization</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Currency detection & conversion</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Duplicate expense detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Fake receipt identification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Confidence scoring</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {extractedData && (
            <div className="space-y-4">
              {/* Confidence Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <span className="font-medium">AI Confidence Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getConfidenceColor(extractedData.confidence)}`}>
                        {(extractedData.confidence * 100).toFixed(1)}%
                      </span>
                      <Badge variant={extractedData.confidence >= 0.8 ? 'default' : 'secondary'}>
                        {extractedData.confidence >= 0.8 ? 'High' : extractedData.confidence >= 0.6 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={extractedData.confidence * 100} className="mt-3" />
                </CardContent>
              </Card>

              {/* Extracted Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Extracted Receipt Data
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vendor</label>
                        <p className="font-semibold">{extractedData.vendor}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date</label>
                        <p className="font-semibold">{extractedData.date}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Method</label>
                        <p className="font-semibold">{extractedData.paymentMethod}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Category</label>
                        <p className="font-semibold">{extractedData.category}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Currency</label>
                        <p className="font-semibold">
                          {extractedData.originalCurrency} → {extractedData.currency}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subtotal</label>
                        <p className="font-semibold">${extractedData.subtotal.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tax</label>
                        <p className="font-semibold">${extractedData.tax.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total</label>
                        <p className="font-semibold text-lg">${extractedData.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600">Items ({extractedData.items.length})</label>
                    <div className="mt-2 space-y-2">
                      {extractedData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.category} • Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${item.price.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warnings */}
                  {extractedData.warnings.length > 0 && (
                    <div className="mt-6">
                      <label className="text-sm font-medium text-gray-600">Warnings</label>
                      <div className="mt-2 space-y-2">
                        {extractedData.warnings.map((warning, index) => (
                          <Alert key={index} className="border-yellow-200 bg-yellow-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    <Button 
                      onClick={handleAccept}
                      disabled={!validationResult?.isValid}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Save
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('validation')}>
                      <Shield className="h-4 w-4 mr-2" />
                      View Validation
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          {validationResult && (
            <div className="space-y-4">
              {/* Validation Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Validation Result</span>
                    </div>
                    <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                      {validationResult.isValid ? 'Valid' : 'Issues Found'}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress value={validationResult.confidence * 100} className="w-full" />
                    <p className="text-sm text-gray-600 mt-1">
                      Validation Confidence: {(validationResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Issues */}
              {validationResult.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationResult.issues.map((issue, index) => (
                        <Alert key={index} className={getSeverityColor(issue.severity)}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{issue.description}</p>
                                <p className="text-sm mt-1">{issue.suggestion}</p>
                              </div>
                              <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                {issue.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duplicates */}
              {duplicates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Potential Duplicates ({duplicates.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {duplicates.map((duplicate, index) => (
                        <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{duplicate.vendor}</p>
                              <p className="text-sm text-gray-600">
                                {duplicate.date} • ${duplicate.total}
                              </p>
                            </div>
                            <Badge variant="destructive">Duplicate</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Original Text */}
              <Card>
                <CardHeader>
                  <CardTitle>Original OCR Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{originalText}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
