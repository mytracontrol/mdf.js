import fs from 'fs';
import path from 'path';
import { JsonlFileStoreManager } from './JsonlFileStoreManager';
import { JsonlFileStoreManagerOptions } from './types';

describe('#JsonlFileStoreManager', () => {
  const options: JsonlFileStoreManagerOptions = {
    rotationOptions: {
      openFilesFolderPath: './open',
      closedFilesFolderPath: './closed',
      interval: 5000,
      retryOptions: {},
    },
    writeOptions: {
      encoding: 'utf8',
      retryOptions: {},
    },
  };

  let manager: JsonlFileStoreManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(7);
    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(13);
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(11);
    jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(5);
    jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(0);
  });

  describe('#Happy path', () => {
    it('Should startup the open files folder correctly', () => {
      const spyReadDir = jest.spyOn(fs, 'readdirSync').mockReturnValue(['file_old'] as any);
      const spyRename = jest.spyOn(fs, 'renameSync').mockReturnValue();
      const spyWrite = jest.spyOn(fs, 'writeFileSync').mockReturnValue();

      manager = new JsonlFileStoreManager('testService', options);
      const openFolder = options.rotationOptions.openFilesFolderPath;
      const closedFolder = options.rotationOptions.closedFilesFolderPath;
      expect(spyReadDir).toHaveBeenCalledWith(openFolder);
      expect(spyRename).toHaveBeenCalledWith(
        path.join(openFolder, 'file_old'),
        path.join(closedFolder, 'file_old')
      );
      expect(spyWrite).toHaveBeenCalledWith(
        path.join(openFolder, 'data_2024-08-13_110500'),
        '',
        options.writeOptions
      );

      manager.stopRotationTimer();
    });

    it('Should append data when there is no rotate operation in course', async () => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue(['file_old'] as any[]);
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      const spy = jest.spyOn(fs, 'appendFileSync').mockReturnValue();
      manager = new JsonlFileStoreManager('testService', options);
      await manager.append('Hello');
      expect(spy).toHaveBeenCalledWith(
        path.join(options.rotationOptions.openFilesFolderPath, 'data_2024-08-13_110500'),
        'Hello',
        options.writeOptions
      );
      manager.stopRotationTimer();
    });
    it('Should append data when there is a rotate operation in course', done => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      const appendSpy = jest.spyOn(fs, 'appendFileSync').mockReturnValue();
      manager = new JsonlFileStoreManager('testService', options);
      manager['isRotating'] = true;
      const appendPromise = manager.append('Hello');
      expect(appendSpy).toHaveBeenCalledTimes(0);
      manager['isRotating'] = false;
      manager.emit('rotation-complete');
      appendPromise
        .then(() => {
          expect(appendSpy).toHaveBeenCalledTimes(1);
          done();
        })
        .catch(() => {
          throw new Error('Should not be here');
        })
        .finally(() => {
          manager.stopRotationTimer();
        });
    });

    it('Should rotate file when there is no append operation in course', async () => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const renameSpy = jest.spyOn(fs, 'renameSync').mockReturnValue();
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      manager = new JsonlFileStoreManager('testService', options);
      jest.advanceTimersByTime(options.rotationOptions.interval);
      expect(renameSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledTimes(2);
      manager.stopRotationTimer();
    });
    it('Should rotate file when there is an append operation in course', async () => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const renameSpy = jest.spyOn(fs, 'renameSync').mockReturnValue();
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      manager = new JsonlFileStoreManager('testService', options);
      manager['isAppending'] = true;
      jest.advanceTimersByTime(options.rotationOptions.interval);
      expect(renameSpy).toHaveBeenCalledTimes(0);
      expect(writeSpy).toHaveBeenCalledTimes(1);
      manager.emit('append-complete');
      expect(renameSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledTimes(2);
      manager.stopRotationTimer();
    });
  });

  describe('#Sad path', () => {
    it('Should handle error when the open folder setup fails', () => {
      jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
        throw new Error('readdir error');
      });
      try {
        manager = new JsonlFileStoreManager('testService', options);
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Error creating JsonlFileStoreManager instance');
        const trace = error.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error creating JsonlFileStoreManager instance');
        expect(trace[1]).toEqual('caused by CrashError: Error setting up open files folder');
        expect(trace[2]).toEqual('caused by Error: readdir error');
      }
    });
    it('Should handle error when the append operation fails', async () => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('append error');
      });
      manager = new JsonlFileStoreManager('testService', {
        ...options,
        writeOptions: {
          retryOptions: { attempts: 1 },
        },
      });
      await manager
        .append('Hello')
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error).toBeDefined();
          expect(error.message).toContain('Error appending data to file');
          const trace = error.trace() || [];
          expect(trace[0]).toContain('Error appending data to file');
          expect(trace[2]).toEqual('caused by CrashError: Error appending data to file');
          expect(trace[3]).toEqual('caused by Error: append error');
        })
        .finally(() => {
          manager.stopRotationTimer();
        });
    });
    it('Should handle error when the rotate operation fails', done => {
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'writeFileSync').mockReturnValue();
      jest.spyOn(fs, 'renameSync').mockImplementation(() => {
        throw new Error('rename error');
      });

      manager = new JsonlFileStoreManager('testService', {
        ...options,
        rotationOptions: {
          ...options.rotationOptions,
          retryOptions: { attempts: 1 },
        },
      });
      manager.on('errored', () => {
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error).toBeDefined();
        expect(manager.error?.message).toEqual('Error in jsonl file store operation');
        const trace = manager.error?.trace();
        expect(trace![0]).toContain('Error rotating file');
        expect(trace![2]).toEqual('caused by CrashError: Error rotating file');
        expect(trace![3]).toEqual('caused by Error: rename error');
        done();
      });
      jest.advanceTimersByTime(options.rotationOptions.interval);
    });
  });
});
