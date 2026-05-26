import { describe, expect, it } from "bun:test";
import { AudioContent } from "../value-objects/audio-content.value-object";
import { ImageContent } from "../value-objects/image-content.value-object";
import { Modality } from "../value-objects/modality.value-object";
import { TextContent } from "../value-objects/text-content.value-object";
import {
  EmptyMessageContentError,
  Message,
  UnsupportedUserContentError,
} from "./message.entity";

const image = () =>
  ImageContent.of({ uri: "blob://img", mimeType: "image/png", width: 512, height: 512 });

const audio = () =>
  AudioContent.of({ uri: "blob://a", mimeType: "audio/mp3", durationMs: 800 });

describe("Message", () => {
  it("creates a user message carrying its role, modality and text", () => {
    const message = Message.fromUser("Hello", Modality.text());

    expect(message.isFromUser()).toBe(true);
    expect(message.isFromAssistant()).toBe(false);
    expect(message.modality.isText()).toBe(true);
    expect(message.text()).toBe("Hello");
  });

  it("creates an assistant text message", () => {
    const message = Message.fromAssistant("Hi there", Modality.text());

    expect(message.isFromAssistant()).toBe(true);
    expect(message.text()).toBe("Hi there");
  });

  it("lets a user send a voice prompt as audio content", () => {
    const message = Message.userWith(Modality.voice(), [audio()]);

    expect(message.isFromUser()).toBe(true);
    expect(message.contents.map((content) => content.kind)).toEqual(["audio"]);
  });

  it("lets an assistant message carry mixed text and image content", () => {
    const message = Message.assistantWith(Modality.text(), [TextContent.of("here it is"), image()]);

    expect(message.contents).toHaveLength(2);
    expect(message.contents.map((content) => content.kind)).toEqual(["text", "image"]);
    expect(message.text()).toBe("here it is");
  });

  it("forbids image content on a user message", () => {
    expect(() => Message.userWith(Modality.text(), [image()])).toThrow(UnsupportedUserContentError);
  });

  it("rejects an empty content list", () => {
    expect(() => Message.assistantWith(Modality.text(), [])).toThrow(EmptyMessageContentError);
  });

  it("assigns a unique identity and a creation instant", () => {
    const one = Message.fromUser("a", Modality.text());
    const two = Message.fromUser("b", Modality.text());

    expect(one.id).not.toBe(two.id);
    expect(one.createdAt).toBeInstanceOf(Date);
  });

  it("trims content and rejects an empty message", () => {
    expect(Message.fromUser("  spaced  ", Modality.text()).text()).toBe("spaced");
    expect(() => Message.fromUser("   ", Modality.text())).toThrow();
  });
});
