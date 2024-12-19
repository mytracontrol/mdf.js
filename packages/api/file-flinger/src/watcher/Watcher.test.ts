/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'events';
import fs from 'fs';
import { Watcher } from './Watcher';

// Mock chokidar
class WatchMock extends EventEmitter {
  close = jest.fn();
  add = jest.fn();
  getWatched = jest.fn();
  unwatch = jest.fn();
}

jest.mock('chokidar', () => ({
  watch: jest.fn(() => new WatchMock()),
}));

describe('#FileFlinger #Watcher', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should initialize with default options', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Verify that the Watcher initializes with default options
      expect(watcher.name).toBe('watcher');
      expect(watcher.componentId).toBeDefined();
      expect(watcher.status).toBe('fail'); // Not ready yet
      expect(watcher.errors).toHaveLength(0);
      expect(watcher.checks).toEqual({
        'watcher:errors': [
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
        'watcher:status': [
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
        'watcher:watcher': [
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
      });
    });
    it('Should start the watcher without errors', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // If stop is called before start, it should not throw an error
      await watcher.stop();
      // Start the watcher and expect no errors
      await watcher.start();
      // if start is called again, it should not throw an error
      await watcher.start();
      // Since 'ready' event hasn't been emitted yet, status should be 'fail'
      expect(watcher.status).toBe('fail');
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should emit "add" event when a file is added', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Mock path of the added file
      const mockPath = '/path/to/file.txt';
      // Spy on the 'add' event listener
      const addListener = jest.fn();
      watcher.on('add', addListener);
      // Simulate the 'add' event
      (watcher['watcher'] as EventEmitter).emit('add', mockPath, {});
      // Expect the 'add' listener to be called with the mock path
      expect(addListener).toHaveBeenCalledWith(mockPath);
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should update status to "pass" when ready', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Simulate the 'ready' event
      (watcher['watcher'] as EventEmitter).emit('ready');
      // Expect the status to be 'pass' after ready
      expect(watcher.status).toBe('pass');
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should stop the watcher without errors', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Stop the watcher
      await watcher.stop();
      // Expect the watcher to be not ready after stopping
      expect(watcher.status).toBe('fail');
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should close the watcher without errors', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Close the watcher
      await watcher.close();
      // Expect the watcher instance to be undefined after closing
      expect(watcher['watcher']).toBeUndefined();
    });
    it('Should return correct health checks', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Simulate the 'ready' event
      (watcher['watcher'] as EventEmitter).emit('ready');
      // Get the health checks
      const checks = watcher.checks;
      // Expect health checks to have 'pass' status
      expect(checks[`${watcher.name}:status`][0].status).toBe(Health.STATUS.PASS);
      // Clean up by closing the watcher
      await watcher.close();
    });
    it(`Should manage unlink and change events`, async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // @ts-expect-error - Spy on the logger debug method
      const debug = jest.spyOn(watcher.logger, 'debug');
      // Mock path of the unlinked file
      const mockPath = '/path/to/file.txt';
      // Simulate the 'unlink' event
      (watcher['watcher'] as EventEmitter).emit('unlink', mockPath, {});
      expect(debug).toHaveBeenCalledTimes(1);
      // Simulate the 'change' event
      (watcher['watcher'] as EventEmitter).emit('change', mockPath, {});
      expect(debug).toHaveBeenCalledTimes(2);
      // Clean up by closing the watcher
      await watcher.close();
    });
    it(`Should emit an error event when "add", "unlink" or "change" receive an error instead of a path`, async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Spy on the 'error' event listener
      const error = jest.fn();
      watcher.on('error', error);
      // Simulate the 'add' event with an error
      (watcher['watcher'] as EventEmitter).emit('add', new Error('Test error'), {});
      expect(error).toHaveBeenCalledTimes(1);
      // Simulate the 'unlink' event with an error
      (watcher['watcher'] as EventEmitter).emit('unlink', new Error('Test error'), {});
      expect(error).toHaveBeenCalledTimes(2);
      // Simulate the 'change' event with an error
      (watcher['watcher'] as EventEmitter).emit('change', new Error('Test error'), {});
      expect(error).toHaveBeenCalledTimes(3);
      // Clean up by closing the watcher
      await watcher.close();
    });
  });
  describe('Sad path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should handle errors emitted by the watcher', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      // Mock an error
      const mockError = new Error('Test error');
      // Spy on the 'error' event listener
      const errorListener = jest.fn();
      watcher.on('error', errorListener);
      // Simulate the 'error' event
      (watcher['watcher'] as EventEmitter).emit('error', mockError);
      // Expect the error listener to be called with a Crash instance
      expect(errorListener).toHaveBeenCalled();
      const errorArg = errorListener.mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(Crash);
      expect(errorArg.message).toContain('Watcher error');
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should limit the number of stored errors', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance with a small maxErrors limit
      const maxErrors = 5;
      const watcher = new Watcher({ maxErrors });
      watcher.on('error', () => {});
      // Start the watcher
      await watcher.start();
      // Mock an error
      const mockError = new Error('Test error');
      // Simulate multiple 'error' events exceeding maxErrors
      for (let i = 0; i < maxErrors + 3; i++) {
        (watcher['watcher'] as EventEmitter).emit('error', mockError);
      }
      // Expect the error stack to not exceed maxErrors
      expect(watcher.errors.length).toBe(maxErrors);
      // Clean up by closing the watcher
      await watcher.close();
    });
    it('Should not throw error when closing an already closed watcher', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();

      // Start and close the watcher
      await watcher.start();
      await watcher.close();

      // Attempt to close the watcher again
      await expect(watcher.close()).resolves.toBeUndefined();
    });
    it('Should handle errors when closing the watcher', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      // Create a new Watcher instance
      const watcher = new Watcher();
      // Start the watcher
      await watcher.start();
      //@ts-expect-error - Mocking private method
      jest.spyOn(watcher.watcher, 'close').mockRejectedValue(new Error('Close error'));
      // Expect the close method to throw a Crash error
      await expect(watcher.close()).rejects.toThrow('Error closing the watcher: Close error');
    });
    it('Should throw a error in instance creation if watch folder is not a string or string array, not exists or is not a folder', () => {
      expect(() => {
        new Watcher({ watchPath: '/path/to/folder' });
      }).toThrow('Watch path does not exist: /path/to/folder');
      expect(() => {
        // @ts-expect-error - Invalid watch path
        new Watcher({ watchPath: null });
      }).toThrow('Watcher must have a watch path');
      expect(() => {
        // @ts-expect-error - Invalid watch path
        new Watcher({ watchPath: 123 });
      }).toThrow('Invalid watch path: 123');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false } as fs.Stats);
      expect(() => {
        new Watcher({ watchPath: '/path/to/file.txt' });
      }).toThrow('Watch path is not a directory: /path/to/file.txt');
    });
  });
});
