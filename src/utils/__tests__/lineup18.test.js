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
});
