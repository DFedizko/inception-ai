import type { AudioPrompt, Transcriber } from "../../application/ports/transcriber";

type FakeTranscriberOptions = { transcript?: string };

export class FakeTranscriber implements Transcriber {
  receivedAudio?: AudioPrompt;
  private readonly transcript: string;

  constructor(options: FakeTranscriberOptions = {}) {
    this.transcript = options.transcript ?? "um gato astronauta";
  }

  async transcribe(audio: AudioPrompt): Promise<string> {
    this.receivedAudio = audio;
    return this.transcript;
  }
}
