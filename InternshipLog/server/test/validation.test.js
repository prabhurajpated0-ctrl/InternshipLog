const assert = require('assert');
const { validateApplication } = require('../src/middleware/validate');
const { STAGES } = require('../src/models/Application');

console.log('🧪 Running Validation & Model Unit Tests...\n');

// Mock response object
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

// 1. Verify STAGES
assert.deepStrictEqual(
  STAGES,
  ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'],
  'STAGES enum must match exact requirements'
);
console.log('✅ Stage enum values verified: ' + STAGES.join(', '));

// 2. Test missing company on POST
{
  const req = { method: 'POST', body: { role: 'Frontend Intern' } };
  const res = mockRes();
  let nextCalled = false;
  validateApplication(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(nextCalled, false);
  console.log('✅ Rejects POST without company');
}

// 3. Test missing role on POST
{
  const req = { method: 'POST', body: { company: 'Google' } };
  const res = mockRes();
  let nextCalled = false;
  validateApplication(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(nextCalled, false);
  console.log('✅ Rejects POST without role');
}

// 4. Test invalid stage
{
  const req = { method: 'POST', body: { company: 'Google', role: 'SWE', stage: 'Pending' } };
  const res = mockRes();
  let nextCalled = false;
  validateApplication(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('Invalid stage'));
  assert.strictEqual(nextCalled, false);
  console.log('✅ Rejects invalid stage: Pending');
}

// 5. Test invalid date
{
  const req = { method: 'POST', body: { company: 'Google', role: 'SWE', deadline: 'invalid-date' } };
  const res = mockRes();
  let nextCalled = false;
  validateApplication(req, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message.includes('Invalid date'));
  console.log('✅ Rejects malformed deadline date');
}

// 6. Test valid submission passes to next()
{
  const req = {
    method: 'POST',
    body: {
      company: 'Google',
      role: 'SWE Intern',
      stage: 'Interview',
      deadline: '2026-12-01',
      appliedDate: '2026-11-15',
      followUpDate: '2026-11-20',
      followUpNote: 'Check interview slot confirmation',
      location: 'Mountain View, CA',
      link: 'https://careers.google.com/jobs/123',
      notes: 'Passed OA, technical interview scheduled.',
    },
  };
  const res = mockRes();
  let nextCalled = false;
  validateApplication(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  console.log('✅ Valid application payload passes validation middleware');
}

console.log('\n🎉 All Validation Unit Tests Passed Successfully!\n');
