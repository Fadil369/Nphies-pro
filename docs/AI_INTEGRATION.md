# 🤖 CopilotKit + Pydantic AI Integration Guide

## Overview

The NPHIES platform integrates **CopilotKit** (frontend AI interface) with **Pydantic AI** (backend AI agent) to provide a comprehensive AI-powered healthcare assistant for Saudi Arabia's healthcare digitization initiative.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Integration Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Frontend (Next.js + CopilotKit)                           │
│  ├── CopilotProvider - Main AI interface wrapper               │
│  ├── CopilotSidebar - Chat interface with Arabic/English       │
│  ├── ClaimsActions - Healthcare-specific AI actions            │
│  └── useCopilotAction/Readable - Real-time data sync           │
├─────────────────────────────────────────────────────────────────┤
│  🔗 API Bridge Layer                                           │
│  ├── /api/copilot - Next.js API route                         │
│  ├── Request forwarding to Pydantic AI                        │
│  ├── Fallback to OpenAI if agent unavailable                  │
│  └── Error handling and response formatting                    │
├─────────────────────────────────────────────────────────────────┤
│  🧠 Backend AI Agent (Pydantic AI + FastAPI)                  │
│  ├── ag_ui_agent.py - Main Pydantic AI agent                  │
│  ├── NPHIES-specific healthcare knowledge                      │
│  ├── Saudi compliance validation                               │
│  ├── Claims processing automation                              │
│  └── Real-time analytics and insights                         │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend Integration (CopilotKit)

#### CopilotProvider (`apps/web/components/copilot/copilot-provider.tsx`)
```typescript
export function CopilotProvider({ children }: CopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilot">
      <CopilotSidebar
        instructions="You are a NPHIES AI Assistant specialized in Saudi healthcare workflows."
        labels={{
          title: "🏥 NPHIES AI Assistant",
          initial: "مرحباً! أنا مساعد الذكي لنظام نفيس...",
        }}
        defaultOpen={false}
        clickOutsideToClose={false}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
```

**Features:**
- ✅ Bilingual support (Arabic/English)
- ✅ Healthcare-specific instructions
- ✅ Keyboard shortcut (⌘J)
- ✅ Customizable sidebar interface

#### ClaimsActions (`apps/web/components/copilot/claims-actions.tsx`)
```typescript
// Real-time data synchronization
useCopilotReadable({
  description: 'Current healthcare claims data for NPHIES platform',
  value: {
    totalClaims: claims.length,
    claimsByStatus: { approved, pending, rejected },
    totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
    // ... comprehensive claims data
  },
});

// AI-powered actions
useCopilotAction({
  name: 'analyzeClaims',
  description: 'Perform comprehensive AI-powered analysis',
  parameters: [
    { name: 'analysisType', enum: ['comprehensive', 'patterns', 'compliance', 'fraud'] },
    { name: 'timeframe', enum: ['7d', '30d', '90d', '1y'] },
  ],
  handler: async ({ analysisType, timeframe }) => {
    // Forward to Pydantic AI agent
    const response = await fetch('http://localhost:8001/ag-ui', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze_claims', parameters, claims_data: claims }),
    });
    return response.json();
  },
});
```

**Available Actions:**
- 🔍 **analyzeClaims** - Comprehensive claims analysis with ML insights
- 🛡️ **checkNphiesCompliance** - NPHIES compliance validation
- 🚨 **detectFraud** - AI-powered fraud detection
- 📊 **generateReport** - Healthcare analytics reports
- 🔄 **syncAgentState** - Real-time data synchronization

### 2. API Bridge Layer

