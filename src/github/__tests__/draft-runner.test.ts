import * as loader from '../../config/loader';
import * as context from '../context';
import * as draftRules from '../../rules/draft';
import * as validator from '../../rules/validator';
import * as actionOutput from '../action-output';
import * as prComment from '../pr-comment';

jest.mock('../../config/loader');
jest.mock('../context');
jest.mock('../../rules/draft');
jest.mock('../../rules/validator');
jest.mock('../action-output');
jest.mock('../pr-comment');

const mockLoadConfig = loader.loadConfigFromDir as jest.Mock;
const mockGetContext = context.getContextFromEnv as jest.Mock;
const mockPrToInput = context.prToCheckInput as jest.Mock;
const mockEvaluate = draftRules.evaluateDraftRules as jest.Mock;
const mockFormat = validator.formatValidationResult as jest.Mock;
const mockEmit = actionOutput.emitValidationOutputs as jest.Mock;
const mockPostComment = prComment.postPRComment as jest.Mock;

describe('runDraftCheck', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPostComment.mockResolvedValue(undefined);
    mockEmit.mockReturnValue(undefined);
  });

  it('skips when no draft config is present', async () => {
    mockLoadConfig.mockReturnValue({});
    const { runDraftCheck } = await import('../draft-runner');
    await runDraftCheck('/tmp');
    expect(mockEvaluate).not.toHaveBeenCalled();
  });

  it('exits with 1 when context is missing', async () => {
    mockLoadConfig.mockReturnValue({ draft: { blockIfDraft: true } });
    mockGetContext.mockReturnValue(null);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const { runDraftCheck } = await import('../draft-runner');
    await expect(runDraftCheck('/tmp')).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('emits outputs and exits 0 on passing result', async () => {
    mockLoadConfig.mockReturnValue({ draft: { blockIfDraft: true } });
    mockGetContext.mockReturnValue({ repo: 'org/repo', prNumber: 1 });
    mockPrToInput.mockReturnValue({ isDraft: false, labels: [] });
    mockEvaluate.mockReturnValue([]);
    mockFormat.mockReturnValue({ passed: true, summary: 'ok', results: [] });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const { runDraftCheck } = await import('../draft-runner');
    await runDraftCheck('/tmp');
    expect(mockEmit).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
