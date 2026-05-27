import { describe, expect, it } from "bun:test";
import { RevisionTree } from "./revision-tree";
import {
  DuplicateRevisionError,
  RevisionNotFoundError,
  RootAlreadyExistsError,
} from "./versioning.errors";

const treeOf = () =>
  RevisionTree.empty<string>()
    .root("r", "root")
    .branchFrom("r", "a", "A")
    .branchFrom("a", "b", "B")
    .branchFrom("a", "c", "C")
    .branchFrom("c", "d", "D");

describe("RevisionTree", () => {
  it("starts empty", () => {
    expect(RevisionTree.empty<string>().size()).toBe(0);
  });

  it("roots a first revision and reads it back", () => {
    const tree = RevisionTree.empty<string>().root("r", "root");
    expect(tree.size()).toBe(1);
    expect(tree.revision("r").payload).toBe("root");
    expect(tree.revision("r").isRoot()).toBe(true);
  });

  it("rejects a second root", () => {
    const tree = RevisionTree.empty<string>().root("r", "root");
    expect(() => tree.root("other", "x")).toThrow(RootAlreadyExistsError);
  });

  it("branches children from an existing parent", () => {
    const tree = treeOf();
    expect(tree.childrenOf("a").map((revision) => revision.id)).toEqual(["b", "c"]);
    expect(tree.parentOf("b")?.id).toBe("a");
    expect(tree.parentOf("r")).toBeNull();
  });

  it("rejects branching from a missing parent", () => {
    const tree = RevisionTree.empty<string>().root("r", "root");
    expect(() => tree.branchFrom("ghost", "x", "X")).toThrow(RevisionNotFoundError);
  });

  it("rejects a duplicate revision id", () => {
    const tree = RevisionTree.empty<string>().root("r", "root").branchFrom("r", "a", "A");
    expect(() => tree.branchFrom("r", "a", "again")).toThrow(DuplicateRevisionError);
  });

  it("reads the lineage from root to a revision", () => {
    expect(treeOf().lineageOf("d").map((revision) => revision.id)).toEqual(["r", "a", "c", "d"]);
  });

  it("finds the common ancestor of two revisions", () => {
    expect(treeOf().commonAncestorOf("b", "d").id).toBe("a");
    expect(treeOf().commonAncestorOf("a", "d").id).toBe("a");
  });

  it("describes the divergence between two branches", () => {
    const divergence = treeOf().divergenceOf("b", "d");
    expect(divergence.commonAncestor.id).toBe("a");
    expect(divergence.left.map((revision) => revision.id)).toEqual(["b"]);
    expect(divergence.right.map((revision) => revision.id)).toEqual(["c", "d"]);
  });

  it("lists every root-to-leaf branch", () => {
    const branches = treeOf()
      .branches()
      .map((branch) => branch.map((revision) => revision.id));
    expect(branches).toEqual([
      ["r", "a", "b"],
      ["r", "a", "c", "d"],
    ]);
  });

  it("lists the leaves", () => {
    expect(treeOf().leaves().map((revision) => revision.id)).toEqual(["b", "d"]);
  });

  it("keeps prior trees unchanged when branching (immutability)", () => {
    const rooted = RevisionTree.empty<string>().root("r", "root");
    rooted.branchFrom("r", "a", "A");
    expect(rooted.size()).toBe(1);
  });
});
