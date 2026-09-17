import { describe, it, expect } from 'vitest';
import { normalizeLineup } from '../lineupEngine.js';

describe('Lineup 18 Players & No Empty Slots', () => {
  it('should place 11 starters and 7 bench players when 18 players are convocados even if suplentes has nulls', () => {
    const mock18Convocados = Array.from({ length: 18 }, (_, i) => `player_${i + 1}`);
    const starters = mock18Convocados.slice(0, 11);
    // Suppose previously rawSuplentes had holes like [null, null, 'player_12', null, 'player_15', 'player_16', 'player_17']
    const holeySubs = [null, null, 'player_12', null, 'player_15', 'player_16', 'player_17'];

    const result = normalizeLineup(starters, holeySubs, mock18Convocados);

    // Titulares must be 11, none null
    expect(result.titulares.filter(Boolean).length).toBe(11);
    expect(result.titulares.length).toBe(11);

    // Suplentes must be 7, none null because we have 18 convocados in total!
    expect(result.suplentes.length).toBe(7);
    expect(result.suplentes.filter(Boolean).length).toBe(7);

    // Total unique assigned players must be 18
    const assigned = new Set([...result.titulares, ...result.suplentes].filter(Boolean));
    expect(assigned.size).toBe(18);

    // Convocados list must contain all 18
    expect(result.convocados.length).toBe(18);
  });

  it('should purge ghost player IDs from titulares, suplentes, and convocados when squad players is provided', async () => {
    const { sanitizeMatchData } = await import('../sanitizeMatchData.js');

    // 17 squad players in total
    const squadPlayers = Array.from({ length: 17 }, (_, i) => ({
      id: `p_${i + 1}`,
      name: `Player ${i + 1}`,
      number: i + 1
    }));

    // Match document has 15 real squad players + 3 ghost IDs (from old deleted players) = 18 raw items
    const rawMatch = {
      id: 'match_burriana',
      rival: 'Xilxes',
      titulares: [
        'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7', 'p_8', 'p_9', 'p_10', 'p_11'
      ],
      suplentes: [
        'p_12', 'p_13', 'p_14', 'p_15', 'ghost_1', 'ghost_2', 'ghost_3'
      ],
      convocados: [
        'p_1', 'p_2', 'p_3', 'p_4', 'p_5', 'p_6', 'p_7', 'p_8', 'p_9', 'p_10', 'p_11',
        'p_12', 'p_13', 'p_14', 'p_15', 'ghost_1', 'ghost_2', 'ghost_3'
      ]
    };

    const { sanitizedMatch, warnings, isCorrupted } = sanitizeMatchData(rawMatch, squadPlayers);

    // Convocados must only contain the 15 valid squad players
    expect(sanitizedMatch.convocados.length).toBe(15);
    expect(sanitizedMatch.convocados).not.toContain('ghost_1');
    expect(sanitizedMatch.convocados).not.toContain('ghost_2');
    expect(sanitizedMatch.convocados).not.toContain('ghost_3');

    // Titulares has 11, suplentes has 4 valid and 3 nulls (length fixed to 7)
    expect(sanitizedMatch.titulares.filter(Boolean).length).toBe(11);
    expect(sanitizedMatch.suplentes.length).toBe(7);
    expect(sanitizedMatch.suplentes.filter(Boolean).length).toBe(4);
    expect(sanitizedMatch.suplentes).toEqual(['p_12', 'p_13', 'p_14', 'p_15', null, null, null]);

    expect(isCorrupted).toBe(true);
    expect(warnings.some(w => w.includes('desvinculados o inexistentes'))).toBe(true);
  });
});
