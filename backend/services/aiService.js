const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_now');

exports.categorizeTransaction = async (description, amount) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-preview" });
    const prompt = `Categorize this transaction. Description: "${description}", Amount: ${amount}. 
    Respond ONLY with a valid JSON object containing exactly two keys: "category" (string) and "confidence" (number between 0 and 1). 
    Possible categories: Office Supplies, Software, Travel, Meals, Utilities, Rent, Payroll, Marketing, Other.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(text);
  } catch (err) {
    logger.error("AI Categorization failed", { error: err.message, description });
    return { category: "Uncategorized", confidence: 0 };
  }
};

exports.extractReceiptData = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-preview" });
    const prompt = `Extract receipt information from the following OCR text.
    Respond ONLY with a JSON object with keys: "vendor" (string), "date" (YYYY-MM-DD), "total" (number), "items" (array of objects with "description" and "price").
    If a field is missing, use null.
    OCR Text:
    ${text}`;
    
    const result = await model.generateContent(prompt);
    const jsonText = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(jsonText);
  } catch (err) {
    logger.error("AI Receipt extraction failed", { error: err.message });
    return null;
  }
};
