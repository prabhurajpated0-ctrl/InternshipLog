const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { seedDB } = require('../src/seeds/seed');
const { Application } = require('../src/models/Application');

const runTests = async () => {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE ENDPOINT & VALIDATION SUITE');
  console.log('====================================================\n');

  let mongod;
  let server;
  let baseUrl;
  let testAppId;

  const testResults = [];

  const recordResult = (endpoint, method, description, status, passed, details = '') => {
    testResults.push({
      Method: method,
      Endpoint: endpoint,
      Description: description,
      Status: status,
      Passed: passed ? '✅ PASS' : '❌ FAIL',
      Details: details,
    });
  };

  try {
    // 1. Boot In-Memory MongoDB
    console.log('[Setup] Starting in-memory MongoDB server...');
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    console.log(`[Setup] In-memory MongoDB running at: ${mongoUri}`);

    // Connect Mongoose
    await mongoose.connect(mongoUri);
    console.log('[Setup] Mongoose connected successfully.');

    // 2. Seed 12 sample applications
    console.log('\n[Setup] Running seed script to insert 12 realistic applications...');
    const seeded = await seedDB(mongoUri);
    testAppId = seeded[0]._id.toString();
    console.log(`[Setup] Seeded ${seeded.length} applications. Sample ID: ${testAppId}`);

    // 3. Start Express app
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Setup] Express test server listening on port ${port}\n`);

    // =========================================================================
    // ENDPOINT 1: GET /api/health
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/health`);
      const data = await res.json();
      const passed = res.status === 200 && data.status === 'ok' && data.database === 'connected';
      recordResult('/api/health', 'GET', 'Health check with live database', res.status, passed, `Database: ${data.database}`);
    }

    // =========================================================================
    // ENDPOINT 2: GET /api/applications (Fetch all)
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications`);
      const data = await res.json();
      const passed = res.status === 200 && data.success === true && data.count === 12;
      recordResult('/api/applications', 'GET', 'Fetch all applications (count=12)', res.status, passed, `Returned: ${data.count}`);
    }

    // =========================================================================
    // ENDPOINT 3: GET /api/applications?stage=Interview
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications?stage=Interview`);
      const data = await res.json();
      const passed = res.status === 200 && data.count === 2 && data.data.every(a => a.stage === 'Interview');
      recordResult('/api/applications?stage=Interview', 'GET', 'Filter applications by stage', res.status, passed, `Found: ${data.count} Interview apps`);
    }

    // =========================================================================
    // ENDPOINT 4: GET /api/applications?search=Google
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications?search=Google`);
      const data = await res.json();
      const passed = res.status === 200 && data.count >= 1 && data.data.some(a => a.company === 'Google');
      recordResult('/api/applications?search=Google', 'GET', 'Search by company/role keyword', res.status, passed, `Found: ${data.count} match(es)`);
    }

    // =========================================================================
    // ENDPOINT 5: GET /api/applications/followups/upcoming (Default 7 days)
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/followups/upcoming`);
      const data = await res.json();
      const hasOverdue = data.data.some(a => a.overdue === true && a.isOverdue === true);
      const noExcludedStages = data.data.every(a => a.stage !== 'Offer' && a.stage !== 'Rejected');
      const passed = res.status === 200 && hasOverdue && noExcludedStages;
      recordResult('/api/applications/followups/upcoming', 'GET', 'Upcoming & overdue follow-ups (next 7 days)', res.status, passed, `Count: ${data.count}, Has overdue: ${hasOverdue}`);
    }

    // =========================================================================
    // ENDPOINT 6: GET /api/applications/followups/upcoming?days=14
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/followups/upcoming?days=14`);
      const data = await res.json();
      const passed = res.status === 200 && data.daysWindow === 14;
      recordResult('/api/applications/followups/upcoming?days=14', 'GET', 'Upcoming follow-ups with custom ?days= window', res.status, passed, `Days window: ${data.daysWindow}, Count: ${data.count}`);
    }

    // =========================================================================
    // ENDPOINT 7: GET /api/applications/stats/summary
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const data = await res.json();
      const s = data.data;
      const passed = res.status === 200 && s.total === 12 && s.byStage && s.byStage['Interview'] === 2 && typeof s.upcomingDeadlinesCount === 'number';
      recordResult('/api/applications/stats/summary', 'GET', 'Summary statistics using MongoDB aggregation', res.status, passed, `Total: ${s.total}, Deadlines: ${s.upcomingDeadlinesCount}`);
    }

    // =========================================================================
    // ENDPOINT 8: GET /api/applications/:id (Valid ID)
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/${testAppId}`);
      const data = await res.json();
      const passed = res.status === 200 && data.success === true && data.data._id === testAppId;
      recordResult(`/api/applications/:id`, 'GET', 'Fetch single application by valid ObjectId', res.status, passed, `Company: ${data.data.company}`);
    }

    // =========================================================================
    // ENDPOINT 9: GET /api/applications/:id (Invalid ObjectId format) [INVALID INPUT]
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/invalid-id-123`);
      const data = await res.json();
      const passed = res.status === 400 && data.success === false && data.errors.some(e => e.field === 'id');
      recordResult(`/api/applications/invalid-id-123`, 'GET', '[INVALID] Reject malformed ObjectId param', res.status, passed, `Error: ${data.errors?.[0]?.message}`);
    }

    // =========================================================================
    // ENDPOINT 10: GET /api/applications/:id (Non-existent ObjectId) [404]
    // =========================================================================
    {
      const nonExistentId = '507f1f77bcf86cd799439099';
      const res = await fetch(`${baseUrl}/api/applications/${nonExistentId}`);
      const data = await res.json();
      const passed = res.status === 404 && data.success === false;
      recordResult(`/api/applications/${nonExistentId}`, 'GET', '[404] Non-existent ObjectId returns 404', res.status, passed, data.message);
    }

    // =========================================================================
    // ENDPOINT 11: POST /api/applications (Valid create)
    // =========================================================================
    let createdId;
    {
      const payload = {
        company: 'Palantir',
        role: 'Forward Deployed SWE Intern',
        stage: 'Applied',
        deadline: '2026-12-15',
        appliedDate: '2026-11-16',
        followUpDate: '2026-11-23',
        followUpNote: 'Reach out to recruiter on LinkedIn',
        location: 'New York, NY',
        link: 'https://palantir.com/careers/fdse-intern',
        notes: 'Submitted application via campus recruiting portal.',
      };
      const res = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      createdId = data.data?._id;
      const passed = res.status === 201 && data.success === true && createdId;
      recordResult('/api/applications', 'POST', 'Create new application successfully', res.status, passed, `Created ID: ${createdId}`);
    }

    // =========================================================================
    // ENDPOINT 12: POST /api/applications (Missing required fields) [INVALID INPUT]
    // =========================================================================
    {
      const payload = { notes: 'Missing company and role' };
      const res = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const hasCompanyError = data.errors?.some(e => e.field === 'company');
      const hasRoleError = data.errors?.some(e => e.field === 'role');
      const passed = res.status === 400 && hasCompanyError && hasRoleError;
      recordResult('/api/applications', 'POST', '[INVALID] Missing company & role returns 400', res.status, passed, `Errors: ${data.errors?.length} field validation errors`);
    }

    // =========================================================================
    // ENDPOINT 13: POST /api/applications (Invalid stage enum & bad date) [INVALID INPUT]
    // =========================================================================
    {
      const payload = {
        company: 'Apple',
        role: 'iOS Engineer Intern',
        stage: 'UnderReview', // Invalid stage
        deadline: 'invalid-date-format', // Invalid date
      };
      const res = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const hasStageError = data.errors?.some(e => e.field === 'stage');
      const hasDateError = data.errors?.some(e => e.field === 'deadline');
      const passed = res.status === 400 && hasStageError && hasDateError;
      recordResult('/api/applications', 'POST', '[INVALID] Invalid stage enum & bad date format', res.status, passed, `Errors caught: ${data.errors?.map(e => e.field).join(', ')}`);
    }

    // =========================================================================
    // ENDPOINT 14: PUT /api/applications/:id (Valid update)
    // =========================================================================
    {
      const updatePayload = {
        stage: 'Interview',
        notes: 'Recruiter reached out! First round interview confirmed.',
      };
      const res = await fetch(`${baseUrl}/api/applications/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.data.stage === 'Interview';
      recordResult(`/api/applications/:id`, 'PUT', 'Update application stage & notes', res.status, passed, `New stage: ${data.data.stage}`);
    }

    // =========================================================================
    // ENDPOINT 15: PUT /api/applications/:id (Invalid update data) [INVALID INPUT]
    // =========================================================================
    {
      const updatePayload = {
        stage: 'NotAValidStage',
        link: 'ht!tp://not a url',
      };
      const res = await fetch(`${baseUrl}/api/applications/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.errors?.some(e => e.field === 'stage');
      recordResult(`/api/applications/:id`, 'PUT', '[INVALID] Reject invalid stage in update', res.status, passed, `Errors: ${data.errors?.[0]?.message}`);
    }

    // =========================================================================
    // ENDPOINT 16: DELETE /api/applications/:id (Valid delete)
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/${createdId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      const passed = res.status === 200 && data.success === true;
      recordResult(`/api/applications/:id`, 'DELETE', 'Delete application by ID', res.status, passed, data.message);
    }

    // =========================================================================
    // ENDPOINT 17: DELETE /api/applications/:id (Non-existent ID) [404]
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/${createdId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      const passed = res.status === 404 && data.success === false;
      recordResult(`/api/applications/:id`, 'DELETE', '[404] Delete non-existent ID returns 404', res.status, passed, data.message);
    }

    // =========================================================================
    // ENDPOINT 18: DELETE /api/applications/:id (Invalid ObjectId format) [INVALID INPUT]
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/applications/123-bad-id`, {
        method: 'DELETE',
      });
      const data = await res.json();
      const passed = res.status === 400 && data.errors?.some(e => e.field === 'id');
      recordResult(`/api/applications/123-bad-id`, 'DELETE', '[INVALID] Reject malformed ObjectId on DELETE', res.status, passed, data.errors?.[0]?.message);
    }

    // =========================================================================
    // ENDPOINT 19: GET /nonexistent-route [404 Handler]
    // =========================================================================
    {
      const res = await fetch(`${baseUrl}/api/nonexistent-route-404`);
      const data = await res.json();
      const passed = res.status === 404 && data.success === false;
      recordResult('/api/nonexistent-route-404', 'GET', '[404] Centralized 404 handler for unknown routes', res.status, passed, data.message);
    }

    // =========================================================================
    // REPORT SUMMARY
    // =========================================================================
    console.log('====================================================');
    console.log('📋 COMPLETE ENDPOINT TEST EXECUTION RESULTS');
    console.log('====================================================\n');
    console.table(testResults);

    const allPassed = testResults.every(r => r.Passed === '✅ PASS');
    console.log(`\nResults: ${testResults.filter(r => r.Passed === '✅ PASS').length} / ${testResults.length} passed.`);

    if (allPassed) {
      console.log('\n🎉 ALL 19 ENDPOINT TESTS PASSED WITH ZERO ERRORS!\n');
    } else {
      console.error('\n❌ SOME TESTS FAILED!\n');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

runTests();
