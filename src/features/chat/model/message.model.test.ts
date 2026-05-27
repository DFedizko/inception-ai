import { describe, expect, it } from "bun:test";

import { UUID } from "@/features/shared/value-objects/uuid";
import { type Content, Message, type Role } from "./message.model";

const id = UUID.create(crypto.randomUUID());

const message = (role: Role, content: string, contents: Content[] = []) =>
  new Message(id, role, "text", content, "2026-05-26T10:00:00.000Z", contents);

describe("Message", () => {
  it("identifies who authored the turn", () => {
    expect(message("user", "Olá").isFromUser()).toBe(true);
    expect(message("user", "Olá").isFromAssistant()).toBe(false);
    expect(message("assistant", "Olá").isFromAssistant()).toBe(true);
  });

  it("has text only when there is content", () => {
    expect(message("assistant", "Olá").hasText()).toBe(true);
    expect(message("assistant", "").hasText()).toBe(false);
  });

  it("exposes only image and video contents as media", () => {
    const media = message("assistant", "", [
      { kind: "text", text: "Olá" },
      { kind: "image", uri: "img", mimeType: "image/png" },
      { kind: "video", status: "ready", prompt: "p", uri: "vid", failureReason: null },
    ]).media();

    expect(media.map((content) => content.kind)).toEqual(["image", "video"]);
  });

  it("has no media when there are no contents", () => {
    expect(message("assistant", "Olá").media()).toEqual([]);
  });

  it("appends a streamed chunk into a new message, preserving identity and immutability", () => {
    const original = message("assistant", "Olá");
    const streamed = original.withAppended(" mundo");

    expect(streamed.content).toBe("Olá mundo");
    expect(streamed.id).toBe(original.id);
    expect(original.content).toBe("Olá");
  });
});
