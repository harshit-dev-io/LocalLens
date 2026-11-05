/**
 * Gemini AI Service (Gemini 1.5 Flash / 2.0 Flash)
 * Mini-RAG Synthesis & Multimodal Vision Extraction
 * Resilient multi-model initialization with graceful failover.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Resilient JSON Parser as specified in rules.md
 * Strips markdown code fences (```json ... ```) and extracts clean JSON.
 */
export const parseGeminiResponse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from AI engine');
  }

  // 1. Strip standard markdown code fences
  let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  // 2. Extra resilience: find first '{' and last '}' if trailing commentary exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
};

/**
 * Resolves the active Gemini API Key
 */
export const getGeminiApiKey = () => {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof window !== 'undefined' ? window.localStorage.getItem('LOCAL_LENS_GEMINI_KEY') : '') ||
    ''
  );
};

/**
 * Standard Stable Model Initializer
 * Explicitly uses stable "gemini-1.5-flash" with optional JSON MIME type.
 */
export const getGeminiModel = (apiKeyOverride, modelName = 'gemini-1.5-flash') => {
  const key = apiKeyOverride || getGeminiApiKey();
  if (!key) return null;

  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });
};

// Candidate model identifiers for resilient multi-tier fallback
const CANDIDATE_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

/**
 * Primary Tourist Mode Mini-RAG:
 * Injects verified nearby Supabase vendors + photo + coordinates into Gemini 1.5 Flash.
 * Returns 2-sentence cultural context and exactly 2 complementary vendor IDs.
 *
 * @param {Object} params
 * @param {string} params.base64Image - Base64 string without data prefix
 * @param {string} [params.mimeType='image/jpeg']
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {Array} params.nearbyVendors - Pre-filtered list of verified vendors within 500m
 * @param {boolean} [params.isDemo=false]
 * @returns {Promise<{ context: string, vendor_ids: string[] }>}
 */
export async function generateCulturalContext({
  base64Image,
  mimeType = 'image/jpeg',
  latitude,
  longitude,
  nearbyVendors = [],
  isDemo = false,
}) {
  const apiKey = getGeminiApiKey();

  // Strip prefix if full data URL was provided
  const cleanBase64 = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  // Fallback demo mock if key is missing or DEMO_MODE requested without active key
  if (!apiKey || isDemo) {
    const candidateIds = nearbyVendors.slice(0, 2).map((v) => v.id);
    return {
      context:
        'You are standing amidst centuries of living urban heritage, where traditional copper and earthen wares meet aromatic spice blends. The vibrant street rhythm carries culinary and artisanal practices passed down unbroken through generations.',
      vendor_ids: candidateIds.length > 0 ? candidateIds : ['f2b20001-0000-4000-b000-000000000001', 'f2b20002-0000-4000-b000-000000000002'],
      grounded_vendors_count: nearbyVendors.length,
      is_fallback: !apiKey,
    };
  }

  // Sanitize vendor payload for Mini-RAG prompt (inject only verified metadata)
  const vendorsJsonString = JSON.stringify(
    nearbyVendors.map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      description: v.description,
      distance_meters: v.distance_meters,
    })),
    null,
    2
  );

  const prompt = `
You are a local cultural guide. Analyze the provided image and the user's coordinates: [lat: ${latitude}, lng: ${longitude}].
1. Identify the subject in the photo and provide a 2-sentence cultural or historical context.
2. Review the provided JSON array of verified nearby micro-vendors within 500m:
${vendorsJsonString}
3. Select exactly 2 vendors from the array that complement the current location (e.g., a nearby tea stall after looking at a monument or craft shop). If fewer than 2 are provided, select whatever is available.

Respond strictly in JSON matching this exact schema:
{
  "context": "The 2-sentence cultural story.",
  "vendor_ids": ["uuid-1", "uuid-2"]
}
`;

  // Multi-tier model execution attempt
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
      ]);

      const response = await result.response;
      const rawText = response.text();
      const parsed = parseGeminiResponse(rawText);

      return {
        context: parsed.context || 'Discover the rich cultural tapestry alive around this vibrant corner.',
        vendor_ids: Array.isArray(parsed.vendor_ids) ? parsed.vendor_ids : [],
        grounded_vendors_count: nearbyVendors.length,
        is_fallback: false,
      };
    } catch (modelError) {
      console.warn(`Gemini model [${modelName}] failed, trying next candidate:`, modelError.message);
      // Continue to next model candidate in loop
    }
  }

  // If all live API attempts fail (404/quota/network), safely return grounded response with verified stalls
  console.info('LocalLens V2: Live Gemini endpoint unreachable, recovering with verified grounded stalls.');
  const fallbackIds = nearbyVendors.slice(0, 2).map((v) => v.id);
  return {
    context:
      'Ancient artisanal traditions thrive in this quarter, where master craftsmen forge heritage wares alongside bustling street kitchens. Local micro-vendors continue preserving time-honored recipes and handmade arts right on these historic walkways.',
    vendor_ids: fallbackIds.length > 0 ? fallbackIds : ['f2b20001-0000-4000-b000-000000000001', 'f2b20002-0000-4000-b000-000000000002'],
    grounded_vendors_count: nearbyVendors.length,
    is_fallback: true,
  };
}

/**
 * Artisan Snap-to-Onboard Mode:
 * Multimodal extraction of stall name, category, and 1-2 sentence description.
 *
 * @param {Object} params
 * @param {string} params.base64Image
 * @param {string} [params.mimeType='image/jpeg']
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {boolean} [params.isDemo=false]
 * @returns {Promise<{ name: string, category: string, description: string }>}
 */
export async function extractArtisanProfile({
  base64Image,
  mimeType = 'image/jpeg',
  latitude,
  longitude,
  isDemo = false,
}) {
  const apiKey = getGeminiApiKey();

  const cleanBase64 = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  if (!apiKey || isDemo) {
    return {
      name: 'Rameshwar Handcrafted Terracotta Stall',
      category: 'Craft',
      description: 'Master artisan creating wheel-thrown clay chai kulhads and terracotta water vessels using indigenous clay techniques.',
      is_fallback: !apiKey,
    };
  }

  const prompt = `
You are an expert hyper-local business on-boarder. Analyze the photo of this street cart, stall, or artisan workshop located at GPS [${latitude}, ${longitude}].
Extract a high-accuracy vendor profile for the local commerce directory:
1. "name": The business or stall name (read any signage, or create an authentic title like "Ustad's Hand-Carved Wooden Toys").
2. "category": Choose exactly one: 'Food', 'Craft', or 'Heritage'.
3. "description": A concise, respectful 1-to-2 sentence description highlighting their craft, signature item, or traditional method.

Respond strictly in JSON matching this exact schema:
{
  "name": "Stall Name",
  "category": "Food | Craft | Heritage",
  "description": "1-2 sentence artisanal description."
}
`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
      ]);

      const response = await result.response;
      const rawText = response.text();
      const parsed = parseGeminiResponse(rawText);

      return {
        name: parsed.name || 'Local Street Artisan',
        category: ['Food', 'Craft', 'Heritage'].includes(parsed.category) ? parsed.category : 'Craft',
        description: parsed.description || 'Authentic hyper-local micro-enterprise preserving traditional heritage craftsmanship.',
        is_fallback: false,
      };
    } catch (err) {
      console.warn(`Gemini extraction [${modelName}] failed:`, err.message);
    }
  }

  // Graceful offline fallback
  return {
    name: 'Artisan Heritage Stall',
    category: 'Craft',
    description: 'Hyper-local micro-vendor offering handcrafted regional specialties.',
    is_fallback: true,
  };
}
