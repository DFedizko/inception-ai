import { Revision } from "./revision";
import {
  DuplicateRevisionError,
  MissingRootError,
  RevisionNotFoundError,
  RootAlreadyExistsError,
} from "./versioning.errors";

export type Divergence<T> = {
  commonAncestor: Revision<T>;
  left: Revision<T>[];
  right: Revision<T>[];
};

export class RevisionTree<T> {
  private constructor(
    private readonly revisions: Map<string, Revision<T>>,
    private readonly childIds: Map<string, string[]>,
    private readonly rootId: string | null,
  ) {}

  static empty<T>(): RevisionTree<T> {
    return new RevisionTree<T>(new Map(), new Map(), null);
  }

  root(id: string, payload: T): RevisionTree<T> {
    this.guardNoRoot();
    this.guardFreeId(id);
    return this.append(Revision.root(id, payload), id);
  }

  branchFrom(parentId: string, id: string, payload: T): RevisionTree<T> {
    this.guardKnown(parentId);
    this.guardFreeId(id);
    return this.append(Revision.childOf(parentId, id, payload), this.rootId);
  }

  has(id: string): boolean {
    return this.revisions.has(id);
  }

  size(): number {
    return this.revisions.size;
  }

  revision(id: string): Revision<T> {
    this.guardKnown(id);
    return this.revisions.get(id)!;
  }

  childrenOf(id: string): Revision<T>[] {
    this.guardKnown(id);
    return this.childIdsOf(id).map((childId) => this.revisions.get(childId)!);
  }

  parentOf(id: string): Revision<T> | null {
    const parentId = this.revision(id).parentId;
    if (parentId === null) return null;
    return this.revisions.get(parentId)!;
  }

  lineageOf(id: string): Revision<T>[] {
    this.guardKnown(id);
    return this.ascendFrom(id).reverse();
  }

  commonAncestorOf(a: string, b: string): Revision<T> {
    const ancestors = new Set(this.ascendFrom(a).map((revision) => revision.id));
    return this.firstSharedAncestor(b, ancestors);
  }

  divergenceOf(a: string, b: string): Divergence<T> {
    const ancestor = this.commonAncestorOf(a, b);
    return {
      commonAncestor: ancestor,
      left: this.pathBelow(ancestor.id, a),
      right: this.pathBelow(ancestor.id, b),
    };
  }

  leaves(): Revision<T>[] {
    return [...this.revisions.values()].filter((revision) => this.isLeaf(revision.id));
  }

  branches(): Revision<T>[][] {
    return this.leaves().map((leaf) => this.lineageOf(leaf.id));
  }

  private append(revision: Revision<T>, rootId: string | null): RevisionTree<T> {
    const revisions = new Map(this.revisions).set(revision.id, revision);
    const childIds = new Map(this.childIds);
    this.linkToParent(childIds, revision);
    return new RevisionTree<T>(revisions, childIds, rootId);
  }

  private linkToParent(childIds: Map<string, string[]>, revision: Revision<T>): void {
    if (revision.isRoot()) return;
    const siblings = childIds.get(revision.parentId!) ?? [];
    childIds.set(revision.parentId!, [...siblings, revision.id]);
  }

  private ascendFrom(id: string): Revision<T>[] {
    const lineage: Revision<T>[] = [];
    let cursor: string | null = id;
    while (cursor !== null) {
      const revision = this.revisions.get(cursor)!;
      lineage.push(revision);
      cursor = revision.parentId;
    }
    return lineage;
  }

  private firstSharedAncestor(id: string, ancestors: Set<string>): Revision<T> {
    let cursor: string | null = id;
    while (cursor !== null) {
      if (ancestors.has(cursor)) return this.revisions.get(cursor)!;
      cursor = this.revisions.get(cursor)!.parentId;
    }
    throw new MissingRootError();
  }

  private pathBelow(ancestorId: string, descendantId: string): Revision<T>[] {
    const lineage = this.lineageOf(descendantId);
    const ancestorIndex = lineage.findIndex((revision) => revision.id === ancestorId);
    return lineage.slice(ancestorIndex + 1);
  }

  private childIdsOf(id: string): string[] {
    return this.childIds.get(id) ?? [];
  }

  private isLeaf(id: string): boolean {
    return this.childIdsOf(id).length === 0;
  }

  private guardNoRoot(): void {
    if (this.rootId === null) return;
    throw new RootAlreadyExistsError();
  }

  private guardFreeId(id: string): void {
    if (!this.revisions.has(id)) return;
    throw new DuplicateRevisionError(id);
  }

  private guardKnown(id: string): void {
    if (this.revisions.has(id)) return;
    throw new RevisionNotFoundError(id);
  }
}