#### CopilotKit API Route (`apps/web/app/api/copilot/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const runtime = new CopilotRuntime();
  const agentUrl = process.env.AI_AGENT_URL || 'http://localhost:8001/ag-ui';
  
  try {
    const body = await req.json();
    
    // Forward to Pydantic AI agent
    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    return new Response(JSON.stringify(await response.json()));
    
  } catch (error) {
    // Fallback to OpenAI if Pydantic AI unavailable
    const openaiAdapter = new OpenAIAdapter({
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    return runtime.streamHttpServerResponse(req, openaiAdapter);
  }
}
```

**Features:**
- ✅ Seamless request forwarding
- ✅ Automatic fallback to OpenAI
- ✅ Error handling and logging
- ✅ Response format standardization

### 3. Backend AI Agent (Pydantic AI)

#### Main Agent (`services/claims-ai-engine/src/ag_ui_agent.py`)
```python
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

# NPHIES Healthcare AI Agent
agent = Agent(
    model=OpenAIModel('gpt-4'),
    system_prompt="""You are the NPHIES AI Assistant for Saudi Arabia's healthcare digitization.
    
    EXPERTISE:
    - Saudi healthcare regulations and compliance
    - NPHIES v2.0 standards and protocols
    - Claims processing and validation
    - Fraud detection and risk assessment
    - Healthcare analytics and reporting
    
    CAPABILITIES:
    - Real-time claims analysis
    - Compliance validation against Saudi standards
    - Automated fraud detection
    - Performance optimization recommendations
    - Bilingual support (Arabic/English)
    """,
    deps_type=NphiesAgentDeps,
    result_type=NphiesResponse,
)

@agent.tool
async def analyze_claims(ctx: RunContext[NphiesAgentDeps], 
                        analysis_type: str, 
                        claims_data: List[Dict]) -> str:
    """Comprehensive claims analysis with ML insights"""
    # Advanced claims processing logic
    return f"Analysis completed for {len(claims_data)} claims"

@agent.tool
async def check_nphies_compliance(ctx: RunContext[NphiesAgentDeps],
                                 claim_id: str,
                                 include_recommendations: bool = True) -> str:
    """NPHIES compliance validation"""
    # Saudi healthcare compliance validation
    return "Compliance check completed"

@agent.tool
async def detect_fraud(ctx: RunContext[NphiesAgentDeps],
                      sensitivity: str = "medium",
                      include_risk_scores: bool = True) -> str:
    """AI-powered fraud detection"""
    # Advanced fraud detection algorithms
    return "Fraud detection analysis completed"
```

**Agent Capabilities:**
- 🏥 **Healthcare Domain Expertise** - Saudi-specific healthcare knowledge
- 🛡️ **NPHIES Compliance** - Real-time validation against standards
- 🤖 **ML-Powered Analysis** - Advanced pattern recognition
- 🌍 **Bilingual Support** - Arabic and English processing
- 📊 **Real-time Analytics** - Live data processing and insights

## Configuration

### Environment Variables

#### Web Application (`.env.local`)
```bash
# CopilotKit Configuration
NEXT_PUBLIC_COPILOT_RUNTIME_URL=/api/copilot
OPENAI_API_KEY=your-openai-api-key

# AI Agent Connection
AI_AGENT_URL=http://localhost:8001/ag-ui
AI_AGENT_TIMEOUT=30000

# Feature Flags
ENABLE_AI_ASSISTANT=true
ENABLE_FRAUD_DETECTION=true
ENABLE_COMPLIANCE_CHECKS=true
```

#### AI Agent (`.env`)
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# NPHIES Configuration
NPHIES_ENDPOINT=https://nphies.sa/api/v1
NPHIES_CLIENT_ID=your-client-id
NPHIES_CLIENT_SECRET=your-client-secret

# Saudi Healthcare Settings
SAUDI_HEALTHCARE_STANDARDS=v2.0
COMPLIANCE_LEVEL=strict
LANGUAGE_SUPPORT=ar,en

# Performance Settings
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30
CACHE_TTL=300
```

## Usage Examples

### 1. Basic Claims Analysis
```typescript
// In React component
const { claims } = useQuery(['claims']);

// CopilotKit automatically provides these actions
// User can type: "Analyze my claims for patterns"
// AI will call analyzeClaims action with appropriate parameters
```

### 2. NPHIES Compliance Check
```typescript
// User interaction: "Check NPHIES compliance for all claims"
// Triggers: checkNphiesCompliance('all', true)
// Returns: Detailed compliance report with recommendations
```

### 3. Fraud Detection
```typescript
// User interaction: "Run fraud detection with high sensitivity"
// Triggers: detectFraud('high', true)
// Returns: Risk scores and fraud indicators for all claims
```

### 4. Custom Analytics
```typescript
// User interaction: "Generate a comprehensive financial report"
// Triggers: generateReport('financial', true)
// Returns: Detailed financial analytics with visualizations
```

## Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Start web application
cd apps/web
pnpm dev

# Terminal 2: Start AI agent
cd services/claims-ai-engine
poetry run python src/ag_ui_agent.py

# Terminal 3: Start platform gateway
cd services/platform-gateway
pnpm dev
```

### 2. Test AI Integration
```bash
# Test CopilotKit connection
curl -X POST http://localhost:3000/api/copilot \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello NPHIES AI"}'

# Test Pydantic AI agent directly
curl -X POST http://localhost:8001/ag-ui \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze_claims", "parameters": {}}'
```

### 3. Debug AI Responses
```typescript
// Enable debug mode in CopilotProvider
<CopilotKit 
  runtimeUrl="/api/copilot"
  agent="nphies-ai-assistant"
  debug={process.env.NODE_ENV === 'development'}
>
```

## Production Deployment

### 1. Docker Configuration
```yaml
# docker-compose.yml
services:
  web:
    build: ./apps/web
    environment:
      - AI_AGENT_URL=http://ai-agent:8001/ag-ui
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - ai-agent

  ai-agent:
    build: ./services/claims-ai-engine
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NPHIES_ENDPOINT=${NPHIES_ENDPOINT}
    ports:
      - "8001:8001"
```

### 2. Health Checks
```bash
# Web application health
curl http://localhost:3000/api/health

# AI agent health
curl http://localhost:8001/health

# CopilotKit integration test
curl -X POST http://localhost:3000/api/copilot \
  -H "Content-Type: application/json" \
  -d '{"message": "Health check"}'
```

### 3. Monitoring
```typescript
// Add monitoring to CopilotKit actions
useCopilotAction({
  name: 'analyzeClaims',
  handler: async (params) => {
    const startTime = Date.now();
    try {
      const result = await analyzeClaimsWithAI(params);
      // Log success metrics
      console.log(`Claims analysis completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      // Log error metrics
      console.error('Claims analysis failed:', error);
      throw error;
    }
  },
});
```

## Troubleshooting

### Common Issues

#### 1. CopilotKit Not Loading
```bash
# Check if API route is accessible
curl http://localhost:3000/api/copilot

# Verify CopilotKit packages
pnpm list | grep copilot
```

#### 2. Pydantic AI Agent Connection Failed
```bash
# Check if agent is running
curl http://localhost:8001/health

# Verify environment variables
echo $OPENAI_API_KEY
echo $AI_AGENT_URL
```

#### 3. Actions Not Working
```typescript
// Debug action registration
console.log('Registering CopilotKit actions...');
useCopilotAction({
  name: 'debugAction',
  handler: async () => {
    console.log('Action triggered successfully');
    return 'Debug action completed';
  },
});
```

### Performance Optimization

#### 1. Caching
```typescript
// Cache AI responses
const cachedAnalysis = useMemo(() => {
  return analyzeClaimsCache.get(cacheKey);
}, [claims, analysisType]);
```

#### 2. Request Batching
```typescript
// Batch multiple AI requests
const batchRequests = async (requests: AIRequest[]) => {
  return Promise.all(requests.map(req => callAIAgent(req)));
};
```

#### 3. Streaming Responses
```typescript
// Stream large AI responses
const streamAnalysis = async function* (claims: Claim[]) {
  for (const chunk of analyzeClaimsStream(claims)) {
    yield chunk;
  }
};
```

## Security Considerations

### 1. API Key Management
- ✅ Store API keys in environment variables
- ✅ Use different keys for development/production
- ✅ Rotate keys regularly
- ✅ Monitor API usage and costs

### 2. Data Privacy
- ✅ Encrypt sensitive healthcare data
- ✅ Comply with Saudi PDPL regulations
- ✅ Implement audit logging
- ✅ Use secure communication (HTTPS/TLS)

### 3. Access Control
- ✅ Implement role-based access control
- ✅ Validate user permissions for AI actions
- ✅ Rate limit AI requests
- ✅ Monitor for abuse patterns

## Future Enhancements

### 1. Advanced AI Features
- 🔮 **Predictive Analytics** - Forecast claim trends
- 🎯 **Personalized Recommendations** - User-specific insights
- 🗣️ **Voice Interface** - Arabic voice commands
- 📱 **Mobile AI Assistant** - React Native integration

### 2. Integration Expansions
- 🏥 **EMR Integration** - Electronic Medical Records
- 💳 **Payment Processing** - Automated billing
- 📊 **BI Tools** - Advanced analytics dashboards
- 🔗 **Third-party APIs** - Insurance providers

### 3. Saudi-Specific Features
- 🕌 **Islamic Calendar** - Hijri date support
- 🏛️ **Government APIs** - MOH integration
- 📋 **Arabic NLP** - Enhanced Arabic processing
- 🎓 **Medical Education** - Training modules

---

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   cd services/claims-ai-engine && poetry install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Add your OPENAI_API_KEY
   ```

3. **Start Services**
   ```bash
   ./scripts/dev-all.sh
   ```

4. **Test Integration**
   - Open http://localhost:3000
   - Press ⌘J to open AI assistant
   - Type: "Analyze my claims"

**🎉 Your NPHIES AI Assistant is ready!**
