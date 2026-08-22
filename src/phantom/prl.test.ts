import { decodePrl, encodePrl, makePrl, validatePrl } from './prl';

describe('Phantom Response Language', () => {
  it('round-trips a valid message', () => {
    const message = makePrl({ kind: 'RESULT', id: 'R-1', actor: 'engineer', capability: 'implementation', state: 'PROVEN', body: { tests: '4/4' } });
    expect(decodePrl(encodePrl(message))).toEqual(message);
  });

  it('rejects unsupported protocol versions', () => {
    expect(() => validatePrl({ version: '99', kind: 'EVENT', id: 'E-1', parent: null, actor: 'system', capability: 'runtime', state: 'EXECUTING', body: {} })).toThrow('Unsupported PRL version');
  });

  it('rejects malformed frames', () => {
    expect(() => decodePrl('@PRL/1\nKIND EVENT\nEND')).toThrow();
  });

  it('requires a valid lifecycle state', () => {
    expect(() => validatePrl({ version: '1', kind: 'RESULT', id: 'R-2', parent: null, actor: 'worker', capability: 'x', state: 'DONE', body: {} })).toThrow('Unsupported PRL state');
  });
});
