import { evaluateDraftRules } from '../draft';
import { PRCheckInput } from '../../config/schema';

function makeInput(overrides: Partial<PRCheckInput> = {}): PRCheckInput {
  return {
    title: 'Test PR',
    body: 'Some description',
    author: 'dev',
    reviewers: [],
    labels: [],
    isDraft: false,
    ...overrides,
  } as PRCheckInput;
}

describe('evaluateDraftRules', () => {
  it('returns empty results when config is empty', () => {
    const results = evaluateDraftRules(makeInput(), {});
    expect(results).toHaveLength(0);
  });

  it('fails when blockIfDraft is true and PR is draft', () => {
    const results = evaluateDraftRules(makeInput({ isDraft: true }), { blockIfDraft: true });
    expect(results).toContainEqual(
      expect.objectContaining({ rule: 'draft/block-if-draft', status: 'failure' })
    );
  });

  it('does not fail when blockIfDraft is true and PR is not draft', () => {
    const results = evaluateDraftRules(makeInput({ isDraft: false }), { blockIfDraft: true });
    const failure = results.find(r => r.rule === 'draft/block-if-draft');
    expect(failure).toBeUndefined();
  });

  it('warns when draft PR is missing the draftLabel', () => {
    const results = evaluateDraftRules(
      makeInput({ isDraft: true, labels: [] }),
      { draftLabel: 'WIP' }
    );
    expect(results).toContainEqual(
      expect.objectContaining({ rule: 'draft/label-sync', status: 'warning' })
    );
  });

  it('warns when ready PR still has draftLabel', () => {
    const results = evaluateDraftRules(
      makeInput({ isDraft: false, labels: ['WIP'] }),
      { draftLabel: 'WIP' }
    );
    expect(results).toContainEqual(
      expect.objectContaining({ rule: 'draft/label-sync', status: 'warning' })
    );
  });

  it('succeeds when PR is ready for review', () => {
    const results = evaluateDraftRules(makeInput({ isDraft: false }), { blockIfDraft: true });
    expect(results).toContainEqual(
      expect.objectContaining({ rule: 'draft/ready-for-review', status: 'success' })
    );
  });

  it('handles missing isDraft field gracefully', () => {
    const input = makeInput();
    delete (input as any).isDraft;
    const results = evaluateDraftRules(input, { blockIfDraft: true });
    expect(results).toContainEqual(
      expect.objectContaining({ rule: 'draft/ready-for-review', status: 'success' })
    );
  });
});
