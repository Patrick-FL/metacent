import { describe, it, expect } from 'vitest';
import {
  validateAdvisoryTone,
  draftSmartTarget,
  evaluateTargetPriorities,
} from '../goalCopilot';
import { Category } from '../../types';

describe('goalCopilot (Scenarios 5, 6, 7 from ACCEPTANCE.md)', () => {
  it('validates non-patronizing tone and flags moralizing words (Scenario 7)', () => {
    const badText = 'Das ist eine überflüssige Verschwendung. Du musst weniger Kaffee trinken!';
    const badResult = validateAdvisoryTone(badText);
    expect(badResult.isCompliant).toBe(false);
    expect(badResult.flaggedWords).toContain('überflüssig');
    expect(badResult.flaggedWords).toContain('verschwendung');
    expect(badResult.flaggedWords).toContain('du musst');

    const goodText = 'In den letzten Monaten lag der Schnitt bei 45 €. Wenn du möchtest, könnten wir hier 10 € für dein Urlaubsziel einsetzen. Was hältst du davon?';
    const goodResult = validateAdvisoryTone(goodText);
    expect(goodResult.isCompliant).toBe(true);
    expect(goodResult.flaggedWords).toHaveLength(0);
  });

  it('converts conversational wish into structured SMART target (Scenario 5)', () => {
    const draft = draftSmartTarget('Ich will für einen Sommerurlaub sparen, ca 1800 €', '2026-11');
    expect(draft).not.toBeNull();
    expect(draft?.categoryName).toContain('Urlaub');
    expect(draft?.amountCents).toBe(180000); // 1.800,00 €
    expect(draft?.monthlyQuotaCents).toBeGreaterThan(0);
    expect(draft?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles goal prioritization when monthly targets exceed unassigned capacity (Scenario 6)', () => {
    const categoriesWithTargets: Category[] = [
      {
        id: 'cat-notgroschen',
        groupId: 'grp-1',
        name: 'Notgroschen Puffer',
        isHidden: false,
        sortOrder: 0,
        target: { id: 't1', categoryId: 'cat-notgroschen', targetType: 'monthly', amountCents: 20000, dueDate: null, rolloverAction: 'set_aside' },
      },
      {
        id: 'cat-auto',
        groupId: 'grp-1',
        name: 'Kfz-Reparaturrücklage',
        isHidden: false,
        sortOrder: 1,
        target: { id: 't2', categoryId: 'cat-auto', targetType: 'monthly', amountCents: 15000, dueDate: null, rolloverAction: 'set_aside' },
      },
      {
        id: 'cat-bike',
        groupId: 'grp-1',
        name: 'Neues E-Bike',
        isHidden: false,
        sortOrder: 2,
        target: { id: 't3', categoryId: 'cat-bike', targetType: 'monthly', amountCents: 25000, dueDate: null, rolloverAction: 'set_aside' },
      },
    ];

    // Total required: 200 + 150 + 250 = 600 €
    // Available capacity: 400 €
    const evalResult = evaluateTargetPriorities(categoriesWithTargets, 40000, '2026-11');

    expect(evalResult.totalMonthlyNeededCents).toBe(60000);
    expect(evalResult.hasCapacityBottleneck).toBe(true);
    // Notgroschen is priority 1, E-bike is priority 3
    expect(evalResult.rankedTargets[0].category.id).toBe('cat-notgroschen');
    expect(evalResult.supportiveAdviceMarkdown).toContain('Notgroschen');
    // Ensure advice tone is supportive and not patronizing
    const toneCheck = validateAdvisoryTone(evalResult.supportiveAdviceMarkdown);
    expect(toneCheck.isCompliant).toBe(true);
  });
});
