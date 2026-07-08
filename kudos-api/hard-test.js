const { EventSource } = require('eventsource');

const API_URL = 'http://localhost:8080';
const USER_ID = 'hard_tester_1';

async function runHardTests() {
  console.log('🚀 Starting Hard Testing Suite...');
  
  // 1. Health Endpoint Check
  console.log('\n--- 1. Health Check ---');
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    console.log(`Health Status: ${healthRes.status} ${await healthRes.text()}`);
  } catch (e) {
    console.error(`❌ Health Check Failed: ${e.message}`);
    return; // Exit if server is down
  }

  // 2. Large Payload Test
  console.log('\n--- 2. Large Payload Test ---');
  try {
    const largeMessage = 'A'.repeat(10000); // 10k characters
    const start = Date.now();
    const res = await fetch(`${API_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, message: largeMessage })
    });
    const data = await res.json();
    console.log(`Large Payload Response (took ${Date.now() - start}ms):`, (data.reply || '').substring(0, 100) + '...');
  } catch (e) {
    console.error(`❌ Large Payload Failed: ${e.message}`);
  }

  // 3. Concurrent Requests (Stress Test)
  console.log('\n--- 3. Concurrent Request Stress Test ---');
  try {
    const numRequests = 10;
    console.log(`Sending ${numRequests} concurrent requests...`);
    const promises = Array.from({ length: numRequests }).map((_, i) => {
      return fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, message: `Concurrent message ${i}` })
      }).then(r => r.json());
    });
    
    const start = Date.now();
    const results = await Promise.all(promises);
    console.log(`All ${numRequests} requests completed in ${Date.now() - start}ms`);
    console.log(`Sample reply:`, (results[0].reply || '').substring(0, 100) + '...');
  } catch (e) {
    console.error(`❌ Concurrent Test Failed: ${e.message}`);
  }

  // 4. SSE Connection Stress Test
  console.log('\n--- 4. SSE Stress Test ---');
  try {
    const numConnections = 50;
    console.log(`Opening ${numConnections} SSE connections...`);
    
    const connections = [];
    let connectedCount = 0;
    
    await new Promise((resolve) => {
      for (let i = 0; i < numConnections; i++) {
        const es = new EventSource(`${API_URL}/api/stream`);
        es.onopen = () => {
          connectedCount++;
          if (connectedCount === numConnections) resolve();
        };
        es.onerror = (err) => {
          console.error(`SSE Error on connection ${i}`);
        };
        connections.push(es);
      }
      
      // Timeout after 5s
      setTimeout(() => resolve(), 5000);
    });
    
    console.log(`Successfully opened ${connectedCount}/${numConnections} connections`);
    
    // Close all
    connections.forEach(es => es.close());
    console.log('Closed all SSE connections.');
    
  } catch (e) {
    console.error(`❌ SSE Stress Test Failed: ${e.message}`);
  }

  console.log('\n✨ Hard Testing Complete ✨');
}

runHardTests().catch(console.error);
