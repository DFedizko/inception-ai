export class RootAlreadyExistsError extends Error {
  constructor() {
    super("A revision tree can only have one root.");
    this.name = "RootAlreadyExistsError";
  }
}

export class RevisionNotFoundError extends Error {
  constructor(id: string) {
    super(`Revision "${id}" does not exist in this tree.`);
    this.name = "RevisionNotFoundError";
  }
}

export class DuplicateRevisionError extends Error {
  constructor(id: string) {
    super(`Revision "${id}" already exists in this tree.`);
    this.name = "DuplicateRevisionError";
  }
}

export class MissingRootError extends Error {
  constructor() {
    super("This operation requires a rooted revision tree.");
    this.name = "MissingRootError";
  }
}
