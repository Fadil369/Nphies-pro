import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Forward requests to our Pydantic AI agent
  const agentUrl = process.env.AI_AGENT_URL || 'http://localhost:8001/ag-ui';
  
  try {
    // Get the request body
    const body = await req.json();
    
    // Forward to Pydantic AI agent
    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`AI Agent responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the response from Pydantic AI
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error connecting to Pydantic AI agent:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'AI Agent unavailable',
        message: 'Please ensure the Pydantic AI agent is running on port 8001',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
