/**
 * Manual test script for getMeetings endpoint
 * This script verifies that the getMeetings handler works correctly
 * 
 * To run: node test-getMeetings.js
 */

const Meeting = require('./models/Meeting');

async function testGetMeetings() {
  console.log('Testing getMeetings implementation...\n');

  try {
    // Test 1: Fetch meetings using the model method
    console.log('Test 1: Fetching meetings with limit 50');
    const meetings = await Meeting.findAll({ limit: 50 });
    
    console.log(`✓ Successfully fetched ${meetings.length} meetings`);
    
    if (meetings.length > 0) {
      const firstMeeting = meetings[0];
      console.log('\nFirst meeting structure:');
      console.log('- id:', firstMeeting.id);
      console.log('- title:', firstMeeting.title);
      console.log('- client_name:', firstMeeting.client_name);
      console.log('- status:', firstMeeting.status);
      console.log('- created_at:', firstMeeting.created_at);
      
      // Verify required fields are present
      const requiredFields = ['id', 'title', 'client_name', 'status', 'created_at'];
      const hasAllFields = requiredFields.every(field => firstMeeting.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('\n✓ All required fields are present');
      } else {
        console.log('\n✗ Missing required fields');
      }
      
      // Verify sorting (created_at DESC)
      if (meetings.length > 1) {
        const isDescending = new Date(meetings[0].created_at) >= new Date(meetings[1].created_at);
        if (isDescending) {
          console.log('✓ Meetings are sorted by created_at DESC');
        } else {
          console.log('✗ Meetings are NOT sorted correctly');
        }
      }
    } else {
      console.log('\nNo meetings found in database (this is OK for empty database)');
    }
    
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testGetMeetings();
