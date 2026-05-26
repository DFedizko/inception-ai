import type { Conversation } from "../../model/conversation.model";
import type { ConversationSummary } from "../../model/conversation-summary.model";
import type { Content } from "../../model/message.model";
import type { RecordedAudio } from "../audio/voice-recorder.ports";
import type {
  ConversationGateway,
  LiveToken,
  TurnInput,
} from "./conversation.gateway";

const placeholderImage = (prompt: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="#1f2430"/><text x="50%" y="50%" fill="#9aa4b2" font-family="sans-serif" font-size="20" text-anchor="middle">${prompt.slice(0, 40)}</text></svg>`,
  )}`;

const cannedReplies = [
  "Claro! Esse é um experimento de front-end — quando o backend existir, este texto virá de um provedor de IA em streaming.",
  "Boa pergunta. Por enquanto eu respondo com texto mockado, token a token, só para validarmos o comportamento da interface.",
  "Entendi. A View nunca fala com a IA direto: ela passa pela ViewModel, que carrega este gateway. Trocar o mock pelo provedor real não toca na tela.",
];

export class MockConversationGateway implements ConversationGateway {
  private readonly conversations = new Map<string, Conversation>();

  async listConversations(): Promise<ConversationSummary[]> {
    return [...this.conversations.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((conversation) => this.summaryOf(conversation));
  }

  async getConversation(id: string): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) throw new Error(`unknown conversation ${id}`);
    return conversation;
  }

  async *beginConversation(
    content: string,
    onConversationId: (conversationId: string) => void,
  ): AsyncIterable<string> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: content.slice(0, 40),
      createdAt: new Date().toISOString(),
      instruction: null,
      messages: [
        { id: `${crypto.randomUUID()}-0`, role: "user", type: "text", content, createdAt: new Date().toISOString() },
      ],
    };
    this.conversations.set(conversation.id, conversation);
    onConversationId(conversation.id);

    let assembled = "";
    for (const word of this.pickReply(content).split(" ")) {
      await this.wait(45);
      assembled += `${word} `;
      yield `${word} `;
    }
    conversation.messages = [
      ...conversation.messages,
      { id: `${conversation.id}-1`, role: "assistant", type: "text", content: assembled.trim(), createdAt: new Date().toISOString() },
    ];
  }

  async beginConversationWithTurns(turns: TurnInput[]): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: turns.find((turn) => turn.role === "user")?.content.slice(0, 40) ?? "Nova conversa",
      createdAt: new Date().toISOString(),
      instruction: null,
      messages: [],
    };
    this.conversations.set(conversation.id, conversation);
    return this.recordTurns(conversation.id, turns);
  }

  async *streamAssistantReply(_conversationId: string, content: string): AsyncIterable<string> {
    for (const word of this.pickReply(content).split(" ")) {
      await this.wait(45);
      yield `${word} `;
    }
  }

  async issueLiveToken(): Promise<LiveToken> {
    await this.wait(60);
    return {
      token: "mock-ephemeral-token",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
    };
  }

  async recordTurns(conversationId: string, turns: TurnInput[]): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    conversation.messages = [
      ...conversation.messages,
      ...turns.map((turn, index) => ({
        id: `${conversationId}-${conversation.messages.length + index}`,
        role: turn.role,
        type: turn.type,
        content: turn.content,
        createdAt: new Date().toISOString(),
      })),
    ];
    const firstUser = conversation.messages.find((message) => message.role === "user");
    if (conversation.title === "Nova conversa" && firstUser) {
      conversation.title = firstUser.content.slice(0, 40);
    }
    return conversation;
  }

  async instructAgent(conversationId: string, instruction: string): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    conversation.instruction = instruction.trim();
    return conversation;
  }

  async generateImage(conversationId: string, prompt: string): Promise<Conversation> {
    await this.wait(120);
    return this.appendGeneration(conversationId, prompt, [
      { kind: "image", uri: placeholderImage(prompt), mimeType: "image/svg+xml" },
    ]);
  }

  async generateImageFromVoice(
    conversationId: string,
    _audio: RecordedAudio,
  ): Promise<Conversation> {
    await this.wait(150);
    return this.appendGeneration(conversationId, "Pedido de imagem por voz", [
      { kind: "image", uri: placeholderImage("voz"), mimeType: "image/svg+xml" },
    ]);
  }

  async generateVideo(conversationId: string, prompt: string): Promise<Conversation> {
    await this.wait(180);
    return this.appendGeneration(conversationId, prompt, [
      {
        kind: "video",
        status: "ready",
        prompt,
        uri: "https://www.w3schools.com/html/mov_bbb.mp4",
        failureReason: null,
      },
    ]);
  }

  private async appendGeneration(
    conversationId: string,
    prompt: string,
    assistantContents: Content[],
  ): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    const base = conversation.messages.length;
    conversation.messages = [
      ...conversation.messages,
      {
        id: `${conversationId}-${base}`,
        role: "user",
        type: "text",
        content: prompt,
        contents: [{ kind: "text", text: prompt }],
        createdAt: new Date().toISOString(),
      },
      {
        id: `${conversationId}-${base + 1}`,
        role: "assistant",
        type: "text",
        content: "",
        contents: assistantContents,
        createdAt: new Date().toISOString(),
      },
    ];
    if (conversation.title === "Nova conversa") {
      conversation.title = prompt.slice(0, 40);
    }
    return conversation;
  }

  private summaryOf(conversation: Conversation): ConversationSummary {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
    };
  }

  private pickReply(content: string): string {
    return cannedReplies[content.length % cannedReplies.length];
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
