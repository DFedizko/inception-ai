export class Revision<T> {
  private constructor(
    private readonly identifier: string,
    private readonly parent: string | null,
    private readonly content: T,
  ) {}

  static root<T>(id: string, payload: T): Revision<T> {
    return new Revision(id, null, payload);
  }

  static childOf<T>(parentId: string, id: string, payload: T): Revision<T> {
    return new Revision(id, parentId, payload);
  }

  get id(): string {
    return this.identifier;
  }

  get parentId(): string | null {
    return this.parent;
  }

  get payload(): T {
    return this.content;
  }

  isRoot(): boolean {
    return this.parent === null;
  }
}
