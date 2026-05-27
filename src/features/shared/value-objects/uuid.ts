export class UUID {
  private static readonly pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(readonly value: string) {}

  static create(value: string): UUID {
    if (!UUID.pattern.test(value)) throw new Error(`Invalid UUID: ${value}`);
    return new UUID(value);
  }

  equals(other: UUID): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
