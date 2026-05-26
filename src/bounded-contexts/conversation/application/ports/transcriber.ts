export type AudioPrompt = { data: Uint8Array; mimeType: string };

export interface Transcriber {
  transcribe(audio: AudioPrompt): Promise<string>;
}
