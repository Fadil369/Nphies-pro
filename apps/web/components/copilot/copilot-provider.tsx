'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';

interface CopilotProviderProps {
  children: React.ReactNode;
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilot">
      <CopilotSidebar
        instructions="You are a NPHIES AI Assistant specialized in Saudi healthcare workflows. Help users with claims processing, compliance checks, and healthcare analytics."
        labels={{
          title: "🏥 NPHIES AI Assistant",
          initial: "مرحباً! أنا مساعد الذكي لنظام نفيس. يمكنني مساعدتك في معالجة المطالبات والامتثال والتحليلات الصحية.\n\nHi! I'm your NPHIES AI Assistant. I can help you with claims processing, compliance checks, and healthcare analytics. What would you like to know?",
        }}
        defaultOpen={false}
        clickOutsideToClose={false}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
