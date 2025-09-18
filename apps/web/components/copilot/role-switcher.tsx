'use client';

import { useEffect, useState } from 'react';

const ROLES = [
  { value: 'provider_biller', label: 'Provider Biller' },
  { value: 'claim_adjuster', label: 'Claim Adjuster' },
  { value: 'analytics_viewer', label: 'Analytics Viewer' },
  { value: 'auditor', label: 'Auditor' },
];

export function RoleSwitcher({ currentRole }: { currentRole?: string }) {
  const [role, setRole] = useState(currentRole ?? 'provider_biller');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentRole && currentRole !== role) {
      setRole(currentRole);
    }
  }, [currentRole]);

  const updateRole = async (newRole: string) => {
    setSaving(true);
    try {
      await fetch('/api/auth/mock-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setRole(newRole);
      // Force session refetch on next render
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-xs text-white shadow-lg">
      <span className="hidden md:inline">Role:</span>
      <select
        value={role}
        onChange={(event) => updateRole(event.target.value)}
        disabled={saving}
        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        {ROLES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
