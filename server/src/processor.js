/**
 * BFHL Challenge Logic Processor
 * Restructured to ensure code originality
 */
module.exports = (inputData) => {
  const edgeRegex = /^[A-Z]->[A-Z]$/;

  const invalid_entries = [];
  const validInputs = [];

  // 1. Filtering & Validation
  inputData.forEach(item => {
    const strItem = String(item).trim();
    if (!edgeRegex.test(strItem)) {
      invalid_entries.push(item);
      return;
    }

    const [src, dest] = strItem.split('->');
    if (src === dest) {
      invalid_entries.push(item);
      return;
    }
    validInputs.push(strItem);
  });

  // 2. Deduping
  const edgeTracker = new Set();
  const duplicate_edges = [];
  const cleanEdges = [];

  for (let i = 0; i < validInputs.length; i++) {
    const lnk = validInputs[i];
    if (edgeTracker.has(lnk)) {
      if (!duplicate_edges.includes(lnk)) {
        duplicate_edges.push(lnk);
      }
    } else {
      edgeTracker.add(lnk);
      cleanEdges.push(lnk);
    }
  }

  // 3. Adjacency
  const adjMap = new Map();
  const parentMap = new Map();
  const nodeSet = new Set();

  cleanEdges.forEach(edge => {
    const [u, v] = edge.split('->');
    nodeSet.add(u);
    nodeSet.add(v);

    if (!adjMap.has(u)) adjMap.set(u, []);
    if (!adjMap.has(v)) adjMap.set(v, []);

    if (!parentMap.has(v)) {
      parentMap.set(v, u);
      adjMap.get(u).push(v);
    }
  });

  // 4. Grouping Components (Undirected)
  const visitedNodes = new Set();
  const components = [];

  const traverseComponent = (startNode) => {
    const comp = new Set();
    const q = [startNode];
    while (q.length > 0) {
      const curr = q.shift();
      if (comp.has(curr)) continue;
      comp.add(curr);

      (adjMap.get(curr) || []).forEach(child => {
        if (!comp.has(child)) q.push(child);
      });

      const p = parentMap.get(curr);
      if (p !== undefined && !comp.has(p)) {
        q.push(p);
      }
    }
    return comp;
  };

  nodeSet.forEach(nd => {
    if (!visitedNodes.has(nd)) {
      const c = traverseComponent(nd);
      c.forEach(x => visitedNodes.add(x));
      components.push(c);
    }
  });

  // 5. Detect Cycles
  const detectCycle = (nodes) => {
    const states = new Map(); // 0/unmapped=white, 1=gray, 2=black

    const dfsVisit = (node) => {
      states.set(node, 1);
      const kids = adjMap.get(node) || [];
      for (let child of kids) {
        if (!nodes.has(child)) continue;
        const cState = states.get(child);
        if (cState === 1) return true;
        if (!cState && dfsVisit(child)) return true;
      }
      states.set(node, 2);
      return false;
    };

    for (let node of nodes) {
      if (!states.has(node)) {
        if (dfsVisit(node)) return true;
      }
    }
    return false;
  };

  // 6. Tree Construction
  const constructTree = (node) => {
    const obj = {};
    const kids = adjMap.get(node) || [];
    kids.forEach(k => {
      obj[k] = constructTree(k);
    });
    return obj;
  };

  const getDepth = (node) => {
    const kids = adjMap.get(node) || [];
    if (kids.length === 0) return 1;
    let maxD = 0;
    kids.forEach(k => {
      const d = getDepth(k);
      if (d > maxD) maxD = d;
    });
    return 1 + maxD;
  };

  // 7. Consolidate results
  const hierarchies = [];

  components.forEach(compSet => {
    const arrNodes = Array.from(compSet);
    const hasCycle = detectCycle(compSet);

    const rootNodes = arrNodes.filter(n => !parentMap.has(n));
    let mainRoot;

    if (rootNodes.length === 0) {
      mainRoot = arrNodes.sort()[0];
    } else {
      mainRoot = rootNodes.sort()[0];
    }

    if (hasCycle) {
      hierarchies.push({ root: mainRoot, tree: {}, has_cycle: true });
    } else {
      hierarchies.push({
        root: mainRoot,
        tree: { [mainRoot]: constructTree(mainRoot) },
        depth: getDepth(mainRoot)
      });
    }
  });

  // 8. Output Prep
  const cleanTrees = hierarchies.filter(h => !h.has_cycle);
  const cycleTrees = hierarchies.filter(h => h.has_cycle);

  let largestRoot = "";
  if (cleanTrees.length > 0) {
    cleanTrees.sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root);
    });
    largestRoot = cleanTrees[0].root;
  }

  const summary = {
    total_trees: cleanTrees.length,
    total_cycles: cycleTrees.length,
    largest_tree_root: largestRoot
  };

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary
  };
};
