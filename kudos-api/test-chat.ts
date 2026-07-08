
async function testChat() {
  console.log('Sending message to Kudos...');
  
  const response = await fetch('http://localhost:8080/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_founder_1',
      message: 'I am so stressed about my upcoming launch next week. The design is broken and I have zero energy.'
    })
  });

  const data = await response.json();
  console.log('\n💬 Kudos Response:\n', data.reply);
}

testChat().catch(console.error);
