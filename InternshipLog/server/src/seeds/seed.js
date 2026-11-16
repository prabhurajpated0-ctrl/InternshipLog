const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Application, STAGES } = require('../models/Application');
const connectDB = require('../config/db');

const getRelativeDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(12, 0, 0, 0);
  return d;
};

const sampleApplications = [
  // 1. Wishlist - preparing resume, deadline in 5 days
  {
    company: 'Stripe',
    role: 'Software Engineering Intern - Infrastructure',
    stage: 'Wishlist',
    deadline: getRelativeDate(5),
    appliedDate: null,
    followUpDate: getRelativeDate(2),
    followUpNote: 'Ask college alum on LinkedIn for a referral before applying',
    location: 'San Francisco, CA / Remote',
    link: 'https://stripe.com/jobs/infrastructure-intern',
    notes: 'Drafted tailored resume highlighting distributed systems projects.',
  },
  // 2. Wishlist - deadline in 12 days
  {
    company: 'Figma',
    role: 'Product Design & Engineering Intern',
    stage: 'Wishlist',
    deadline: getRelativeDate(12),
    appliedDate: null,
    followUpDate: null,
    followUpNote: '',
    location: 'San Francisco, CA',
    link: 'https://careers.figma.com/design-intern',
    notes: 'Need to update online portfolio with recent React canvas demo.',
  },
  // 3. Applied - recently applied, follow-up due in 3 days
  {
    company: 'Google',
    role: 'Software Engineering Intern, Summer 2027',
    stage: 'Applied',
    deadline: getRelativeDate(10),
    appliedDate: getRelativeDate(-4),
    followUpDate: getRelativeDate(3),
    followUpNote: 'Check applicant portal for questionnaire status',
    location: 'Mountain View, CA / Hybrid',
    link: 'https://careers.google.com/jobs/results/swe-intern',
    notes: 'Submitted application with referral from university fair.',
  },
  // 4. Applied - follow-up is OVERDUE (5 days ago)
  {
    company: 'Microsoft',
    role: 'Explore Intern (Freshmen & Sophomores)',
    stage: 'Applied',
    deadline: getRelativeDate(-10),
    appliedDate: getRelativeDate(-18),
    followUpDate: getRelativeDate(-5),
    followUpNote: 'Send gentle follow-up email to university recruiter',
    location: 'Redmond, WA',
    link: 'https://careers.microsoft.com/explore-intern',
    notes: 'Applied through Handshake, recruiter reached out at career day.',
  },
  // 5. OA/Screening - assessment due in 2 days (upcoming deadline & follow-up)
  {
    company: 'Amazon',
    role: 'Software Development Engineer Intern',
    stage: 'OA/Screening',
    deadline: getRelativeDate(2),
    appliedDate: getRelativeDate(-12),
    followUpDate: getRelativeDate(1),
    followUpNote: 'Complete Hackerrank Part 1 & Part 2',
    location: 'Seattle, WA',
    link: 'https://amazon.jobs/sde-intern',
    notes: 'Received 90-minute OA link on Hackerrank. Need to review graphs and sliding window.',
  },
  // 6. OA/Screening - follow-up is OVERDUE (2 days ago)
  {
    company: 'Datadog',
    role: 'Backend Engineering Intern',
    stage: 'OA/Screening',
    deadline: getRelativeDate(4),
    appliedDate: getRelativeDate(-14),
    followUpDate: getRelativeDate(-2),
    followUpNote: 'Confirm OA submission was received by HR',
    location: 'New York, NY',
    link: 'https://careers.datadoghq.com/backend-intern',
    notes: 'Completed Codesignal test with 810/850 score. Waiting for recruiter review.',
  },
  // 7. Interview - Technical round scheduled in 4 days
  {
    company: 'Meta',
    role: 'Software Engineer Intern',
    stage: 'Interview',
    deadline: getRelativeDate(20),
    appliedDate: getRelativeDate(-25),
    followUpDate: getRelativeDate(4),
    followUpNote: 'Technical Round 1 (Data Structures & Algorithms)',
    location: 'Menlo Park, CA / Hybrid',
    link: 'https://metacareers.com/swe-intern',
    notes: 'Passed initial recruiter phone screen. Interviewer confirmed 45 min CoderPad session.',
  },
  // 8. Interview - System design / Behavioral interview tomorrow
  {
    company: 'Uber',
    role: 'Frontend Engineering Intern',
    stage: 'Interview',
    deadline: getRelativeDate(15),
    appliedDate: getRelativeDate(-20),
    followUpDate: getRelativeDate(1),
    followUpNote: 'Prepare STAR stories and questions for hiring manager',
    location: 'San Francisco, CA',
    link: 'https://uber.com/careers/frontend-intern',
    notes: 'Passed phone screen. Final round with 2 engineers on React performance and state architecture.',
  },
  // 9. Offer - Accepted or pending decision
  {
    company: 'Cloudflare',
    role: 'Systems Engineering Intern',
    stage: 'Offer',
    deadline: getRelativeDate(7),
    appliedDate: getRelativeDate(-45),
    followUpDate: null,
    followUpNote: '',
    location: 'Austin, TX / Remote',
    link: 'https://cloudflare.com/careers/systems-intern',
    notes: 'Received written offer: $55/hr + relocation stipend. Deadline to decide is next Monday.',
  },
  // 10. Offer - Competing offer
  {
    company: 'Spotify',
    role: 'Web Development Intern',
    stage: 'Offer',
    deadline: getRelativeDate(14),
    appliedDate: getRelativeDate(-40),
    followUpDate: null,
    followUpNote: '',
    location: 'New York, NY / Hybrid',
    link: 'https://spotifyjobs.com/intern-web',
    notes: 'Offer letter received! Great team working on Web Player playlist personalization.',
  },
  // 11. Rejected - After OA
  {
    company: 'Netflix',
    role: 'Software Engineering Intern',
    stage: 'Rejected',
    deadline: null,
    appliedDate: getRelativeDate(-30),
    followUpDate: null,
    followUpNote: '',
    location: 'Los Gatos, CA',
    link: 'https://jobs.netflix.com/intern',
    notes: 'Automated rejection email received. High competition for limited summer cohort.',
  },
  // 12. Rejected - After final round
  {
    company: 'Airbnb',
    role: 'Full Stack Engineering Intern',
    stage: 'Rejected',
    deadline: null,
    appliedDate: getRelativeDate(-35),
    followUpDate: null,
    followUpNote: '',
    location: 'San Francisco, CA',
    link: 'https://careers.airbnb.com/university',
    notes: 'Reached final round. Good feedback on system design but went with another candidate.',
  },
];

const seedDB = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI;

  try {
    console.log('[Seed] Connecting to MongoDB...');
    const conn = await mongoose.connect(uri);
    console.log(`[Seed] Connected to ${conn.connection.host}`);

    // Clear existing applications
    const deleted = await Application.deleteMany({});
    console.log(`[Seed] Cleared ${deleted.deletedCount} existing applications.`);

    // Insert 12 sample applications
    const created = await Application.insertMany(sampleApplications);
    console.log(`[Seed] Successfully inserted ${created.length} sample applications!`);

    // Print summary table
    const stageBreakdown = {};
    STAGES.forEach(s => { stageBreakdown[s] = 0; });
    created.forEach(app => { stageBreakdown[app.stage]++; });

    console.log('\n📊 Seeding Breakdown by Stage:');
    console.table(stageBreakdown);

    return created;
  } catch (error) {
    console.error(`[Seed Error] Failed to seed database: ${error.message}`);
    throw error;
  }
};

// If executed directly from command line
if (require.main === module) {
  seedDB()
    .then(() => {
      console.log('\n✅ Database seeding complete!\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Seeding failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seedDB, sampleApplications };
