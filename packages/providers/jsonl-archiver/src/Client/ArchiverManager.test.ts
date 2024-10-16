/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import { ArchiverManager } from './ArchiverManager';
import { DEFAULT_ARCHIVE_OPTIONS } from './types';

describe('#ArchiverManager', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(7);
    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(13);
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(11);
    jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(5);
    jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(0);
  });
  describe('#Happy path', () => {
    afterEach(async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      jest.clearAllTimers();
    });
    it('Should set up folders correctly when they exist', async () => {
      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const spyReadDir = jest.spyOn(fs, 'readdirSync').mockReturnValue(['file_old'] as any);
      const spyRename = jest.spyOn(fs, 'renameSync').mockReturnValue(undefined);
      const manager = new ArchiverManager({ rotationLines: 2 });
      const workingFolder = path.resolve(DEFAULT_ARCHIVE_OPTIONS.workingFolderPath);
      const archiveFolder = path.resolve(DEFAULT_ARCHIVE_OPTIONS.archiveFolderPath);
      expect(spyExists).toHaveBeenNthCalledWith(1, workingFolder);
      expect(spyExists).toHaveBeenNthCalledWith(2, archiveFolder);
      expect(spyReadDir).toHaveBeenCalledWith(workingFolder);
      expect(spyRename).toHaveBeenCalledWith(
        path.join(workingFolder, 'file_old'),
        path.join(archiveFolder, 'file_old')
      );
      await manager.stop();
    }, 300);
    it('Should create folders when they do not exist and createFolders is true', async () => {
      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const spyMkdir = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

      const manager = new ArchiverManager({ rotationLines: 2 });
      await manager.start();
      expect(spyExists).toHaveBeenNthCalledWith(
        1,
        path.resolve(DEFAULT_ARCHIVE_OPTIONS.workingFolderPath)
      );
      expect(spyExists).toHaveBeenNthCalledWith(
        2,
        path.resolve(DEFAULT_ARCHIVE_OPTIONS.archiveFolderPath)
      );
      expect(spyMkdir).toHaveBeenNthCalledWith(
        1,
        path.resolve(DEFAULT_ARCHIVE_OPTIONS.workingFolderPath),
        { recursive: true }
      );
      expect(spyMkdir).toHaveBeenNthCalledWith(
        2,
        path.resolve(DEFAULT_ARCHIVE_OPTIONS.archiveFolderPath),
        { recursive: true }
      );
      await manager.stop();
    }, 300);
    it('Should append data to a file and update statistics', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(mockStream as any);
      const rotateHandler = jest.fn();

      const manager = new ArchiverManager({ rotationLines: 100 });
      manager.on('rotate', rotateHandler);
      manager.start();
      await manager.append({ message: 'hello' }, 'file1');
      await manager.append({ message: 'world' }, 'file1');

      expect(manager['fileHandlersMap'].has('file1')).toBe(true);
      expect(spyCreateStream).toHaveBeenCalled();
      expect(manager['fileHandlersMap'].size).toBe(1);
      expect(manager.stats['file1'].appendSuccesses).toBe(2);
      expect(manager.stats['file1'].appendErrors).toBe(0);
      expect(manager.stats['file1'].lastModifiedTimestamp).toBeDefined();
      expect(rotateHandler).not.toHaveBeenCalled();
      try {
        await manager.stop();
      } catch (error) {
        expect(error).toBeDefined(); // This is a workaround to avoid the unhandled promise rejection warning due to not real file stream
        expect((error as Crash).message).toContain('Error closing file');
      }
    }, 300);
    it('Should append data to several files and update statistics', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(mockStream as any);
      const rotateHandler = jest.fn();

      const manager = new ArchiverManager({
        propertyData: 'message',
        propertyFileName: 'filename',
        propertySkip: 'skip',
        propertySkipValue: 'skip',
        rotationLines: 100,
      });
      manager.on('rotate', rotateHandler);
      manager.start();
      const result1 = await manager.append({ message: 'hello' }, 'file1');
      const result2 = await manager.append([
        { message: 'world', filename: 'file2' },
        { message: 'world', filename: 'file3', skip: 'skip' },
      ]);
      //@ts-expect-error - Mocking write method
      jest.spyOn(manager, 'appendData').mockRejectedValue(new Error('Error appending data'));
      const result3 = await manager.append({ message: 'world', filename: 'file4' });

      expect(result1).toEqual({
        appended: 1,
        errors: 0,
        skipped: 0,
        errorRecords: [],
        skippedRecords: [],
        success: true,
      });
      expect(result2).toEqual({
        appended: 1,
        errors: 0,
        skipped: 1,
        errorRecords: [],
        skippedRecords: [{ message: 'world', filename: 'file3', skip: 'skip' }],
        success: true,
      });
      expect(result3).toEqual({
        appended: 0,
        errors: 1,
        skipped: 0,
        errorRecords: [
          { record: { message: 'world', filename: 'file4' }, error: expect.any(Crash) },
        ],
        skippedRecords: [],
        success: false,
      });

      expect(manager['fileHandlersMap'].has('file1')).toBe(true);
      expect(manager['fileHandlersMap'].has('file2')).toBe(true);
      expect(manager['fileHandlersMap'].has('file3')).toBe(false);
      expect(spyCreateStream).toHaveBeenCalled();
      expect(manager['fileHandlersMap'].size).toBe(2);
      expect(manager.stats['file1'].appendSuccesses).toBe(1);
      expect(manager.stats['file1'].appendErrors).toBe(0);
      expect(manager.stats['file1'].lastModifiedTimestamp).toBeDefined();
      expect(manager.stats['file2'].appendSuccesses).toBe(1);
      expect(manager.stats['file2'].appendErrors).toBe(0);
      expect(manager.stats['file2'].lastModifiedTimestamp).toBeDefined();
      expect(rotateHandler).not.toHaveBeenCalled();
      try {
        await manager.stop();
      } catch (error) {
        expect(error).toBeDefined(); // This is a workaround to avoid the unhandled promise rejection warning due to not real file stream
      }
    });
    it('Should rotate a file when rotationInterval is reached', done => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'rename').mockImplementation(
        //@ts-expect-error - Mocking write method
        (s: string, d: string, cb: (error: Error | null | undefined) => void) => {
          cb(null);
        }
      );
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(new PassThrough() as any);
      const rotateHandler = jest.fn();

      const manager = new ArchiverManager({
        rotationInterval: 100,
        rotationSize: undefined,
        rotationLines: undefined,
      });
      manager.on('rotate', rotateHandler);
      manager.on('error', done);
      manager
        .start()
        .then(() => manager.append({ message: 'hello' }, 'file1'))
        .then(() => {
          expect(manager['fileHandlersMap'].has('file1')).toBe(true);
          expect(spyCreateStream).toHaveBeenCalled();
          setTimeout(() => {
            expect(spyRename).toHaveBeenCalled();
            expect(rotateHandler).toHaveBeenCalledTimes(1);
            manager.stop().then(done).catch(done);
          }, 220);
        })
        .catch(error => {
          done(error);
        });
    }, 500000);
    it('Should clean up inactive handlers after inactiveTimeout', done => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'rename').mockImplementation(
        //@ts-expect-error - Mocking write method
        (s: string, d: string, cb: (error: Error | null | undefined) => void) => {
          cb(null);
        }
      );
      const mockStream = new PassThrough();
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(mockStream as any);
      const handlerCleaned = jest.fn();

      const manager = new ArchiverManager({ inactiveTimeout: 100, rotationLines: 100 });
      manager.on('handlerCleaned', handlerCleaned);
      manager
        .append({ message: 'hello' }, 'file1')
        .then(() => {
          expect(manager['fileHandlersMap'].has('file1')).toBe(true);
          setTimeout(() => {
            expect(handlerCleaned).toHaveBeenCalledWith('file1');
            expect(manager['fileHandlersMap'].has('file1')).toBe(false);
            manager.stop().then(done).catch(done);
          }, 210);
        })
        .catch(done);
    }, 300);
    it('Should rotate a file when rotationSize is reached', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'rename').mockImplementation(
        //@ts-expect-error - Mocking write method
        (s: string, d: string, cb: (error: Error | null | undefined) => void) => {
          cb(null);
        }
      );
      const streamMock = {
        write(data: any, option: any, cb: (error: Error | undefined | null) => void) {
          cb(null);
          return true;
        },
        end(cb: () => void) {
          cb();
        },
      };
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(streamMock as any);
      const rotateHandler = jest.fn();

      const manager = new ArchiverManager({ rotationSize: 10, propertySkip: 'skip' });
      manager.on('rotate', rotateHandler);

      await manager.append({ message: 'hello' }, 'file1');
      await manager.append({ message: 'world' }, 'file1');

      expect(spyCreateStream).toHaveBeenCalled();
      expect(spyRename).toHaveBeenCalled();
      expect(rotateHandler).toHaveBeenCalledTimes(1);
      await manager.stop();
    }, 500);
    it('Should rotate a file when rotationLines is reached', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'rename').mockImplementation(
        //@ts-expect-error - Mocking write method
        (s: string, d: string, cb: (error: Error | null | undefined) => void) => {
          cb(undefined);
        }
      );
      const streamMock = {
        write(data: any, option: any, cb: (error: Error | undefined | null) => void) {
          cb(null);
          return true;
        },
        end(cb: () => void) {
          cb();
        },
      };
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(streamMock as any);
      const rotateHandler = jest.fn();

      const manager = new ArchiverManager({ rotationLines: 2 });
      manager.on('rotate', rotateHandler);

      await manager.append({ message: 'hello' });
      await manager.append({ message: 'world' });
      await manager.append({ message: 'hi' });

      expect(spyCreateStream).toHaveBeenCalled();
      expect(spyRename).toHaveBeenCalled();
      expect(rotateHandler).toHaveBeenCalledTimes(1);
      await manager.stop();
    }, 500);
  });
  describe('#Sad path', () => {
    afterEach(async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      jest.clearAllTimers();
    });
    it(`Should throw error if the rotation options are not correctly set`, () => {
      expect(() => {
        new ArchiverManager({ rotationInterval: -1 });
      }).toThrow('Invalid rotation interval: It must be greater than 0');
      expect(() => {
        new ArchiverManager({ rotationSize: -1 });
      }).toThrow('Invalid rotation size: It must be greater than 0');
      expect(() => {
        new ArchiverManager({ rotationLines: -1 });
      }).toThrow('Invalid rotation lines: It must be greater than 0');
      expect(() => {
        new ArchiverManager();
      }).toThrow('Invalid rotation options: At least one rotation option must be set');
    });
    it('Should throw error if folders do not exist and createFolders is false', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => {
        new ArchiverManager({ createFolders: false, rotationLines: 2 });
      }).toThrow(`Folder [${path.resolve('./data/working')}] does not exist`);
    }, 300);
    it('Should handle error when the append operation fails', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);
      //@ts-expect-error - Mocking write method
      jest.spyOn(mockStream, 'write').mockImplementation((chunk, encoding, callback) => {
        if (typeof encoding === 'function') {
          callback = encoding;
        }
        if (callback) {
          callback(new Error('Write stream error'));
        }
        return true;
      });

      const errorHandler = jest.fn();

      const manager = new ArchiverManager({ rotationLines: 200, retryOptions: { attempts: 1 } });
      manager.on('error', errorHandler);
      await manager.start();
      const result = await manager.append({ message: 'Hello' }, 'file1');
      expect(result).toEqual({
        appended: 0,
        errorRecords: [{ error: expect.any(Crash), record: { message: 'Hello' } }],
        errors: 1,
        skipped: 0,
        skippedRecords: [],
        success: false,
      });
      expect(errorHandler).toHaveBeenCalled();
    }, 300);
    it('Should handle error when the rotate operation fails while moving files', done => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'rename').mockImplementation(
        //@ts-expect-error - Mocking write method
        (s: string, d: string, cb: (error: Error | null | undefined) => void) => {
          cb(new Error('Error renaming file'));
        }
      );
      const mockStream = new PassThrough();
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);
      const errorHandler = jest.fn();

      const manager = new ArchiverManager({ rotationInterval: 100 });
      manager.on('error', errorHandler);
      manager.append({ message: 'Hello' }, 'file1').then(() => {
        setTimeout(() => {
          expect(spyRename).toHaveBeenCalled();
          expect(errorHandler).toHaveBeenCalled();
          done();
        }, 220);
      });
    }, 300);
  });
});
