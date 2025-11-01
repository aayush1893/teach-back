import { GoogleGenAI, Type, Modality, Chat, LiveSession } from "@google/genai";
import { TeachBackData, Language, LANGUAGE_VOICE_MAP, Context, ClassificationResult } from '../types';

export interface ImagePart {
  inlineData: {
    data: string; // base64 encoded string
    mimeType: 'image/png' | 'image/jpeg';
  };
}


// --- Stage 1: Classifier ---

const classifierSchema = {
  type: Type.OBJECT,
  properties: {
    context: {
      type: Type.STRING,
      enum: ["prescription", "eob", "prior_auth", "discharge", "lab", "unknown"],
    },
    confidence: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    top_k: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            enum: ["prescription", "eob", "prior_auth", "discharge", "lab"],
          },
          score: { type: Type.NUMBER, minimum: 0, maximum: 1 },
        },
        required: ["label", "score"],
      },
      minItems: 0,
      maxItems: 3,
    },
    unknown_reasons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["context", "confidence", "top_k", "unknown_reasons"],
};

const classifierSystemInstruction = `You are a medical document classifier. Your task is to analyze the user's text or document image and classify it into one of the following categories: prescription, eob, prior_auth, discharge, lab, or unknown.
- You must classify ONLY into the provided set of categories.
- Abstain by returning 'unknown' if your confidence is less than 0.6 or if the text/image lacks clear, unambiguous cues for a specific category.
- Provide up to 3 alternative categories in 'top_k' with their scores.
- If the context is 'unknown', provide brief reasons in 'unknown_reasons'.
- Do not invent details. Your entire output must be a single, valid JSON object that strictly adheres to the provided schema.

Negative Examples (for your reference):
- A gym membership invoice is NOT an EOB (Explanation of Benefits).
- General wellness blogs or academic articles are 'unknown'.
- A generic appointment reminder is 'unknown' unless it explicitly mentions discharge instructions, medication refills (prescription), or prior authorizations.`;

export const classifyText = async (inputText: string, imagePart?: ImagePart): Promise<ClassificationResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contents = imagePart
        ? { parts: [imagePart, { text: "Please classify the document in the image." }] }
        : `Please classify the following text:\n\n---\n${inputText}\n---`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: classifierSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: classifierSchema,
                temperature: 0.1,
            },
        });
        const data = JSON.parse(response.text.trim());
        return data as ClassificationResult;
    } catch (error) {
        console.error("Gemini classification failed:", error);
        throw new Error("Failed to classify the provided text.");
    }
};


// --- Stage 2: Generator ---

