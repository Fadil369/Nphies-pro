'use client';

import { MeshGradient } from '@paper-design/shaders-react';

export function BrainSAITMeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <MeshGradient
        colors={['#1a365d', '#2b6cb8', '#0ea5e9', '#ea580c', '#64748b']}
        speed={0.3}
        className="absolute inset-0"
      />
      <MeshGradient
        colors={['#000000', '#8b5cf6', '#ffffff']}
        speed={0.2}
        className="absolute inset-0 opacity-60"
      />
    </div>
  );
}
