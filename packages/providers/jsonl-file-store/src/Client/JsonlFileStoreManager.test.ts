import { Crash } from '@mdf.js/crash';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import { setTimeout as waitFor } from 'timers/promises';
import { JsonlFileStoreManager } from './JsonlFileStoreManager';
import { SingleJsonlFileManager } from './SingleJsonlFileManager';
import { JsonlFileStoreManagerOptions } from './types';

describe('#JsonlFileStoreManager', () => {
  const options: JsonlFileStoreManagerOptions = {
    openFilesFolderPath: './open',
    closedFilesFolderPath: './closed',
    createFolders: true,
    fileEncoding: 'utf-8',
    failOnStartSetup: true,
    rotationInterval: 5000,
    rotationRetryOptions: { attempts: 1 },
    appendRetryOptions: { attempts: 1 },
  };

  let manager: JsonlFileStoreManager;

  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(7);
    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(13);
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(11);
    jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(5);
    jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(0);
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  describe('#Happy path', () => {
    it('Should startup the folders correctly when folders exists', () => {
      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const spyReadDir = jest.spyOn(fs, 'readdirSync').mockReturnValue(['file_old'] as any);
      const spyRename = jest.spyOn(fs, 'renameSync').mockReturnValue();

      manager = new JsonlFileStoreManager('testService', options);
      manager.start();
      const openFolder = path.resolve(options.openFilesFolderPath);
      const closedFolder = path.resolve(options.closedFilesFolderPath);
      expect(spyExists).toHaveBeenCalledWith(openFolder);
      expect(spyExists).toHaveBeenCalledWith(closedFolder);
      expect(spyReadDir).toHaveBeenCalledWith(openFolder);
      expect(spyRename).toHaveBeenCalledWith(
        path.join(openFolder, 'file_old'),
        path.join(closedFolder, 'file_old')
      );
      manager.stop();
    });

    test('Should startup the folders correctly when createFolders is true', () => {
      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const spyMkdir = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

      manager = new JsonlFileStoreManager('testService', options);
      manager.start();
      expect(spyExists).toHaveBeenCalledWith(path.resolve('./open'));
      expect(spyExists).toHaveBeenCalledWith(path.resolve('./closed'));
      expect(spyMkdir).toHaveBeenCalledWith(path.resolve('./open'), { recursive: true });
      expect(spyMkdir).toHaveBeenCalledWith(path.resolve('./closed'), { recursive: true });
      manager.stop();
    });
    it('Should clear rotation timers and clear open file managers', () => {
      const mockManager = {
        rotationTimer: setTimeout(() => {}, 1000),
      } as unknown as SingleJsonlFileManager;

      manager = new JsonlFileStoreManager('testService', options);
      manager['openFilesManagers'].set('file1', mockManager);
      manager.stop();
      expect(mockManager.rotationTimer).toBeUndefined();
      expect(manager['openFilesManagers'].size).toBe(0);
    });

    it('Should append data to a file', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(mockStream as any);
      const successHandler = jest.fn();

      manager = new JsonlFileStoreManager('testService', options);
      manager.on('success', successHandler);
      manager.start();
      await manager.append('hello', 'file1');
      await manager.append('world', 'file1');
      expect(manager['openFilesManagers'].has('file1')).toBe(true);
      expect(spyCreateStream).toHaveBeenCalled();
      expect(manager['openFilesManagers'].size).toBe(1);
      expect(manager.filesStats['file1'].numberOfAppendSuccesses).toBe(2);
      expect(manager.filesStats['file1'].numberOfAppendErrors).toBe(0);
      expect(manager.filesStats['file1'].lastAppendSuccessTimestamp).toBeDefined();
      expect(successHandler).toHaveBeenCalledTimes(2);
      manager.stop();
    });
    it('Should rotate a file when timeout is reached', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const spyRename = jest.spyOn(fs, 'renameSync').mockReturnValue();
      const mockStream = new PassThrough();
      const spyCreateStream = jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(mockStream as any);
      const successHandler = jest.fn();

      manager = new JsonlFileStoreManager('testService', { ...options, rotationInterval: 100 });
      manager.on('success', successHandler);
      manager.start();
      await manager.append('hello', 'file1');
      await waitFor(1000);
      expect(manager['openFilesManagers'].has('file1')).toBe(true);
      expect(spyCreateStream).toHaveBeenCalled();
      expect(manager['openFilesManagers'].size).toBe(1);
      expect(spyRename).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalledTimes(1);
      manager.stop();
    });
  });

  describe('#Sad path', () => {
    it('Should throw error if folders do not exist and createFolders is false', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      manager = new JsonlFileStoreManager('testService', { ...options, createFolders: false });
      try {
        manager.start();
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Error creating JsonlFileStoreManager instance');
        const trace = error.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error creating JsonlFileStoreManager instance');
        expect(trace[1]).toEqual(
          `caused by CrashError: Error: Folder [${path.resolve('./open')}] does not exist`
        );
      }
    });
    it('Should emit error if failOnStartSetup is false', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      manager = new JsonlFileStoreManager('testService', {
        ...options,
        createFolders: false,
        failOnStartSetup: false,
      });
      const errorHandler = jest.fn();
      manager.on('error', errorHandler);
      manager.start();
      expect(errorHandler).toHaveBeenCalled();
      expect(manager.isErrored).toBe(true);
    });

    it('Should handle error when the append operation fails', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('append error');
      });
      const mockStream = new PassThrough();
      jest
        .spyOn(mockStream, 'write')
        .mockImplementation(
          (chunk, encoding, callback?: (error: Error | null | undefined) => void) => {
            if (typeof encoding === 'function') {
              callback = encoding;
            }
            if (callback) {
              callback(new Error('Write stream error'));
            }
            return true;
          }
        );
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);

      const errorHandler = jest.fn(error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toContain('Error in jsonl file store operation');
        const trace = error.trace() || [];
        expect(trace[0]).toContain('CrashError: Error in jsonl file store operation');
        expect(trace[1]).toEqual('caused by CrashError: Error appending data to file');
        expect(trace[4]).toEqual('caused by CrashError: Error appending data');
        expect(trace[5]).toEqual('caused by Error: Write stream error');
      });
      manager = new JsonlFileStoreManager('testService', options);
      manager.on('error', errorHandler);
      await manager.append('Hello', 'file1');
      manager.stop();
    });
    it('Should handle error when the rotate operation fails while moving files', done => {
      jest.useFakeTimers();
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'renameSync').mockImplementation(() => {
        throw new Error('rename error');
      });
      const mockStream = new PassThrough();
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);
      const errorHandler = jest.fn(error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toContain('Error in jsonl file store operation');
        const trace = error.trace() || [];
        expect(trace[0]).toContain('CrashError: Error in jsonl file store operation');
        expect(trace[1]).toEqual('caused by CrashError: Rotation error');
        expect(trace[4]).toEqual('caused by CrashError: Error rotating file');
        expect(trace[5]).toEqual('caused by Error: rename error');
        manager.stop();
        done();
      });
      manager = new JsonlFileStoreManager('testService', options);
      manager.on('error', errorHandler);
      manager.start();
      manager.append('Hello', 'file1').then(() => {
        jest.advanceTimersToNextTimer();
      });
      jest.advanceTimersToNextTimer();
    });
    it('Should handle error when the rotate operation fails due to invalid filename', done => {
      jest.useFakeTimers();
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);
      const errorHandler = jest.fn(error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toContain('Error in jsonl file store operation');
        const trace = error.trace() || [];
        expect(trace[0]).toContain('CrashError: Error in jsonl file store operation');
        expect(trace[1]).toEqual('caused by CrashError: Rotation error');
        expect(trace[4]).toEqual(
          'caused by CrashError: Error rotating file: File name is not valid'
        );
        manager.stop();
        done();
      });
      manager = new JsonlFileStoreManager('testService', options);
      manager.on('error', errorHandler);
      manager.start();
      manager.append('Hello', 'file1').then(() => {
        const singleManager = manager['openFilesManagers'].get('file1');
        singleManager!['currentFileName'] = undefined;
        jest.advanceTimersToNextTimer();
      });
      jest.advanceTimersToNextTimer();
    });
    it('Should handle error when the rotate operation fails due to unexistent stream', done => {
      jest.useFakeTimers();
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockStream = new PassThrough();
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockStream as any);
      const errorHandler = jest.fn(error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toContain('Error in jsonl file store operation');
        const trace = error.trace() || [];
        expect(trace[0]).toContain('CrashError: Error in jsonl file store operation');
        expect(trace[1]).toEqual('caused by CrashError: Rotation error');
        expect(trace[4]).toEqual(
          'caused by CrashError: Error rotating file: No file stream to rotate'
        );
        manager.stop();
        done();
      });
      manager = new JsonlFileStoreManager('testService', options);
      manager.on('error', errorHandler);
      manager.start();
      manager.append('Hello', 'file1').then(() => {
        const singleManager = manager['openFilesManagers'].get('file1');
        singleManager!['currentFileStream'] = null;
        jest.advanceTimersToNextTimer();
      });
      jest.advanceTimersToNextTimer();
    });
  });
});
