import { Message } from "../entities/message.entity";
import { deriveTitleFromFirstMessage } from "../policies/title-from-first-message.policy";
import { Agent } from "../value-objects/agent.value-object";
import type { Content } from "../value-objects/content";
import type { Instruction } from "../value-objects/instruction.value-object";
import { Modality } from "../value-objects/modality.value-object";
import { Title } from "../value-objects/title.value-object";

export type Turn = {
  role: "user" | "assistant";
  content: string;
};

type ConversationProps = {
  id: string;
  title: Title;
  createdAt: Date;
  messages: Message[];
  agent?: Agent;
};

export class Conversation {
  private constructor(private readonly props: ConversationProps) {}

  static start(): Conversation {
    return new Conversation({
      id: crypto.randomUUID(),
      title: Title.placeholder(),
      createdAt: new Date(),
      messages: [],
      agent: Agent.withoutInstruction(),
    });
  }

  static reconstitute(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): Title {
    return this.props.title;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get messages(): readonly Message[] {
    return [...this.props.messages];
  }

  get agent(): Agent {
    return this.props.agent ?? Agent.withoutInstruction();
  }

  instructionText(): string | null {
    return this.agent.instructionText();
  }

  instruct(instruction: Instruction): void {
    this.props.agent = Agent.instructedBy(instruction);
  }

  isEmpty(): boolean {
    return this.props.messages.length === 0;
  }

  recordUserMessage(text: string, modality: Modality): Message {
    return this.appendUserTurn(Message.fromUser(text, modality));
  }

  recordUserPrompt(modality: Modality, contents: Content[]): Message {
    return this.appendUserTurn(Message.userWith(modality, contents));
  }

  recordAssistantReply(text: string, modality: Modality): Message {
    return this.appendAssistantTurn(Message.fromAssistant(text, modality));
  }

  recordAssistantContent(modality: Modality, contents: Content[]): Message {
    return this.appendAssistantTurn(Message.assistantWith(modality, contents));
  }

  history(): Turn[] {
    return this.props.messages.map((message) => ({
      role: message.role.toString(),
      content: message.text(),
    }));
  }

  private appendUserTurn(message: Message): Message {
    if (this.lastMessage()?.isFromUser()) {
      throw new TurnOrderError("A user message cannot follow another user message.");
    }
    if (this.isEmpty()) {
      this.props.title = deriveTitleFromFirstMessage(message.text());
    }
    this.props.messages.push(message);
    return message;
  }

  private appendAssistantTurn(message: Message): Message {
    if (!this.lastMessage()?.isFromUser()) {
      throw new TurnOrderError("An assistant reply must answer a pending user message.");
    }
    this.props.messages.push(message);
    return message;
  }

  private lastMessage(): Message | undefined {
    return this.props.messages.at(-1);
  }
}

export class TurnOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TurnOrderError";
  }
}
