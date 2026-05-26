import { GoogleGenAI } from "@google/genai";
import type { AudioPrompt, Transcriber } from "../../application/ports/transcriber";

type GeminiTranscriptionResponse = {
  text?: string;
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export interface GeminiTranscriptionClient {
  models: {
    generateContent(args: { model: string; contents: unknown }): Promise<GeminiTranscriptionResponse>;
  };
}

const defaultModel = "gemini-3.5-flash";
const instruction = "Transcreva o áudio. Responda apenas com a transcrição, sem comentários.";

export const extractTranscript = (response: GeminiTranscriptionResponse): string => {
  if (response.text) {
    return response.text;
  }
  return (response.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("");
};

export class GeminiTranscriber implements Transcriber {
  constructor(
    private readonly client: GeminiTranscriptionClient,
    private readonly model: string = process.env.GEMINI_MODEL ?? defaultModel,
  ) {}

  async transcribe(audio: AudioPrompt): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: Buffer.from(audio.data).toString("base64"),
                mimeType: audio.mimeType,
              },
            },
            { text: instruction },
          ],
        },
      ],
    });
    return extractTranscript(response).trim();
  }
}

export const createGeminiTranscriber = (): GeminiTranscriber => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GeminiTranscriber(new GoogleGenAI({ apiKey }) as unknown as GeminiTranscriptionClient);
};
