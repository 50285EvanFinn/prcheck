import { evaluateMilestoneRules, MilestoneRule } from '../milestone';
import { Milestone } from '../../github/pr-milestone';

const openMilestone: Milestone = {
  number: 1,
  title: 'v1.0',
  state: 'open',
  due_on: null,
};

const pastDueMilestone: Milestone = {
  number: 2,
  title: 'v0.9',
  state: 'open',
  due_on: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

const soonDueMilestone: Milestone = {
  number: 3,
  title: 'v1.1',
  state: 'open',
  due_on: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('evaluateMilestoneRules', () => {
  it('passes when no milestone required and none assigned', () => {
    const result = evaluateMilestoneRules(null, {});
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when milestone required but not assigned', () => {
    const rule: MilestoneRule = { require_milestone: true };
    const result = evaluateMilestoneRules(null, rule);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/must have a milestone/);
  });

  it('passes when milestone is assigned and required', () => {
    const rule: MilestoneRule = { require_milestone: true };
    const result = evaluateMilestoneRules(openMilestone, rule);
    expect(result.passed).toBe(true);
  });

  it('fails when milestone state is not allowed', () => {
    const rule: MilestoneRule = { allowed_states: ['closed'] };
    const result = evaluateMilestoneRules(openMilestone, rule);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/state "open"/);
  });

  it('warns when milestone is past due', () => {
    const rule: MilestoneRule = { due_within_days: 7 };
    const result = evaluateMilestoneRules(pastDueMilestone, rule);
    expect(result.warnings[0]).toMatch(/past due/);
  });

  it('warns when milestone is due within threshold', () => {
    const rule: MilestoneRule = { due_within_days: 7 };
    const result = evaluateMilestoneRules(soonDueMilestone, rule);
    expect(result.warnings[0]).toMatch(/due in/);
  });

  it('does not warn when due date is beyond threshold', () => {
    const rule: MilestoneRule = { due_within_days: 1 };
    const result = evaluateMilestoneRules(soonDueMilestone, rule);
    expect(result.warnings).toHaveLength(0);
  });
});
