
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TeachBackData, Language, LANGUAGE_VOICE_MAP } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    simplified_text: { type: Type.STRING, description: "The simplified version of the medical text." },
    reading_grade: { type: Type.INTEGER, description: "Estimated reading grade level (5-12) of the simplified text." },
    qa: {
      type: Type.ARRAY,
      description: "An array of 3-5 quiz questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          q: { type: Type.STRING, description: "The quiz question." },
          a_correct: { type: Type.STRING, description: "The single correct answer." },
          a_distractors: {
            type: Type.ARRAY,
            description: "An array of 2-3 incorrect answer choices (distractors).",
            items: { type: Type.STRING },
          },
          rationale_correct: { type: Type.STRING, description: "Explanation for why the correct answer is right." },
          rationale_incorrect: { type: Type.STRING, description: "Explanation for why the other choices are wrong." },
        },
        required: ["q", "a_correct", "a_distractors", "rationale_correct", "rationale_incorrect"]
      }
    },
    remediation: {
      type: Type.OBJECT,
      description: "Guidance for users who answer incorrectly.",
      properties: {
        if_wrong: { type: Type.STRING, description: "A general re-teaching statement." },
        examples: {
          type: Type.ARRAY,
          description: "One or two concrete examples to clarify the concept.",
          items: { type: Type.STRING }
        }
      },
      required: ["if_wrong", "examples"]
    },
    safety_flags: {
      type: Type.OBJECT,
      description: "Identified safety concerns from the text.",
      properties: {
        urgent_contact: { type: Type.BOOLEAN, description: "True if the text suggests urgent medical contact is needed." },
        contraindication_mentioned: { type: Type.BOOLEAN, description: "True if any contraindications are mentioned." },
        red_flags: {
          type: Type.ARRAY,
          description: "A list of specific red-flag words or phrases found.",
          items: { type: Type.STRING }
        }
      },
      required: ["urgent_contact", "contraindication_mentioned", "red_flags"]
    }
  },
  required: ["simplified_text", "reading_grade", "qa", "remediation", "safety_flags"]
};

const systemInstruction = `You are the Teach-Back Engine. Your goal is to turn complex medical instructions into clear, simple language that a patient can easily understand and act on.
- Use clear, culturally sensitive language appropriate for a 6th–8th-grade reading level.
- NEVER invent clinical facts or information not present in the provided text. If a detail is ambiguous or missing, state that you cannot confirm it.
- Your entire output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not add any extra text or formatting outside of the JSON structure.
- Identify and highlight any "red-flag" phrases like "chest pain," "trouble breathing," "severe headache," etc., in the safety_flags.
- Create a quiz that tests the most critical actions or concepts the user needs to know.
- The remediation content should directly address common misunderstandings related to the quiz questions.`;

const getTeachBackData = async (inputText: string, retry: boolean = false): Promise<TeachBackData> => {
  let userPrompt = `Please process the following medical instructions:\n\n---\n${inputText}\n---`;
  if (retry) {
    userPrompt += "\n\nThe previous attempt failed to produce valid JSON. Please ensure your output is a single, valid JSON object matching the schema, with no additional text or explanations."
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
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
    console.error("Gemini API call failed:", error);
    if (!retry) {
      console.log("Retrying API call once...");
      return getTeachBackData(inputText, true);
    }
    throw new Error("Failed to generate and parse teach-back data after retry.");
  }
};


export const generateTeachBack = async (inputText: string): Promise<TeachBackData> => {
    return getTeachBackData(inputText);
};

// --- Video Generation Service ---
export const generateTutorialVideo = async (): Promise<string> => {
  // A new instance is created to ensure the latest API key from the selection dialog is used.
  const aiForVideo = new GoogleGenAI({ apiKey: API_KEY });

  let operation = await aiForVideo.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A professional, animated tutorial video for a web application called 'Teach-Back Engine'. The video should be about 15 seconds long.
      - Start with the app's logo and title.
      - Show a user pasting medical text into an input box on a clean, modern UI (blue and white theme).
      - Animate the text transforming into a simplified version.
      - Briefly show a multiple-choice quiz about the text.
      - Show a "Mastered!" badge with confetti.
      - The animation should be smooth and professional, suitable for a product demo.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    // Poll every 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation completed, but no download link was found.");
  }
  // The API key is appended for authentication when fetching the video blob
  return `${downloadLink}&key=${API_KEY}`;
};


// New Service Functions

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove the data url prefix
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAndTranslateAudio = async (
  audioBlob: Blob,
  sourceLang: Language,
  targetLang: Language,
  targetLangName: string
): Promise<string> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const audioPart = {
      inlineData: {
        mimeType: audioBlob.type,
        data: base64Audio,
      },
    };

    // Step 1: Transcribe the audio
    const transcribeResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                audioPart,
                { text: `Transcribe the following audio. The speaker's language is ${sourceLang}.` }
            ]
        },
    });
    const transcribedText = transcribeResponse.text;

    if (!transcribedText.trim()) {
        throw new Error("Transcription failed or returned empty text.");
    }

    // Step 2: Translate the transcribed text
    const translateResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Translate the following text to ${targetLangName}:\n\n---\n${transcribedText}\n---`,
    });
    
    return translateResponse.text;
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
    
    // Manual decoding for raw PCM data
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
