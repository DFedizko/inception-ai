import { RevisionTree } from "./revision-tree";

type Sample = {
  operation: string;
  size: number;
  millis: number;
  growthVsPrevious: string;
};

const sizes = [1000, 2000, 4000, 8000];

const buildChain = (depth: number): RevisionTree<number> => {
  const ids = Array.from({ length: depth }, (_, index) => index);
  return ids.reduce(
    (tree, index) => (index === 0 ? tree.root("0", 0) : tree.branchFrom(String(index - 1), String(index), index)),
    RevisionTree.empty<number>(),
  );
};

const buildBush = (leafCount: number): RevisionTree<number> => {
  const leaves = Array.from({ length: leafCount }, (_, index) => index + 1);
  return leaves.reduce(
    (tree, leaf) => tree.branchFrom("0", String(leaf), leaf),
    RevisionTree.empty<number>().root("0", 0),
  );
};

const millisOf = (run: () => void): number => {
  const start = performance.now();
  run();
  return round(performance.now() - start);
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

const sampleAcrossSizes = (operation: string, time: (size: number) => number): Sample[] =>
  withGrowth(sizes.map((size) => ({ operation, size, millis: time(size), growthVsPrevious: "—" })));

const withGrowth = (samples: Sample[]): Sample[] =>
  samples.map((sample, index) => {
    if (index === 0) return sample;
    const previous = samples[index - 1]!;
    return { ...sample, growthVsPrevious: `${round(sample.millis / Math.max(previous.millis, 1e-6))}×` };
  });

const verdicts: Record<string, string> = {
  build: "O(n²) overall — each immutable append clones the index map in O(n); superlinear per size doubling. Fine: real usage appends one node and persists, never rebuilds.",
  lineage: "O(d) in tree depth — walks parent pointers once.",
  commonAncestor: "O(d) in tree depth — ancestor set of one side, single climb up the other.",
  branches: "O(n) total — one lineage walk per leaf, each node visited once across the tree.",
};

const report = (title: string, verdictKey: string, samples: Sample[]): void => {
  console.log(`\n${title}`);
  console.table(samples);
  console.log(`Big O: ${verdicts[verdictKey]}`);
};

report("Build", "build", sampleAcrossSizes("build (branchFrom × n)", (size) => millisOf(() => buildChain(size))));

const chains = new Map(sizes.map((size) => [size, buildChain(size)]));
report(
  "Lineage",
  "lineage",
  sampleAcrossSizes("lineageOf(deepest)", (size) => millisOf(() => chains.get(size)!.lineageOf(String(size - 1)))),
);

const bushes = new Map(sizes.map((size) => [size, buildBush(size)]));
report(
  "Common ancestor",
  "commonAncestor",
  sampleAcrossSizes("commonAncestorOf(leaf, leaf)", (size) =>
    millisOf(() => bushes.get(size)!.commonAncestorOf("1", String(size))),
  ),
);
report("Branches", "branches", sampleAcrossSizes("branches()", (size) => millisOf(() => bushes.get(size)!.branches())));