const generatorResponseSchema = {
  type: Type.OBJECT,
  properties: {
    context: { type: Type.STRING, enum: ["prescription", "eob", "prior_auth", "discharge", "lab", "unknown"] },
    simplified_text: { type: Type.STRING },
    reading_grade_after: { type: Type.INTEGER, minimum: 5, maximum: 12 },
    qa: {
      type: Type.ARRAY,
      minItems: 3,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          q: { type: Type.STRING },
          a_correct: { type: Type.STRING },
          a_distractors: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 3 },
          concept_tag: { type: Type.STRING },
          rationale_correct: { type: Type.STRING },
          rationale_incorrect: { type: Type.STRING },
        },
        required: ["q", "a_correct", "a_distractors", "concept_tag", "rationale_correct", "rationale_incorrect"],
      },
    },
    remediation: {
      type: Type.OBJECT,
      properties: {
        if_wrong: { type: Type.STRING },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["if_wrong", "examples"],
    },
    safety_flags: {
      type: Type.OBJECT,
      properties: {
        urgent_contact: { type: Type.BOOLEAN },
        contraindication_mentioned: { type: Type.BOOLEAN },
        red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["urgent_contact", "contraindication_mentioned", "red_flags"],
    },
    domain: {
      type: Type.OBJECT,
      properties: {
        prescription: { type: Type.OBJECT, properties: { dose: { type: Type.STRING }, route: { type: Type.STRING }, frequency: { type: Type.STRING }, timing: { type: Type.STRING }, missed_dose_instructions: { type: Type.STRING }, common_side_effects: { type: Type.ARRAY, items: { type: Type.STRING } }, interaction_warnings: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        eob: { type: Type.OBJECT, properties: { claim_id: { type: Type.STRING }, service_date: { type: Type.STRING }, billed: { type: Type.STRING }, allowed: { type: Type.STRING }, deductible: { type: Type.STRING }, copay: { type: Type.STRING }, coinsurance: { type: Type.STRING }, not_covered_reason: { type: Type.STRING }, appeal_window_days: { type: Type.INTEGER }, next_steps: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        prior_auth: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, missing_items: { type: Type.ARRAY, items: { type: Type.STRING } }, clinical_criteria: { type: Type.ARRAY, items: { type: Type.STRING } }, deadline: { type: Type.STRING }, checklist: { type: Type.ARRAY, items: { type: Type.STRING } }, template_addendum: { type: Type.STRING } } },
        discharge: { type: Type.OBJECT, properties: { followups: { type: Type.ARRAY, items: { type: Type.STRING } }, med_changes: { type: Type.ARRAY, items: { type: Type.STRING } }, when_to_call: { type: Type.ARRAY, items: { type: Type.STRING } }, activity_restrictions: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        lab: { type: Type.OBJECT, properties: { test: { type: Type.STRING }, value: { type: Type.STRING }, unit: { type: Type.STRING }, reference_range: { type: Type.STRING }, interpretation: { type: Type.STRING }, next_steps: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        unknown: { type: Type.OBJECT, properties: { key_points: { type: Type.ARRAY, items: { type: Type.STRING } }, action_checklist: { type: Type.ARRAY, items: { type: Type.STRING } }, questions_to_ask_provider: { type: Type.ARRAY, items: { type: Type.STRING } } } },
      },
    },
  },
  required: ["context", "simplified_text", "reading_grade_after", "qa", "remediation", "safety_flags", "domain"],
};

const getGeneratorData = async (inputText: string, context: Context, imagePart?: ImagePart, retry: boolean = false): Promise<TeachBackData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `You are the Teach-Back Engine. Your goal is to turn complex text into clear, simple language that a patient can easily understand and act on. You have been told the document context is '${context}'.
- Simplify the text to a 6th–8th-grade reading level, preserving the original language (e.g., simplify Spanish text into simpler Spanish).
- NEVER invent clinical facts or information not present in the provided text or image.
- Populate ONLY the domain object that matches the provided context ('${context}'). If the context is 'unknown', you MUST populate the 'unknown' domain object and leave all others empty.
- Your entire output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not add any extra text or formatting.
- Create a quiz that tests the most critical actions or concepts. The quiz MUST cover all crucial information, including specific dosages, frequencies, urgent warning signs, and key follow-up actions/dates. Do not miss any critical details.`;
  
  let userPrompt;
  if (imagePart) {
      let textPart = `The document context is '${context}'. Please process the document provided in the image.`;
      if (retry) {
          textPart += "\n\nThe previous attempt failed. Return valid JSON that exactly matches the schema. No commentary.";
      }
      userPrompt = { parts: [imagePart, { text: textPart }] };
  } else {
      userPrompt = `The document context is '${context}'. Please process the following text:\n\n---\n${inputText}\n---`;
      if (retry) {
          userPrompt += "\n\nThe previous attempt failed. Return valid JSON that exactly matches the schema. No commentary.";
      }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: generatorResponseSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
        throw new Error("Model returned non-JSON text.");
    }
    const data = JSON.parse(jsonText);
    return data as TeachBackData;
  } catch (error) {
    console.error("Gemini generator call failed:", error);
    if (!retry) {
      console.log("Retrying generator call once...");
      return getGeneratorData(inputText, context, imagePart, true);
    }
    throw new Error("Failed to generate and parse teach-back data after retry.");
  }
};

export const generateStructuredData = async (inputText: string, context: Context, imagePart?: ImagePart): Promise<TeachBackData> => {
    return getGeneratorData(inputText, context, imagePart);
};

// --- Audio Services ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAndTranslateAudio = async (
  audioBlob: Blob,
  targetLangName: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const audioPart = {
      inlineData: {
        mimeType: audioBlob.type,
        data: base64Audio,
      },
    };
    
    // --- OPTIMIZED: Single API call for transcription and translation ---
    const prompt = `Please transcribe the following audio and then provide ONLY the translation of the transcribed text into ${targetLangName}. Do not include the original transcription in your final response.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [ audioPart, { text: prompt } ]
        },
    });
    
    const translatedText = response.text;
    
    if (!translatedText.trim()) {
        throw new Error("Translation failed or returned empty text.");
    }
    
    return translatedText;

  } catch (error) {
    console.error("Transcription and translation pipeline failed:", error);
    throw new Error("Failed to process audio. Please try again.");
  }
};

const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const synthesizeSpeech = async (text: string, lang: Language): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: LANGUAGE_VOICE_MAP[lang] },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from TTS API.");
    }
    
    const audioData = decode(base64Audio);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const dataInt16 = new Int16Array(audioData.buffer);
    const frameCount = dataInt16.length;
    const buffer = audioContext.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    return buffer;

  } catch (error) {
    console.error("Speech synthesis failed:", error);
    throw new Error("Failed to generate audio for the translated text.");
  }
};

// --- Exports for Chat & Live ---

export const createChatSession = (): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are a helpful assistant for patients. Your goal is to explain medical concepts and terminology in simple, easy-to-understand language.
When a user asks for a definition of a medical term (e.g., "what is X?", "define X"), you MUST respond with ONLY a valid JSON object with this exact structure: {"isDefinition": true, "term": "the_term_being_defined", "definition": "a_concise_and_simple_definition"}.
For all other questions, respond conversationally as plain text. Do not provide medical advice.`;
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
    });
};

export const connectLiveSession = (callbacks: any): Promise<LiveSession> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: 'You are a helpful assistant for patients. Keep your answers concise and easy to understand. Do not provide medical advice.',
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks,
    });
};