/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { Keygen } from '../keygen';
import { Pusher } from '../pusher';
import { Engine } from './Engine';

// @ts-expect-error - Mocking the pusher
const pusher = {
  name: 'test',
  componentId: v4(),
  push: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  close: jest.fn(),
} as Pusher;

describe('#FileFlinger #Engine', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should create an instance of Engine', () => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, { pushers: [pusher], componentId, name });
      expect(engine).toBeInstanceOf(Engine);
      expect(engine.name).toEqual(name);
      expect(engine.componentId).toEqual(componentId);
      expect(engine.status).toEqual('pass');
      expect(engine.checks).toEqual({
        'test:fileTasks': [
          {
            componentId: componentId,
            componentType: 'fileTasks',
            observedUnit: 'errored files',
            observedValue: [],
            output: undefined,
            status: 'pass',
            time: expect.any(String),
          },
        ],
        'test:lastOperation': [
          {
            componentId: expect.any(String),
            componentType: 'plug',
            observedUnit: 'result of last operation',
            observedValue: 'ok',
            output: undefined,
            status: 'pass',
            time: undefined,
          },
        ],
      });
      expect(engine.metrics).toBeDefined();
    }, 300);
    it('Should start, stop and close the engine', async () => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, { pushers: [pusher], componentId, name });
      await engine.start();
      expect(pusher.start).toHaveBeenCalledTimes(1);
      await engine.stop();
      expect(pusher.stop).toHaveBeenCalledTimes(1);
      await engine.close();
      expect(pusher.close).toHaveBeenCalledTimes(1);
    }, 300);
    it(`Should process a file`, async () => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, { pushers: [pusher], componentId, name });
      await engine.start();
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(engine.limiter, 'schedule').mockReturnValue('file');
      await engine.processFile('file');
      await engine.processFile('file');
      // @ts-expect-error - Mocking the limiter
      expect(engine.limiter.schedule).toHaveBeenCalledTimes(1);
      // @ts-expect-error - Mocking the limiter
      expect(engine.pendingProcess.has('file')).toBeTruthy();
      // @ts-expect-error - Mocking the limiter
      engine.limiter.emit('done', 'file', {}, { taskId: 'file' }, null);
      // @ts-expect-error - Mocking the limiter
      expect(engine.pendingProcess.has('file')).toBeFalsy();
    }, 300);
  });
  describe('#Sad path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it(`Should stop the started pushers if one of then fails to start and rejects`, async () => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, { pushers: [pusher, pusher], componentId, name });
      jest
        .spyOn(pusher, 'start')
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error starting pusher'));
      await expect(engine.start()).rejects.toThrow('Error starting pusher');
      expect(pusher.start).toHaveBeenCalledTimes(2);
      expect(pusher.stop).toHaveBeenCalledTimes(1);
    }, 300);
    it(`Should emit an error event if the keygen fails to generate a key and schedule an errored file task`, done => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, { pushers: [pusher], componentId, name });
      engine.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        // @ts-expect-error - Mocking the limiter
        expect(engine.limiter.schedule).toHaveBeenCalledTimes(1);
        // @ts-expect-error - Mocking the limiter
        expect(engine.fileTasks.getProcessErroredFileTask).toHaveBeenCalledTimes(1);
        done();
      });
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(keygen, 'generateKey').mockRejectedValue(new Error('Error generating key'));
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(engine.limiter, 'schedule').mockReturnValue('file');
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(engine.fileTasks, 'getProcessErroredFileTask').mockReturnValue('task');
      engine.processFile('file');
    }, 300);
    it(`Should emit an error event if the processFileTask fails, and schedule a task process again if task is present in the map`, done => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, {
        pushers: [pusher],
        componentId,
        name,
        failedOperationDelay: 10,
      });
      engine.start().then();
      engine.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        setTimeout(() => {
          // @ts-expect-error - Mocking the limiter
          expect(engine.limiter.schedule).toHaveBeenCalledTimes(2);
          done();
        }, 20);
      });
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(engine.limiter, 'schedule').mockReturnValue('file');
      engine.processFile('file').then(() => {
        // @ts-expect-error - Mocking the limiter
        expect(engine.limiter.schedule).toHaveBeenCalledTimes(1);
        // @ts-expect-error - Mocking the limiter
        expect(engine.pendingProcess.has('file')).toBeTruthy();
        // @ts-expect-error - Mocking the limiter
        engine.limiter.emit(
          'done',
          'file',
          {},
          { taskId: 'file' },
          new Crash('Error processing file')
        );
      });
    }, 300);
    it(`Should emit an error event if the processFileTask fails, and do not schedule a task process again if task is not present in the map`, done => {
      const keygen = new Keygen();
      const componentId = v4();
      const name = 'test';
      const engine = new Engine(keygen, {
        pushers: [pusher],
        componentId,
        name,
        failedOperationDelay: 10,
      });
      engine.start().then();
      engine.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        setTimeout(() => {
          // @ts-expect-error - Mocking the limiter
          expect(engine.limiter.schedule).toHaveBeenCalledTimes(1);
          done();
        }, 20);
      });
      // @ts-expect-error - Mocking the limiter
      jest.spyOn(engine.limiter, 'schedule').mockReturnValue('file');
      engine.processFile('file').then(() => {
        // @ts-expect-error - Mocking the limiter
        expect(engine.limiter.schedule).toHaveBeenCalledTimes(1);
        // @ts-expect-error - Mocking the limiter
        expect(engine.pendingProcess.has('file')).toBeTruthy();
        // @ts-expect-error - Mocking the limiter
        engine.pendingProcess.delete('file');
        // @ts-expect-error - Mocking the limiter
        engine.limiter.emit(
          'done',
          'file',
          {},
          { taskId: 'file' },
          new Crash('Error processing file')
        );
      });
    }, 300);
  });
});
