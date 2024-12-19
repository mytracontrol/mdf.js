/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import fs from 'fs';
import { setTimeout as wait } from 'timers/promises';
import { v4 } from 'uuid';
import { FileFlinger } from './FileFlinger';
import { Pusher } from './pusher';

// @ts-expect-error - Mocking the pusher
const pusher = {
  name: 'test',
  componentId: v4(),
  push: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  close: jest.fn(),
} as Pusher;

describe('#FileFlinger', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should create a new instance of FileFlinger', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      const fileFlinger = new FileFlinger('myFlinger', {
        pushers: [pusher],
      });
      expect(fileFlinger).toBeInstanceOf(FileFlinger);
    });
    it(`Should stop/start/close the FileFlinger`, async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      const fileFlinger = new FileFlinger('myFlinger', {
        watchPath: `${__dirname}/FileFlinger.test.ts`,
        pushers: [pusher],
      });
      expect(fileFlinger.checks).toEqual({
        'myFlinger:errors': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: [],
            observedUnit: 'observed errors',
            time: undefined,
            output: undefined,
          },
        ],
        'myFlinger:status': [
          {
            status: 'fail',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: 'fail',
            observedUnit: 'status',
            time: expect.any(String),
            output: 'Watcher is not ready',
          },
        ],
        'myFlinger:watcher': [
          {
            status: 'warn',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: undefined,
            observedUnit: 'watched files',
            time: expect.any(String),
            output: 'Watcher is not started',
          },
        ],
        'test:lastOperation': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'plug',
            observedValue: 'ok',
            observedUnit: 'result of last operation',
            time: undefined,
            output: undefined,
          },
        ],
        'myFlinger:fileTasks': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'fileTasks',
            observedValue: [],
            observedUnit: 'errored files',
            time: expect.any(String),
            output: undefined,
          },
        ],
      });
      expect(fileFlinger.status).toEqual('fail');

      await fileFlinger.start();
      await wait(150);
      expect(fileFlinger.checks).toEqual({
        'myFlinger:errors': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: [],
            observedUnit: 'observed errors',
            time: undefined,
            output: undefined,
          },
        ],
        'myFlinger:status': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: 'pass',
            observedUnit: 'status',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'myFlinger:watcher': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: expect.any(Object),
            observedUnit: 'watched files',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'test:lastOperation': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'plug',
            observedValue: 'ok',
            observedUnit: 'result of last operation',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'myFlinger:fileTasks': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'fileTasks',
            observedValue: [],
            observedUnit: 'errored files',
            time: expect.any(String),
            output: undefined,
          },
        ],
      });
      expect(fileFlinger.status).toEqual('pass');
      expect(pusher.start).toHaveBeenCalled();

      await fileFlinger.stop();
      expect(fileFlinger.checks).toEqual({
        'myFlinger:errors': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: [],
            observedUnit: 'observed errors',
            time: undefined,
            output: undefined,
          },
        ],
        'myFlinger:status': [
          {
            status: 'fail',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: 'fail',
            observedUnit: 'status',
            time: expect.any(String),
            output: 'Watcher is not ready',
          },
        ],
        'myFlinger:watcher': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: expect.any(Object),
            observedUnit: 'watched files',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'test:lastOperation': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'plug',
            observedValue: 'ok',
            observedUnit: 'result of last operation',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'myFlinger:fileTasks': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'fileTasks',
            observedValue: [],
            observedUnit: 'errored files',
            time: expect.any(String),
            output: undefined,
          },
        ],
      });
      expect(fileFlinger.status).toEqual('fail');
      expect(pusher.stop).toHaveBeenCalled();

      await fileFlinger.close();
      expect(fileFlinger.checks).toEqual({
        'myFlinger:errors': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: [],
            observedUnit: 'observed errors',
            time: undefined,
            output: undefined,
          },
        ],
        'myFlinger:status': [
          {
            status: 'fail',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: 'fail',
            observedUnit: 'status',
            time: expect.any(String),
            output: 'Watcher is not ready',
          },
        ],
        'myFlinger:watcher': [
          {
            status: 'warn',
            componentId: expect.any(String),
            componentType: 'watcher',
            observedValue: undefined,
            observedUnit: 'watched files',
            time: expect.any(String),
            output: 'Watcher is not started',
          },
        ],
        'test:lastOperation': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'plug',
            observedValue: 'ok',
            observedUnit: 'result of last operation',
            time: expect.any(String),
            output: undefined,
          },
        ],
        'myFlinger:fileTasks': [
          {
            status: 'pass',
            componentId: expect.any(String),
            componentType: 'fileTasks',
            observedValue: [],
            observedUnit: 'errored files',
            time: expect.any(String),
            output: undefined,
          },
        ],
      });
      expect(fileFlinger.status).toEqual('fail');
      expect(pusher.close).toHaveBeenCalled();
    });
    it(`Should try to process a file if the watcher emit an 'add' event`, async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      const fileFlinger = new FileFlinger('myFlinger', {
        watchPath: `${__dirname}/FileFlinger.test.ts`,
        pushers: [pusher],
      });
      await fileFlinger.start();
      // @ts-expect-error - Mocking the processFile
      jest.spyOn(fileFlinger.engine, 'processFile').getMockImplementation((file: string) => {});
      // @ts-expect-error - Mocking the watcher
      fileFlinger.watcher.emit('add', `${__dirname}/FileFlinger.test.ts`);
      // @ts-expect-error - Mocking the processFile
      expect(fileFlinger.engine.processFile).toHaveBeenCalled();
    });
  });
  describe('#Sad path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should throw an error if no watchPath are passed', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);

      try {
        const fileFlinger = new FileFlinger('myFlinger', {
          pushers: [pusher],
          // @ts-expect-error - Testing the error
          watchPath: 2,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe('FileFlinger must have a valid watch path');
      }
    });
    it(`Should throw an error if no pushers are passed`, () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileFlinger('myFlinger', { pushers: [] });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe('FileFlinger must have at least one pusher');
      }
    });
    it(`Should emit errors if watcher or engine emit an error`, async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      const fileFlinger = new FileFlinger('myFlinger', {
        watchPath: `${__dirname}/FileFlinger.test.ts`,
        pushers: [pusher],
      });
      await fileFlinger.start();
      let errorCount = 0;
      fileFlinger.on('error', error => {
        errorCount++;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('My error');
      });
      // @ts-expect-error - Mocking the watcher
      fileFlinger.watcher.emit('error', new Error('My error'));
      // @ts-expect-error - Mocking the engine
      fileFlinger.engine.emit('error', new Error('My error'));
      expect(errorCount).toBe(2);
    });
  });
});
