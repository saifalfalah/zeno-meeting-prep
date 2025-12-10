/**
 * Database seed script for development environment
 *
 * Run with: npm run db:seed
 * or: tsx lib/db/seed.ts
 */

/* eslint-disable no-console */

import { db } from './client';
import {
  users,
  campaigns,
  webhookSubscriptions,
  meetings,
  prospects,
  companies,
  researchBriefs,
  prospectInfo,
  researchSources,
  adHocResearchRequests,
  meetingProspects,
} from './schema';
import { eq } from 'drizzle-orm';

const SEED_USER_EMAIL = 'dev@example.com';
const SEED_USER_GOOGLE_ID = 'google-dev-123';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Check if seed data already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, SEED_USER_EMAIL),
    });

    if (existingUser) {
      console.log('⚠️  Seed data already exists. Skipping...');
      console.log('   To re-seed, first delete the existing data or change SEED_USER_EMAIL');
      return;
    }

    // 2. Create test user
    console.log('👤 Creating test user...');
    const [user] = await db.insert(users).values({
      email: SEED_USER_EMAIL,
      name: 'Dev User',
      googleId: SEED_USER_GOOGLE_ID,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    }).returning();
    console.log(`   ✓ Created user: ${user.email}`);

    // 3. Create test campaign
    console.log('📊 Creating test campaign...');
    const [campaign] = await db.insert(campaigns).values({
      userId: user.id,
      name: 'Sales Campaign Q1 2025',
      status: 'active',
      companyName: 'Acme Corp',
      companyDomain: 'acmecorp.com',
      companyDescription: 'We build innovative sales intelligence tools for B2B companies.',
      offeringTitle: 'AI-Powered Meeting Prep Platform',
      offeringDescription: 'Automated research briefs that help sales teams close deals faster by providing detailed prospect intelligence before every call.',
      targetCustomer: 'B2B sales teams with 10+ salespeople who have 20+ external meetings per week',
      keyPainPoints: JSON.stringify([
        'Spending too much time manually researching prospects',
        'Missing key context before important sales calls',
        'Inconsistent meeting preparation across the team',
      ]),
      googleCalendarId: 'primary',
      googleCalendarName: 'Primary Calendar',
    }).returning();
    console.log(`   ✓ Created campaign: ${campaign.name}`);

    // 4. Create webhook subscription (mock)
    console.log('🔔 Creating webhook subscription...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.insert(webhookSubscriptions).values({
      campaignId: campaign.id,
      googleResourceId: `resource-${Date.now()}`,
      googleChannelId: `channel-${Date.now()}`,
      expiresAt,
      status: 'active',
      lastNotificationAt: new Date(),
    });
    console.log(`   ✓ Created webhook subscription`);

    // 5. Create test companies
    console.log('🏢 Creating test companies...');
    const [company1] = await db.insert(companies).values({
      domain: 'techstartup.com',
      name: 'TechStartup Inc',
      industry: 'Software',
      employeeCount: '50-200',
      revenue: '$5M-$10M',
      fundingStage: 'Series A',
      headquarters: 'San Francisco, CA',
      website: 'https://techstartup.com',
      lastResearchedAt: new Date(),
    }).returning();

    const [company2] = await db.insert(companies).values({
      domain: 'enterpriseco.com',
      name: 'Enterprise Co',
      industry: 'Enterprise Software',
      employeeCount: '500-1000',
      revenue: '$50M-$100M',
      fundingStage: 'Series C',
      headquarters: 'New York, NY',
      website: 'https://enterpriseco.com',
      lastResearchedAt: new Date(),
    }).returning();
    console.log(`   ✓ Created ${2} companies`);

    // 6. Create test prospects
    console.log('👥 Creating test prospects...');
    const [prospect1] = await db.insert(prospects).values({
      email: 'john.smith@techstartup.com',
      name: 'John Smith',
      title: 'VP of Sales',
      companyId: company1.id,
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      lastResearchedAt: new Date(),
    }).returning();

    const [prospect2] = await db.insert(prospects).values({
      email: 'sarah.jones@techstartup.com',
      name: 'Sarah Jones',
      title: 'CRO',
      companyId: company1.id,
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/sarahjones',
      lastResearchedAt: new Date(),
    }).returning();

    const [prospect3] = await db.insert(prospects).values({
      email: 'mike.chen@enterpriseco.com',
      name: 'Mike Chen',
      title: 'Director of Sales Operations',
      companyId: company2.id,
      location: 'New York, NY',
      linkedinUrl: 'https://linkedin.com/in/mikechen',
      lastResearchedAt: new Date(),
    }).returning();
    console.log(`   ✓ Created ${3} prospects`);

    // 7. Create test meetings
    console.log('📅 Creating test meetings...');
    const now = new Date();

    // Meeting 1: Tomorrow at 10 AM (with research brief)
    const meeting1Start = new Date(now);
    meeting1Start.setDate(meeting1Start.getDate() + 1);
    meeting1Start.setHours(10, 0, 0, 0);
    const meeting1End = new Date(meeting1Start);
    meeting1End.setHours(11, 0, 0, 0);

    const [meeting1] = await db.insert(meetings).values({
      campaignId: campaign.id,
      googleEventId: `event-${Date.now()}-1`,
      title: 'Discovery Call - TechStartup Inc',
      description: 'Initial discovery call to discuss their sales process',
      startTime: meeting1Start,
      endTime: meeting1End,
      timezone: 'America/Los_Angeles',
      location: null,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
      researchStatus: 'ready',
      hasExternalAttendees: true,
    }).returning();

    await db.insert(meetingProspects).values([
      { meetingId: meeting1.id, prospectId: prospect1.id, isOrganizer: true, responseStatus: 'accepted' },
      { meetingId: meeting1.id, prospectId: prospect2.id, isOrganizer: false, responseStatus: 'accepted' },
    ]);

    // Meeting 2: In 3 days at 2 PM (research generating)
    const meeting2Start = new Date(now);
    meeting2Start.setDate(meeting2Start.getDate() + 3);
    meeting2Start.setHours(14, 0, 0, 0);
    const meeting2End = new Date(meeting2Start);
    meeting2End.setHours(15, 0, 0, 0);

    const [meeting2] = await db.insert(meetings).values({
      campaignId: campaign.id,
      googleEventId: `event-${Date.now()}-2`,
      title: 'Strategy Session - Enterprise Co',
      description: 'Discuss enterprise deployment strategy',
      startTime: meeting2Start,
      endTime: meeting2End,
      timezone: 'America/New_York',
      location: 'Conference Room B',
      meetLink: null,
      status: 'scheduled',
      researchStatus: 'generating',
      hasExternalAttendees: true,
    }).returning();

    await db.insert(meetingProspects).values([
      { meetingId: meeting2.id, prospectId: prospect3.id, isOrganizer: true, responseStatus: 'accepted' },
    ]);

    // Meeting 3: Next week (research pending)
    const meeting3Start = new Date(now);
    meeting3Start.setDate(meeting3Start.getDate() + 7);
    meeting3Start.setHours(9, 30, 0, 0);
    const meeting3End = new Date(meeting3Start);
    meeting3End.setHours(10, 30, 0, 0);

    await db.insert(meetings).values({
      campaignId: campaign.id,
      googleEventId: `event-${Date.now()}-3`,
      title: 'Follow-up Call - TechStartup Inc',
      description: 'Follow-up on proposal',
      startTime: meeting3Start,
      endTime: meeting3End,
      timezone: 'America/Los_Angeles',
      location: null,
      meetLink: 'https://meet.google.com/xyz-abcd-efg',
      status: 'scheduled',
      researchStatus: 'pending',
      hasExternalAttendees: true,
    });

    console.log(`   ✓ Created ${3} meetings`);

    // 8. Create research brief for meeting 1
    console.log('📋 Creating research brief...');
    const [brief] = await db.insert(researchBriefs).values({
      type: 'calendar',
      campaignId: campaign.id,
      meetingId: meeting1.id,
      confidenceRating: 'HIGH',
      confidenceExplanation: 'Comprehensive data from multiple reliable sources including LinkedIn, company website, and recent funding announcements.',
      companyOverview: 'TechStartup Inc is a Series A-funded SaaS company building workflow automation tools for sales teams. Founded in 2022, they\'ve raised $8M and are growing rapidly with 75 employees.',
      painPoints: JSON.stringify([
        'Manual data entry consuming 10+ hours per week per sales rep',
        'Lack of visibility into pipeline health',
        'Difficulty tracking customer engagement across multiple channels',
      ]),
      howWeFit: 'Our AI-powered meeting prep platform directly addresses their need for automated research, saving 15-30 minutes per call. This aligns perfectly with their focus on sales efficiency and could help them close 20% more deals.',
      openingLine: 'I saw TechStartup recently raised your Series A and is scaling the sales team - congrats! I\'d love to discuss how we\'re helping similar high-growth SaaS companies cut meeting prep time by 80%.',
      discoveryQuestions: JSON.stringify([
        'How much time does your team currently spend researching prospects before calls?',
        'What tools are you using today for sales intelligence?',
        'What\'s your biggest challenge in scaling the sales team?',
        'How do you measure sales team productivity?',
      ]),
      successOutcome: 'Book a follow-up technical demo with their VP Engineering to discuss API integration',
      watchOuts: JSON.stringify([
        'They\'re very price-sensitive as a Series A company',
        'Previously used Clearbit but found it too expensive',
        'Strong preference for tools that integrate with HubSpot',
      ]),
      recentSignals: JSON.stringify([
        'Raised $8M Series A 3 months ago',
        'Hiring 5 new sales reps (per LinkedIn)',
        'Just launched enterprise tier pricing',
      ]),
      generatedAt: new Date(),
    }).returning();

    // Update meeting with brief ID
    await db.update(meetings)
      .set({ researchBriefId: brief.id })
      .where(eq(meetings.id, meeting1.id));

    // Add prospect info to brief
    await db.insert(prospectInfo).values([
      {
        researchBriefId: brief.id,
        prospectId: prospect1.id,
        title: 'VP of Sales',
        location: 'San Francisco, CA',
        background: 'Former sales director at Salesforce. 10+ years in B2B SaaS sales. Stanford MBA.',
        reportsTo: 'Sarah Jones (CRO)',
        teamSize: '12 reps',
        recentActivity: 'Recently posted about scaling challenges on LinkedIn',
      },
      {
        researchBriefId: brief.id,
        prospectId: prospect2.id,
        title: 'Chief Revenue Officer',
        location: 'San Francisco, CA',
        background: 'Previously scaled revenue at two unicorn startups. Former VP Sales at Stripe.',
        reportsTo: 'CEO',
        teamSize: '25 people (sales + marketing)',
        recentActivity: 'Speaking at SaaStr conference next month',
      },
    ]);

    // Add research sources
    await db.insert(researchSources).values([
      {
        researchBriefId: brief.id,
        sourceType: 'company_website',
        url: 'https://techstartup.com',
        title: 'TechStartup - Home Page',
        accessedAt: new Date(),
      },
      {
        researchBriefId: brief.id,
        sourceType: 'linkedin',
        url: 'https://linkedin.com/company/techstartup',
        title: 'TechStartup Inc on LinkedIn',
        accessedAt: new Date(),
      },
      {
        researchBriefId: brief.id,
        sourceType: 'crunchbase',
        url: 'https://crunchbase.com/organization/techstartup',
        title: 'TechStartup - Crunchbase',
        accessedAt: new Date(),
      },
      {
        researchBriefId: brief.id,
        sourceType: 'news',
        url: 'https://techcrunch.com/techstartup-raises-8m',
        title: 'TechStartup Raises $8M Series A',
        accessedAt: new Date(),
      },
    ]);

    console.log(`   ✓ Created research brief with prospect info and sources`);

    // 9. Create ad-hoc research request
    console.log('🔍 Creating ad-hoc research request...');
    const [adhocRequest] = await db.insert(adHocResearchRequests).values({
      userId: user.id,
      campaignId: campaign.id,
      prospectName: 'Jane Doe',
      companyName: 'BigCorp Inc',
      email: 'jane.doe@bigcorp.com',
      status: 'ready',
    }).returning();

    // Create brief for ad-hoc request
    const [adhocBrief] = await db.insert(researchBriefs).values({
      type: 'adhoc',
      campaignId: campaign.id,
      adHocRequestId: adhocRequest.id,
      confidenceRating: 'MEDIUM',
      confidenceExplanation: 'Limited public information available. Based on company website and LinkedIn profile.',
      companyOverview: 'BigCorp Inc is a Fortune 500 enterprise with 10,000+ employees, specializing in manufacturing and logistics.',
      painPoints: JSON.stringify([
        'Legacy systems limiting agility',
        'Manual processes across departments',
      ]),
      howWeFit: 'Our platform can help modernize their sales workflow and improve efficiency.',
      openingLine: 'I noticed BigCorp is undergoing digital transformation - we help enterprise companies modernize their sales processes.',
      discoveryQuestions: JSON.stringify([
        'What\'s your current tech stack for sales?',
        'What are your top priorities for this quarter?',
      ]),
      successOutcome: 'Schedule intro call with procurement team',
      watchOuts: JSON.stringify([
        'Long enterprise sales cycle (6-12 months)',
        'Multiple stakeholders involved in decision',
      ]),
      recentSignals: JSON.stringify([
        'Recent announcement of digital transformation initiative',
      ]),
      generatedAt: new Date(),
    }).returning();

    await db.update(adHocResearchRequests)
      .set({ researchBriefId: adhocBrief.id })
      .where(eq(adHocResearchRequests.id, adhocRequest.id));

    console.log(`   ✓ Created ad-hoc research request with brief`);

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📝 Test credentials:');
    console.log(`   Email: ${SEED_USER_EMAIL}`);
    console.log(`   Google ID: ${SEED_USER_GOOGLE_ID}`);
    console.log('');
    console.log('🎯 You can now:');
    console.log('   1. Sign in with the test user');
    console.log('   2. View the seeded meetings in the dashboard');
    console.log('   3. Check the research brief for the first meeting');
    console.log('   4. Explore the ad-hoc research request');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seed };
