/**
 * Gemini 2.5 Flash AI Service
 * Mini-RAG Synthesis & Multimodal Vision Extraction
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
 * Primary Tourist Mode Mini-RAG:
 * Injects verified nearby Supabase vendors + photo + coordinates into Gemini 2.5 Flash.
 * Returns 2-sentence cultural context and exactly 2 complementary vendor IDs.
 *
 * @param {Object} params
 * @param {string} params.base64Image - JPEG base64 string without data prefix
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

  // Fallback demo mock if key is missing or DEMO_MODE requested without active key
  if (!apiKey || isDemo) {
    // Select up to 2 realistic vendor IDs from nearby list
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as specified, with graceful model fallback if needed
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
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
  } catch (error) {
    console.warn('Gemini 2.5 Flash direct call failed, attempting fallback model or safe recovery:', error);

    // If gemini-2.5-flash is not yet enabled for the key, try gemini-2.0-flash / gemini-1.5-flash
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await fallbackModel.generateContent([
        prompt + '\nEnsure output is valid JSON without markdown.',
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);
      const text = (await result.response).text();
      const parsed = parseGeminiResponse(text);
      return {
        context: parsed.context,
        vendor_ids: Array.isArray(parsed.vendor_ids) ? parsed.vendor_ids : [],
        grounded_vendors_count: nearbyVendors.length,
        is_fallback: false,
      };
    } catch (fallbackErr) {
      console.error('All Gemini attempts failed:', fallbackErr);
      throw new Error(`AI Synthesis Error: ${fallbackErr.message || 'Unable to analyze image'}`);
    }
  }
}

/**
 * Artisan Snap-to-Onboard Mode:
 * Multimodal extraction of stall name, category, and 1-2 sentence description from a single photo.
 *
 * @param {Object} params
 * @param {string} params.base64Image - JPEG base64 string
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
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
  } catch (error) {
    console.error('Artisan extraction error:', error);
    // Graceful recovery
    return {
      name: 'Artisan Heritage Stall',
      category: 'Craft',
      description: 'Hyper-local micro-vendor offering handcrafted regional specialties.',
      is_fallback: true,
    };
  }
}
