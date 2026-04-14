const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async parseReceipt(base64Image, mimeType) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Extract structured receipt data from this image.
Return ONLY a raw JSON object. No markdown formatting, no \`\`\`json blocks.
Fields required:
- store_name (String)
- receipt_number (String or null)
- date (ISO 8601 YYYY-MM-DD or null)
- time (HH:MM or null)
- items (Array of objects: { description: String, quantity: Number, unit_price: Number, total_price: Number })
- subtotal (Number)
- tax (Number)
- total_amount (Number)
- currency (String, e.g., "USD", "EUR")
- confidence_score (Number between 0.0 and 1.0 based on image legibility)
Rules: Convert all currency values to raw numbers. Infer the currency from symbols.
If a field is missing, return null.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    let jsonStr = responseText.trim();
    // Clean up potential markdown formatting if Gemini didn't perfectly follow the "No markdown" rule.
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    
    return JSON.parse(jsonStr.trim());
  }
}

module.exports = new GeminiService();