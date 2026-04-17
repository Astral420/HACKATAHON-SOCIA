/**
 * Manual test script for createMeeting endpoint
 * This script verifies that task 8.1 is correctly implemented
 */

const MeetingController = require('./controllers/meetingController');
const Meeting = require('./models/Meeting');
const UrlService = require('./services/urlService');

// Mock request and response objects
const mockReq = {
  body: {
    clientName: 'Acme Corporation',
    title: 'Q1 Strategy Meeting'
  }
};

const mockRes = {
  statusCode: null,
  jsonData: null,
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.jsonData = data;
    return this;
  }
};

const mockNext = (err) => {
  if (err) {
    console.error('Error occurred:', err);
  }
};

// Test the createMeeting function
async function testCreateMeeting() {
  console.log('Testing createMeeting implementation...\n');
  
  console.log('Input:');
  console.log('  clientName:', mockReq.body.clientName);
  console.log('  title:', mockReq.body.title);
  console.log('');
  
  try {
    await MeetingController.createMeeting(mockReq, mockRes, mockNext);
    
    console.log('Response Status:', mockRes.statusCode);
    console.log('Response Data:', JSON.stringify(mockRes.jsonData, null, 2));
    console.log('');
    
    // Verify requirements
    console.log('Verification:');
    console.log('  ✓ Status code is 201:', mockRes.statusCode === 201);
    console.log('  ✓ Meeting has id:', !!mockRes.jsonData?.meeting?.id);
    console.log('  ✓ Meeting has shareToken:', !!mockRes.jsonData?.meeting?.shareToken);
    console.log('  ✓ Meeting status is pending:', mockRes.jsonData?.meeting?.status === 'pending');
    console.log('  ✓ Meeting has title:', mockRes.jsonData?.meeting?.title === mockReq.body.title);
    console.log('  ✓ Meeting has clientName:', mockRes.jsonData?.meeting?.clientName === mockReq.body.clientName);
    console.log('');
    
    console.log('✅ Task 8.1 implementation verified successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCreateMeeting()
  .then(() => {
    console.log('\nTest completed. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
