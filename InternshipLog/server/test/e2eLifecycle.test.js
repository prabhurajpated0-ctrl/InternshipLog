const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

const runE2ETest = async () => {
  console.log('====================================================');
  console.log('🏁 FINAL E2E LIFECYCLE TEST');
  console.log('====================================================\n');

  let mongod;
  let server;
  let baseUrl;

  try {
    // 1. Boot In-Memory MongoDB & Connect
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ In-memory database connected');

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`✅ Server listening on port ${port}\n`);

    // STEP 1: Confirm initial empty metrics
    console.log('--- Step 1: Check initial empty metrics ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.total, 0);
      assert.strictEqual(data.data.upcomingFollowUpsCount, 0);
      console.log(`Initial stats: total=${data.data.total}, upcomingFollowUps=${data.data.upcomingFollowUpsCount}`);
    }

    // STEP 2: CREATE
    console.log('\n--- Step 2: Create application (Airbnb, Wishlist) ---');
    let appId;
    {
      const payload = {
        company: 'Airbnb',
        role: 'SWE Intern',
        stage: 'Wishlist',
        location: 'San Francisco, CA',
      };
      const res = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.success, true);
      appId = data.data._id;
      assert.ok(appId);
      console.log(`✅ Created application with ID: ${appId}, stage: ${data.data.stage}`);
    }

    // STEP 3: Confirm metrics incremented
    console.log('\n--- Step 3: Confirm Dashboard metrics updated after create ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const data = await res.json();
      assert.strictEqual(data.data.total, 1);
      assert.strictEqual(data.data.byStage['Wishlist'], 1);
      assert.strictEqual(data.data.byStage['Interview'], 0);
      console.log(`✅ Dashboard stats updated: total=1, Wishlist=1`);
    }

    // STEP 4: EDIT fields
    console.log('\n--- Step 4: Edit details (Role & Link) ---');
    {
      const updatePayload = {
        role: 'Full Stack Engineer Intern',
        link: 'https://careers.airbnb.com/positions/1234',
        notes: 'Updated tailored portfolio link.',
      };
      const res = await fetch(`${baseUrl}/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.role, 'Full Stack Engineer Intern');
      assert.strictEqual(data.data.link, 'https://careers.airbnb.com/positions/1234');
      console.log(`✅ Updated role to: "${data.data.role}"`);
    }

    // STEP 5: MOVE STAGE
    console.log('\n--- Step 5: Move stage from Wishlist to Interview ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'Interview' }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.stage, 'Interview');
      console.log(`✅ Stage updated to: ${data.data.stage}`);
    }

    // STEP 6: Confirm metrics reflect stage shift
    console.log('\n--- Step 6: Confirm Dashboard metrics reflect stage change ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const data = await res.json();
      assert.strictEqual(data.data.total, 1);
      assert.strictEqual(data.data.byStage['Wishlist'], 0);
      assert.strictEqual(data.data.byStage['Interview'], 1);
      console.log(`✅ Dashboard stats updated: Wishlist=0, Interview=1`);
    }

    // STEP 7: SET FOLLOW-UP
    console.log('\n--- Step 7: Set upcoming follow-up date and note ---');
    {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const followUpStr = tomorrow.toISOString().split('T')[0];

      const res = await fetch(`${baseUrl}/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpDate: followUpStr,
          followUpNote: 'Prepare STAR stories and questions for hiring manager',
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      console.log(`✅ Follow-up set for: ${followUpStr}`);

      // Verify in upcoming follow-ups endpoint
      const followUpRes = await fetch(`${baseUrl}/api/applications/followups/upcoming?days=7`);
      const followUpData = await followUpRes.json();
      assert.strictEqual(followUpData.count, 1);
      assert.strictEqual(followUpData.data[0]._id, appId);
      console.log(`✅ Appears in GET /api/applications/followups/upcoming (count=1)`);

      // Verify in summary stats
      const statsRes = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const statsData = await statsRes.json();
      assert.strictEqual(statsData.data.upcomingFollowUpsCount, 1);
      console.log(`✅ Dashboard upcomingFollowUpsCount updated to 1`);
    }

    // STEP 8: DELETE
    console.log('\n--- Step 8: Delete application ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/${appId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      console.log(`✅ Application deleted successfully`);
    }

    // STEP 9: Confirm dashboard metrics return to 0
    console.log('\n--- Step 9: Confirm Dashboard metrics updated to 0 ---');
    {
      const res = await fetch(`${baseUrl}/api/applications/stats/summary`);
      const data = await res.json();
      assert.strictEqual(data.data.total, 0);
      assert.strictEqual(data.data.byStage['Interview'], 0);
      assert.strictEqual(data.data.upcomingFollowUpsCount, 0);
      console.log(`✅ Final stats: total=${data.data.total}, Interview=0, upcomingFollowUps=0`);
    }

    console.log('\n====================================================');
    console.log('🎉 FULL END-TO-END LIFECYCLE COMPLETED WITH 100% SUCCESS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ E2E Test failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

runE2ETest();
