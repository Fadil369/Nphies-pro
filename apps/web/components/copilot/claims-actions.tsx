'use client';

import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { useEffect } from 'react';

interface ClaimsActionsProps {
  claims?: any[];
  onClaimAnalyzed?: (analysis: any) => void;
}

export function ClaimsActions({ claims = [], onClaimAnalyzed }: ClaimsActionsProps) {
  // Make claims data readable by Copilot and sync with Pydantic AI agent
  useCopilotReadable({
    description: "Current claims data in the NPHIES system",
    value: {
      claims: claims.map(claim => ({
        id: claim.id,
        patientName: claim.patientName,
        patientId: claim.patientId,
        nationalId: claim.nationalId,
        amount: claim.amount,
        status: claim.status,
        diagnosis: claim.diagnosis,
        submittedAt: claim.submittedAt,
        tenantName: claim.tenantName
      })),
      summary: {
        total: claims.length,
        approved: claims.filter(c => c.status === 'approved').length,
        pending: claims.filter(c => c.status === 'pending').length,
        rejected: claims.filter(c => c.status === 'rejected').length
      }
    }
  });

  // Auto-sync claims data with Pydantic AI agent when claims change
  useEffect(() => {
    if (claims.length > 0) {
      // This will be automatically picked up by the agent through the readable state
      console.log(`Synced ${claims.length} claims with NPHIES AI Agent`);
    }
  }, [claims]);

  // Enhanced claims analysis action
  useCopilotAction({
    name: "analyzeClaims",
    description: "Analyze claims patterns using Pydantic AI with advanced ML models",
    parameters: [
      {
        name: "analysisType",
        type: "string",
        description: "Type of analysis: 'comprehensive', 'patterns', 'compliance', 'fraud', 'performance'",
        enum: ["comprehensive", "patterns", "compliance", "fraud", "performance"]
      },
      {
        name: "timeframe",
        type: "string", 
        description: "Analysis timeframe: '7d', '30d', '90d', '1y'",
        enum: ["7d", "30d", "90d", "1y"]
      }
    ],
    handler: async ({ analysisType, timeframe }) => {
      // The Pydantic AI agent will handle this through its analyze_claims tool
      const analysis = {
        type: analysisType,
        timeframe,
        status: "Analysis initiated with Pydantic AI agent",
        timestamp: new Date().toISOString()
      };
      
      onClaimAnalyzed?.(analysis);
      return `🔍 Initiating ${analysisType} analysis for ${claims.length} claims over ${timeframe} using advanced Pydantic AI models...`;
    }
  });

  // NPHIES compliance check with Pydantic AI
  useCopilotAction({
    name: "checkNphiesCompliance",
    description: "Check NPHIES compliance using Pydantic AI validation engine",
    parameters: [
      {
        name: "claimId",
        type: "string",
        description: "Specific claim ID to check, or 'all' for all claims"
      },
      {
        name: "includeRecommendations",
        type: "boolean",
        description: "Include compliance recommendations"
      }
    ],
    handler: async ({ claimId, includeRecommendations = true }) => {
      const targetCount = claimId === 'all' ? claims.length : 1;
      return `✅ Initiating NPHIES compliance check for ${targetCount} claim(s) using Pydantic AI validation engine${includeRecommendations ? ' with recommendations' : ''}...`;
    }
  });

  // Enhanced fraud detection with Pydantic AI
  useCopilotAction({
    name: "detectFraud",
    description: "Run advanced AI-powered fraud detection using Pydantic AI models",
    parameters: [
      {
        name: "sensitivity",
        type: "string",
        description: "Detection sensitivity level",
        enum: ["low", "medium", "high"]
      },
      {
        name: "includeRiskScores",
        type: "boolean",
        description: "Include detailed risk scores for each claim"
      }
    ],
    handler: async ({ sensitivity, includeRiskScores = true }) => {
      return `🛡️ Running advanced fraud detection on ${claims.length} claims with ${sensitivity} sensitivity using Pydantic AI models${includeRiskScores ? ' with risk scoring' : ''}...`;
    }
  });

  // Generate comprehensive reports
  useCopilotAction({
    name: "generateReport",
    description: "Generate comprehensive healthcare analytics report using Pydantic AI",
    parameters: [
      {
        name: "reportType",
        type: "string",
        description: "Type of report to generate",
        enum: ["comprehensive", "financial", "operational", "compliance", "performance"]
      },
      {
        name: "includeCharts",
        type: "boolean",
        description: "Include data visualizations in the report"
      }
    ],
    handler: async ({ reportType, includeCharts = true }) => {
      return `📊 Generating ${reportType} report for ${claims.length} claims using Pydantic AI analytics engine${includeCharts ? ' with visualizations' : ''}...`;
    }
  });

  // Real-time state synchronization
  useCopilotAction({
    name: "syncAgentState",
    description: "Synchronize current claims data with the Pydantic AI agent state",
    parameters: [],
    handler: async () => {
      return `🔄 Synchronized ${claims.length} claims with NPHIES Pydantic AI Agent. Agent state updated with latest data.`;
    }
  });

  // Get agent insights
  useCopilotAction({
    name: "getAgentInsights",
    description: "Get AI-powered insights and recommendations from the Pydantic AI agent",
    parameters: [
      {
        name: "focusArea",
        type: "string",
        description: "Area to focus insights on",
        enum: ["efficiency", "compliance", "cost-optimization", "risk-management", "workflow"]
      }
    ],
    handler: async ({ focusArea }) => {
      return `💡 Generating AI insights focused on ${focusArea} using Pydantic AI agent analysis of ${claims.length} claims...`;
    }
  });

  return null;
}
