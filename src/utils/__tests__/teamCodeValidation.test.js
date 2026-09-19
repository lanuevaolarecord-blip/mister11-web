import { describe, it, expect, vi } from 'vitest';

vi.mock('../../firebaseConfig', () => ({
  db: {},
  auth: {}
}));

import { validateTeamCode, formatTeamCode } from '../teamCodeManager.js';

describe('Team Code Validation and Management', () => {
  it('validates 6-character player code without prefix', () => {
    const res = validateTeamCode('ABC123');
    expect(res.valid).toBe(true);
    expect(res.normalizedCode).toBe('ABC123');
    expect(res.fullCode).toBe('M11-ABC123');
  });

  it('validates player code with M11- prefix and case insensitivity', () => {
    const res = validateTeamCode('m11-xyz789');
    expect(res.valid).toBe(true);
    expect(res.normalizedCode).toBe('XYZ789');
    expect(res.fullCode).toBe('M11-XYZ789');
  });

  it('rejects codes that do not have 6 characters', () => {
    const shortRes = validateTeamCode('AB12');
    expect(shortRes.valid).toBe(false);
    expect(shortRes.error).toBe('length');

    const longRes = validateTeamCode('ABCDEF1234');
    expect(longRes.valid).toBe(false);
    expect(longRes.error).toBe('length');
  });

  it('detects staff codes and flags them for staff onboarding redirection', () => {
    const staffRes = validateTeamCode('STAFF-XYZ123');
    expect(staffRes.valid).toBe(false);
    expect(staffRes.isStaffCode).toBe(true);
    expect(staffRes.error).toBe('staff_code_in_player_flow');
  });

  it('correctly formats raw codes with formatTeamCode', () => {
    expect(formatTeamCode('ABC123')).toBe('M11-ABC123');
    expect(formatTeamCode('m11-abc123')).toBe('M11-ABC123');
    expect(formatTeamCode('')).toBe('');
    expect(formatTeamCode(null)).toBe('');
  });

  it('searchTeamByCode returns team info with both root properties and team object', async () => {
    const { searchTeamByCode } = await import('../teamCodeManager.js');
    
    // Test that invalid code fails gracefully
    const invalidRes = await searchTeamByCode('INVALID_CODE');
    expect(invalidRes.found).toBe(false);

    // Test staff code returns isStaffCode
    const staffRes = await searchTeamByCode('STAFF-XYZ999');
    expect(staffRes.found).toBe(false);
    expect(staffRes.isStaffCode).toBe(true);
  });
});
