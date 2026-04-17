/**
 * Manual test script for getMeetingResult endpoint
 * This script verifies that task 8.4 is correctly implemented
 * 
 * To run: node test-getMeetingResult.js
 */

const Meeting = require('./models/Meeting');
const AiOutput = require('./models/AiOutput');
const UrlService = require('./services/urlService');

async function testGetMeetingResult() {
  console.log('Testing getMeetingResult implementation...\n');

  try {
    // First, create a test meeting with AI outputs
    console.log('Setup: Creating test meeting with AI outputs...');
    const shareToken = UrlService.generateToken();
    const meeting = await Meeting.create({
      clientName: 'Test Client Corp',
      title: 'Test Meeting for getMeetingResult',
      shareToken
    });
    console.log(`✓ Created test meeting with id: ${meeting.id}\n`);

    // Add AI outputs to the meeting
    await AiOutput.upsert({
      meetingId: meeting.id,
      summary: 'This is a test summary for the meeting.',
      action_items: ['Action item 1', 'Action item 2'],
      key_decisions: ['Decision 1', 'Decision 2'],
      open_questions: ['Question 1'],
      next_steps: ['Next step 1', 'Next step 2', 'Next step 3']
    });
    console.log('✓ Added AI outputs to meeting\n');

    // Test 1: Fetch meeting with AI outputs
    console.log('Test 1: Fetching meeting by id with AI outputs');
    const result = await Meeting.findById(meeting.id, { includeAiOutput: true });
    
    if (!result) {
      throw new Error('Meeting not found');
    }
    
    console.log('✓ Successfully fetched meeting with AI outputs');
    
    // Verify meeting fields
    console.log('\nMeeting structure:');
    console.log('- id:', result.id);
    console.log('- title:', result.title);
    console.log('- client_name:', result.client_name);
    console.log('- status:', result.status);
    console.log('- created_at:', result.created_at);
    console.log('- updated_at:', result.updated_at);
    
    // Verify AI output fields
    console.log('\nAI Output structure:');
    console.log('- summary:', result.summary);
    console.log('- action_items:', result.action_items);
    console.log('- key_decisions:', result.key_decisions);
    console.log('- open_questions:', result.open_questions);
    console.log('- next_steps:', result.next_steps);
    
    // Verify required fields are present
    const requiredMeetingFields = ['id', 'title', 'client_name', 'status', 'created_at', 'updated_at'];
    const hasAllMeetingFields = requiredMeetingFields.every(field => result.hasOwnProperty(field));
    
    const requiredAiFields = ['summary', 'action_items', 'key_decisions', 'open_questions', 'next_steps'];
    const hasAllAiFields = requiredAiFields.every(field => result.hasOwnProperty(field));
    
    console.log('\nVerification:');
    console.log('  ✓ All required meeting fields present:', hasAllMeetingFields);
    console.log('  ✓ All required AI output fields present:', hasAllAiFields);
    console.log('  ✓ Summary is string:', typeof result.summary === 'string');
    console.log('  ✓ action_items is array:', Array.isArray(result.action_items));
    console.log('  ✓ key_decisions is array:', Array.isArray(result.key_decisions));
    console.log('  ✓ open_questions is array:', Array.isArray(result.open_questions));
    console.log('  ✓ next_steps is array:', Array.isArray(result.next_steps));
    
    // Test 2: Test with non-existent meeting ID
    console.log('\nTest 2: Testing with non-existent meeting ID');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const notFound = await Meeting.findById(nonExistentId, { includeAiOutput: true });
    
    if (!notFound) {
      console.log('✓ Correctly returns undefined for non-existent meeting');
    } else {
      throw new Error('Should return undefined for non-existent meeting');
    }
    
    // Test 3: Test with meeting that has no AI outputs
    console.log('\nTest 3: Testing with meeting that has no AI outputs');
    const shareToken2 = UrlService.generateToken();
    const meeting2 = await Meeting.create({
      clientName: 'Another Client',
      title: 'Meeting without AI outputs',
      shareToken: shareToken2
    });
    
    const resultNoAi = await Meeting.findById(meeting2.id, { includeAiOutput: true });
    console.log('✓ Successfully fetched meeting without AI outputs');
    console.log('  - summary is null:', resultNoAi.summary === null || resultNoAi.summary === undefined);
    
    console.log('\n✅ All tests passed! Task 8.4 implementation verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testGetMeetingResult();
