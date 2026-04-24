/**
 * processData — core BFHL challenge processor
 *
 * @param {string[]} dataArray  raw input strings
 * @returns {{ hierarchies, invalid_entries, duplicate_edges, summary }}
 */
module.exports = function processData(dataArray) {
  // ─────────────────────────────────────────
  // STEP 1 — VALIDATE EACH ENTRY
  // ─────────────────────────────────────────
  const VALID_EDGE = /^[A-Z]->[A-Z]$/;

  const invalid_entries = [];
  const validRaw = [];

  for (const raw of dataArray) {
    const entry = typeof raw === 'string' ? raw.trim() : String(raw).trim();

    if (!VALID_EDGE.test(entry)) {
      invalid_entries.push(raw); // push original (pre-trim) value
      continue;
    }

    // Self-loop check  (e.g. "A->A")
    const [parent, child] = entry.split('->');
    if (parent === child) {
      invalid_entries.push(raw);
      continue;
    }

    validRaw.push(entry);
  }

  // ─────────────────────────────────────────
  // STEP 2 — DEDUPLICATE
  // ─────────────────────────────────────────
  const seen = new Set();
  const duplicate_edges = [];
  const dedupedEdges = [];

  for (const edge of validRaw) {
    if (seen.has(edge)) {
      // Only record duplicate ONCE regardless of repeat count
      if (!duplicate_edges.includes(edge)) {
        duplicate_edges.push(edge);
      }
    } else {
      seen.add(edge);
      dedupedEdges.push(edge);
    }
  }

  // ─────────────────────────────────────────
  // STEP 3 — BUILD ADJACENCY / PARENT MAP
  // ─────────────────────────────────────────
  // children map:  node -> [child, ...]
  // parent  map:  node -> parent (first-seen wins for multi-parent)
  const children = {};  // node -> Set of children
  const parentOf = {};  // node -> parent string

  // Collect all nodes first
  const allNodes = new Set();

  for (const edge of dedupedEdges) {
    const [p, c] = edge.split('->');
    allNodes.add(p);
    allNodes.add(c);
    if (!children[p]) children[p] = [];
    // Diamond / multi-parent rule: first-seen parent wins
    if (parentOf[c] === undefined) {
      parentOf[c] = p;
      children[p].push(c);
    }
    // else: silently discard — c already has a parent
  }

  // Ensure every node has a children entry (even leaf nodes)
  for (const node of allNodes) {
    if (!children[node]) children[node] = [];
  }

  // ─────────────────────────────────────────
  // GROUP nodes into connected components
  // (undirected connectivity, ignoring edge direction)
  // ─────────────────────────────────────────
  const visited = new Set();
  const groups = [];

  function collectGroup(start) {
    const stack = [start];
    const group = new Set();
    // Build undirected adjacency for grouping
    while (stack.length) {
      const n = stack.pop();
      if (group.has(n)) continue;
      group.add(n);
      // neighbours via children edges (both directions)
      for (const child of (children[n] || [])) {
        if (!group.has(child)) stack.push(child);
      }
      // also walk up via parentOf
      const par = parentOf[n];
      if (par !== undefined && !group.has(par)) stack.push(par);
    }
    return group;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const group = collectGroup(node);
      for (const n of group) visited.add(n);
      groups.push(group);
    }
  }

  // ─────────────────────────────────────────
  // STEP 4 — CYCLE DETECTION (per group)
  // ─────────────────────────────────────────
  function hasCycle(groupNodes) {
    const color = {}; // 0=white, 1=gray, 2=black

    function dfs(n) {
      color[n] = 1; // gray — in recursion stack
      for (const child of (children[n] || [])) {
        if (!groupNodes.has(child)) continue;
        if (color[child] === 1) return true; // back-edge → cycle
        if (!color[child] && dfs(child)) return true;
      }
      color[n] = 2;
      return false;
    }

    for (const n of groupNodes) {
      if (!color[n]) {
        if (dfs(n)) return true;
      }
    }
    return false;
  }

  // ─────────────────────────────────────────
  // STEP 5+6 — BUILD NESTED TREE + DEPTH
  // ─────────────────────────────────────────
  function buildTree(node) {
    const result = {};
    for (const child of (children[node] || [])) {
      result[child] = buildTree(child);
    }
    return result;
  }

  function calcDepth(node) {
    const kids = children[node] || [];
    if (kids.length === 0) return 1;
    return 1 + Math.max(...kids.map(calcDepth));
  }

  // ─────────────────────────────────────────
  // ASSEMBLE HIERARCHIES
  // ─────────────────────────────────────────
  const hierarchies = [];

  for (const groupSet of groups) {
    const groupNodes = [...groupSet];
    const cyclic = hasCycle(groupSet);

    // Find root(s): nodes with no parent in this group
    const roots = groupNodes.filter(n => parentOf[n] === undefined);

    let root;
    if (roots.length === 0) {
      // Pure cycle — pick lexicographically smallest
      root = [...groupNodes].sort()[0];
    } else {
      // If multiple roots (disconnected sub-roots), pick lex smallest
      root = roots.sort()[0];
    }

    if (cyclic) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = { [root]: buildTree(root) };
      const depth = calcDepth(root);
      hierarchies.push({ root, tree, depth });
    }
  }

  // ─────────────────────────────────────────
  // STEP 7 — SUMMARY
  // ─────────────────────────────────────────
  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic    = hierarchies.filter(h =>  h.has_cycle);

  let largest_tree_root = null;
  if (nonCyclic.length > 0) {
    // Sort: descending depth, then ascending root name (lex)
    const sorted = [...nonCyclic].sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root);
    });
    largest_tree_root = sorted[0].root;
  }

  const summary = {
    total_trees:       nonCyclic.length,
    total_cycles:      cyclic.length,
    largest_tree_root,
  };

  return { hierarchies, invalid_entries, duplicate_edges, summary };
};
