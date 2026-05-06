import * as https from 'https';
import { EventEmitter } from 'events';
import {
  addLabels,
  removeLabel,
  applyValidationLabels,
  LabelManagerOptions,
} from '../label-manager';

const baseOpts: LabelManagerOptions = {
  owner: 'acme',
  repo: 'app',
  prNumber: 42,
  token: 'tok',
};

function mockRequest(statusCode: number) {
  const req = new EventEmitter() as any;
  req.write = jest.fn();
  req.end = jest.fn();
  const res = new EventEmitter() as any;
  res.statusCode = statusCode;
  jest.spyOn(https, 'request').mockImplementation((_opts: any, cb: any) => {
    cb(res);
    setTimeout(() => res.emit('end'), 0);
    return req;
  });
  return req;
}

beforeEach(() => jest.restoreAllMocks());

describe('addLabels', () => {
  it('does nothing when labels array is empty', async () => {
    const spy = jest.spyOn(https, 'request');
    await addLabels([], baseOpts);
    expect(spy).not.toHaveBeenCalled();
  });

  it('posts labels and resolves on 200', async () => {
    mockRequest(200);
    await expect(addLabels(['validated'], baseOpts)).resolves.toBeUndefined();
  });

  it('throws on non-2xx status', async () => {
    mockRequest(422);
    await expect(addLabels(['x'], baseOpts)).rejects.toThrow('HTTP 422');
  });
});

describe('removeLabel', () => {
  it('resolves on 200', async () => {
    mockRequest(200);
    await expect(removeLabel('stale', baseOpts)).resolves.toBeUndefined();
  });

  it('resolves on 404 (already removed)', async () => {
    mockRequest(404);
    await expect(removeLabel('stale', baseOpts)).resolves.toBeUndefined();
  });

  it('throws on other errors', async () => {
    mockRequest(500);
    await expect(removeLabel('stale', baseOpts)).rejects.toThrow('HTTP 500');
  });
});

describe('applyValidationLabels', () => {
  it('adds success labels and removes failure labels when passed', async () => {
    const addSpy = jest.spyOn(require('../label-manager'), 'addLabels').mockResolvedValue(undefined);
    const removeSpy = jest.spyOn(require('../label-manager'), 'removeLabel').mockResolvedValue(undefined);
    await applyValidationLabels(true, { onSuccess: ['ok'], onFailure: ['fail'] }, baseOpts);
    expect(addSpy).toHaveBeenCalledWith(['ok'], baseOpts);
    expect(removeSpy).toHaveBeenCalledWith('fail', baseOpts);
  });

  it('adds failure labels and removes success labels when failed', async () => {
    const addSpy = jest.spyOn(require('../label-manager'), 'addLabels').mockResolvedValue(undefined);
    const removeSpy = jest.spyOn(require('../label-manager'), 'removeLabel').mockResolvedValue(undefined);
    await applyValidationLabels(false, { onSuccess: ['ok'], onFailure: ['fail'] }, baseOpts);
    expect(addSpy).toHaveBeenCalledWith(['fail'], baseOpts);
    expect(removeSpy).toHaveBeenCalledWith('ok', baseOpts);
  });
});
