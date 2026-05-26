export type RoleValue = "user" | "assistant";

export class Role {
  private static readonly allowed: readonly RoleValue[] = ["user", "assistant"];

  private constructor(private readonly value: RoleValue) {}

  static user(): Role {
    return new Role("user");
  }

  static assistant(): Role {
    return new Role("assistant");
  }

  static fromString(value: string): Role {
    if (!Role.allowed.includes(value as RoleValue)) {
      throw new InvalidRoleError(value);
    }
    return new Role(value as RoleValue);
  }

  isUser(): boolean {
    return this.value === "user";
  }

  isAssistant(): boolean {
    return this.value === "assistant";
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }

  toString(): RoleValue {
    return this.value;
  }
}

export class InvalidRoleError extends Error {
  constructor(value: string) {
    super(`Unsupported message role: "${value}". Allowed: user, assistant.`);
    this.name = "InvalidRoleError";
  }
}
