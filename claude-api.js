// Load environment variables
require('dotenv').config();

// Keep track of conversation history
const conversations = new Map();

// Function to get response from Claude using fetch
async function getClaudeResponse(message, conversationId = 'default') {
  // Get conversation history or initialize new conversation
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, []);
  }
  
  const history = conversations.get(conversationId);
  
  // Add user message to history
  history.push({ role: 'user', content: message });
  
  try {
    // Call Claude API directly with fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: history
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Add assistant response to history
    const assistantMessage = {
      role: 'assistant',
      content: data.content[0].text
    };
    
    history.push(assistantMessage);
    
    // Return the assistant's response text
    return assistantMessage.content;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return `Error: ${error.message}`;
  }
}

module.exports = { getClaudeResponse };