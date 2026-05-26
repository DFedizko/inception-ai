import { type Content, isPromptContent } from "../value-objects/content";
import { Modality } from "../value-objects/modality.value-object";
import { Role } from "../value-objects/role.value-object";
import { TextContent } from "../value-objects/text-content.value-object";

type MessageProps = {
  id: string;
  role: Role;
  modality: Modality;
  contents: Content[];
  createdAt: Date;
};

export class Message {
  private constructor(private readonly props: MessageProps) {}

  static fromUser(text: string, modality: Modality): Message {
    return Message.create(Role.user(), modality, [TextContent.of(text)]);
  }

  static fromAssistant(text: string, modality: Modality): Message {
    return Message.create(Role.assistant(), modality, [TextContent.of(text)]);
  }

  static userWith(modality: Modality, contents: Content[]): Message {
    return Message.create(Role.user(), modality, contents);
  }

  static assistantWith(modality: Modality, contents: Content[]): Message {
    return Message.create(Role.assistant(), modality, contents);
  }

  static reconstitute(props: MessageProps): Message {
    return new Message(props);
  }

  get id(): string {
    return this.props.id;
  }

  get role(): Role {
    return this.props.role;
  }

  get modality(): Modality {
    return this.props.modality;
  }

  get contents(): readonly Content[] {
    return [...this.props.contents];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  text(): string {
    return this.props.contents
      .filter((content): content is TextContent => content.kind === "text")
      .map((content) => content.toString())
      .join("\n");
  }

  isFromUser(): boolean {
    return this.props.role.isUser();
  }

  isFromAssistant(): boolean {
    return this.props.role.isAssistant();
  }

  private static create(role: Role, modality: Modality, contents: Content[]): Message {
    if (contents.length === 0) {
      throw new EmptyMessageContentError();
    }
    if (role.isUser() && !contents.every(isPromptContent)) {
      throw new UnsupportedUserContentError();
    }
    return new Message({
      id: crypto.randomUUID(),
      role,
      modality,
      contents,
      createdAt: new Date(),
    });
  }
}

export class EmptyMessageContentError extends Error {
  constructor() {
    super("A Message must carry at least one Content.");
    this.name = "EmptyMessageContentError";
  }
}

export class UnsupportedUserContentError extends Error {
  constructor() {
    super("A user Message may only carry text or audio content; image and video are produced by the assistant.");
    this.name = "UnsupportedUserContentError";
  }
}
