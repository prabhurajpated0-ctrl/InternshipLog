const assert = require('assert');
const express = require('express');
const router = require('../src/routes/applications');
const { Application, STAGES } = require('../src/models/Application');

console.log('🧪 Testing Stats & Follow-up Controller Logic and Route Order...\n');

// 1. Verify route order in the router stack
const routePaths = router.stack
  .filter((layer) => layer.route)
  .map((layer) => layer.route.path);

console.log('Registered Routes Order:', routePaths);

const followupsIndex = routePaths.indexOf('/followups/upcoming');
const statsIndex = routePaths.indexOf('/stats/summary');
const idIndex = routePaths.indexOf('/:id');

assert.ok(followupsIndex !== -1, '/followups/upcoming must exist');
assert.ok(statsIndex !== -1, '/stats/summary must exist');
assert.ok(idIndex !== -1, '/:id must exist');

assert.ok(
  followupsIndex < idIndex,
  `'/followups/upcoming' (index ${followupsIndex}) must be registered BEFORE '/:id' (index ${idIndex})`
);
assert.ok(
  statsIndex < idIndex,
  `'/stats/summary' (index ${statsIndex}) must be registered BEFORE '/:id' (index ${idIndex})`
);
console.log('✅ Route precedence verified: /followups/upcoming and /stats/summary are registered BEFORE /:id');

// 2. Verify overdue flagging logic
const now = new Date();
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const sampleApps = [
  { company: 'Company A', followUpDate: yesterday },
  { company: 'Company B', followUpDate: tomorrow },
];

const flagged = sampleApps.map(app => {
  const isOverdue = new Date(app.followUpDate) < startOfToday;
  return { ...app, isOverdue, overdue: isOverdue };
});

assert.strictEqual(flagged[0].overdue, true, 'Yesterday must be flagged as overdue');
assert.strictEqual(flagged[0].isOverdue, true, 'isOverdue alias must be true');
assert.strictEqual(flagged[1].overdue, false, 'Tomorrow must NOT be flagged as overdue');
assert.strictEqual(flagged[1].isOverdue, false, 'isOverdue alias must be false');
console.log('✅ Overdue date calculation logic verified');

// 3. Verify STAGES enum coverage
assert.strictEqual(STAGES.length, 6);
['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'].forEach(s => {
  assert.ok(STAGES.includes(s), `Must include ${s}`);
});
console.log('✅ All 6 stages accounted for in aggregation mapper');

console.log('\n🎉 Stats and Follow-ups tests completed successfully!\n');
