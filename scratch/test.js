const processData = require('../server/src/processor.js');

function runTest(name, data, expected) {
  console.log('--- ' + name + ' ---');
  if (data === null) {
      // test 9
      return;
  }
  const result = processData(data);
  console.log(JSON.stringify(result, null, 2));
}

runTest('TEST 1', ["A->B","A->C","B->D","C->E","E->F","X->Y","Y->Z","Z->X","P->Q","Q->R","G->H","G->H","G->I","hello","1->2","A->"]);
runTest('TEST 2', ["X->Y","Y->Z","Z->X"]);
runTest('TEST 3', ["A->D","B->D","A->E","B->F"]);
runTest('TEST 4', ["A->B","A->B","A->B"]);
runTest('TEST 5', []);
runTest('TEST 6', ["  A->B  ","  ","   "]);
runTest('TEST 7', ["A->A","B->C"]);
runTest('TEST 8', ["A->B","C->D"]);
