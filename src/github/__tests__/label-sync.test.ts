import { syncValidationLabels, LabelSyncOptions } from '../label-sync';
import * as prLabels from '../pr-labels';
import { ValidationResult } from '../../rules/validator';

const makeResult = (passed: boolean): ValidationResult => ({
  passed,
  errors: passed ? [] : ['Template section missing'],
  warnings: [],
});

const baseOpts: LabelSyncOptions = {
  owner: 'acme',
  repo: 'widget',
  prNumber: 42,
  token: 'tok',
};

describe('syncValidationLabels', () => {
  let fetchSpy: jest.SpyInstance;
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(prLabels, 'fetchPRLabels');
    addSpy = jest.spyOn(prLabels, 'addLabelsToPR').mockResolvedValue(undefined);
    removeSpy = jest.spyOn(prLabels, 'removeLabelFromPR').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('adds pass label and removes fail label when PR passes', async () => {
    fetchSpy.mockResolvedValue([{ id: 1, name: 'pr-check: failed', color: 'red' }]);
    await syncValidationLabels(makeResult(true), baseOpts);
    expect(addSpy).toHaveBeenCalledWith('acme', 'widget', 42, ['pr-check: passed'], 'tok');
    expect(removeSpy).toHaveBeenCalledWith('acme', 'widget', 42, 'pr-check: failed', 'tok');
  });

  it('adds fail label and removes pass label when PR fails', async () => {
    fetchSpy.mockResolvedValue([{ id: 2, name: 'pr-check: passed', color: 'green' }]);
    await syncValidationLabels(makeResult(false), baseOpts);
    expect(addSpy).toHaveBeenCalledWith('acme', 'widget', 42, ['pr-check: failed'], 'tok');
    expect(removeSpy).toHaveBeenCalledWith('acme', 'widget', 42, 'pr-check: passed', 'tok');
  });

  it('does not add label if already present', async () => {
    fetchSpy.mockResolvedValue([{ id: 3, name: 'pr-check: passed', color: 'green' }]);
    await syncValidationLabels(makeResult(true), baseOpts);
    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('respects custom label names from options', async () => {
    fetchSpy.mockResolvedValue([]);
    await syncValidationLabels(makeResult(true), {
      ...baseOpts,
      passLabel: 'custom: ok',
      failLabel: 'custom: bad',
    });
    expect(addSpy).toHaveBeenCalledWith('acme', 'widget', 42, ['custom: ok'], 'tok');
  });
});
