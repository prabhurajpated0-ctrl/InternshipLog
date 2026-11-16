const assert = require('assert');
const express = require('express');
const {
  validateCreate,
  validateUpdate,
  validateObjectId,
} = require('../src/middleware/validate');
const { notFound, errorHandler } = require('../src/middleware/errorHandler');
const { STAGES } = require('../src/models/Application');

console.log('🧪 Running Comprehensive Middleware, Validation & ErrorHandler Tests...\n');

const app = express();
app.use(express.json());

// Test route for create
app.post('/test/create', validateCreate, (req, res) => {
  res.status(201).json({ success: true, data: req.body });
});

// Test route for update with param :id
app.put('/test/update/:id', validateUpdate, (req, res) => {
  res.status(200).json({ success: true, id: req.params.id, data: req.body });
});

// Test route for get by :id
app.get('/test/item/:id', validateObjectId, (req, res) => {
  res.status(200).json({ success: true, id: req.params.id });
});

// Simulated error routes to test central errorHandler
app.get('/test/error/validation', (req, res, next) => {
  const err = new Error('Validation failed');
  err.name = 'ValidationError';
  err.errors = {
    company: { path: 'company', message: 'Company is required', value: '' },
  };
  next(err);
});

app.get('/test/error/cast', (req, res, next) => {
  const err = new Error('Cast to ObjectId failed');
  err.name = 'CastError';
  err.path = '_id';
  err.value = 'invalid-id';
  err.kind = 'ObjectId';
  next(err);
});

app.get('/test/error/duplicate', (req, res, next) => {
  const err = new Error('Duplicate key error');
  err.code = 11000;
  err.keyValue = { company: 'Google' };
  next(err);
});

// Mount 404 and error handlers
app.use(notFound);
app.use(errorHandler);

const server = app.listen(5098, async () => {
  try {
    const baseUrl = 'http://localhost:5098';

    // 1. Test missing fields on create
    {
      const res = await fetch(`${baseUrl}/test/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'missing company and role' }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(Array.isArray(data.errors));
      assert.ok(data.errors.some(e => e.field === 'company'));
      assert.ok(data.errors.some(e => e.field === 'role'));
      console.log('✅ validateCreate: Rejects missing company & role with field errors list');
    }

    // 2. Test length limits
    {
      const res = await fetch(`${baseUrl}/test/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: 'A'.repeat(101),
          role: 'SWE',
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.ok(data.errors.some(e => e.field === 'company' && e.message.includes('cannot exceed 100 characters')));
      console.log('✅ validateCreate: Enforces length limit (100 chars) on company');
    }

    // 3. Test invalid stage enum
    {
      const res = await fetch(`${baseUrl}/test/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: 'Microsoft',
          role: 'Explorer Intern',
          stage: 'Pending',
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.ok(data.errors.some(e => e.field === 'stage' && e.message.includes('Stage must be one of')));
      console.log('✅ validateCreate: Enforces stage enum check');
    }

    // 4. Test invalid ISO date
    {
      const res = await fetch(`${baseUrl}/test/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: 'Amazon',
          role: 'SDE Intern',
          deadline: 'not-a-date',
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.ok(data.errors.some(e => e.field === 'deadline'));
      console.log('✅ validateCreate: Rejects invalid ISO date');
    }

    // 5. Test invalid ObjectId param
    {
      const res = await fetch(`${baseUrl}/test/item/not-a-valid-id`);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.ok(data.errors.some(e => e.field === 'id' && e.message.includes('must be a 24-character hexadecimal ObjectId')));
      console.log('✅ validateObjectId: Rejects invalid ObjectId in URL param');
    }

    // 6. Test valid ObjectId param
    {
      const validId = '507f1f77bcf86cd799439011';
      const res = await fetch(`${baseUrl}/test/item/${validId}`);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.id, validId);
      console.log('✅ validateObjectId: Accepts valid 24-char ObjectId');
    }

    // 7. Test Mongoose ValidationError handler
    {
      const res = await fetch(`${baseUrl}/test/error/validation`);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.errors.some(e => e.field === 'company'));
      console.log('✅ errorHandler: Formats Mongoose ValidationError');
    }

    // 8. Test Mongoose CastError handler
    {
      const res = await fetch(`${baseUrl}/test/error/cast`);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.errors.some(e => e.field === '_id'));
      console.log('✅ errorHandler: Formats Mongoose CastError');
    }

    // 9. Test duplicate key error handler
    {
      const res = await fetch(`${baseUrl}/test/error/duplicate`);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Duplicate key error'));
      console.log('✅ errorHandler: Formats duplicate key (11000) error');
    }

    // 10. Test 404 handler
    {
      const res = await fetch(`${baseUrl}/unknown-route-12345`);
      const data = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Resource not found'));
      console.log('✅ notFound: Returns 404 for nonexistent routes');
    }

    console.log('\n🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY!\n');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
