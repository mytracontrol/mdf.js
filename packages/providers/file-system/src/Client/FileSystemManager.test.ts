import fs from 'fs';
import { FileSystemManager } from './FileSystemManager';
import { FileSystemManagerOptions } from './types';

describe('#FileSystemManager', () => {
  const options: FileSystemManagerOptions = {
    writeOptions: {
      encoding: 'utf-8',
      flag: 'w',
    },
    copyOptions: {
      mode: 0,
    },
    readOptions: {
      encoding: 'utf-8',
      flag: 'r',
    },
  };

  let manager: FileSystemManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    manager = new FileSystemManager('testService', options);
  });

  describe('#Happy path', () => {
    it('Should append data to a file', () => {
      const path = 'test.txt';
      const data = 'Hello, World!';
      const spy = jest.spyOn(fs, 'appendFileSync').mockReturnValue();
      manager.appendFile(path, data, { encoding: 'ascii' });
      expect(spy).toHaveBeenCalledWith(path, data, { encoding: 'ascii', flag: 'w' });

      manager.appendFile(path, data, 'base64');
      expect(spy).toHaveBeenCalledWith(path, data, { encoding: 'base64', flag: 'w' });
    });

    it('Should delete a file', () => {
      const path = 'test.txt';
      const spy = jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      manager.deleteFile(path);
      expect(spy).toHaveBeenCalledWith(path);
    });

    it('Should copy a file', () => {
      const source = 'source.txt';
      const destination = 'destination.txt';
      const spy = jest.spyOn(fs, 'copyFileSync').mockReturnValue();
      manager.copyFile(source, destination);
      expect(spy).toHaveBeenCalledWith(source, destination, 0);
    });

    it('Should move a file', () => {
      const source = 'source.txt';
      const destination = 'destination.txt';
      const copySpy = jest.spyOn(fs, 'copyFileSync').mockReturnValue();
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      manager.moveFile(source, destination);
      expect(copySpy).toHaveBeenCalledWith(source, destination, 0);
      expect(unlinkSpy).toHaveBeenCalledWith(source);
    });

    it('Should read a file', () => {
      const path = 'test.txt';
      const data = 'Hello, World!';
      const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue(data);
      const result = manager.readFile(path);
      expect(spy).toHaveBeenCalledWith(path, options.readOptions);
      expect(result).toBe(data);
    });
  });

  describe('#Sad path', () => {
    it('Should handle error when appending data to a file', () => {
      const path = 'test.txt';
      const data = 'Hello, World!';
      jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('append error');
      });
      try {
        manager.appendFile(path, data);
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error?.message).toEqual('Error in file system operation');
        const trace = manager.error?.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error appending data to file');
        expect(trace[1]).toEqual('caused by Error: append error');
      }
    });

    it('Should handle error when deleting a file', () => {
      const path = 'test.txt';
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        throw new Error('unlink error');
      });
      try {
        manager.deleteFile(path);
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error?.message).toEqual('Error in file system operation');
        const trace = manager.error?.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error deleting file');
        expect(trace[1]).toEqual('caused by Error: unlink error');
      }
    });

    it('Should handle error when copying a file', () => {
      const source = 'source.txt';
      const destination = 'destination.txt';
      jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {
        throw new Error('copy error');
      });
      try {
        manager.copyFile(source, destination);
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error?.message).toEqual('Error in file system operation');
        const trace = manager.error?.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error copying file');
        expect(trace[1]).toEqual('caused by Error: copy error');
      }
    });

    it('should handle error when moving a file', () => {
      const source = 'source.txt';
      const destination = 'destination.txt';
      jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {
        throw new Error('copy error');
      });
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync');
      try {
        manager.moveFile(source, destination);
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error?.message).toEqual('Error in file system operation');
        const trace = manager.error?.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error moving file');
        expect(trace[1]).toEqual('caused by Error: copy error');
        expect(unlinkSpy).not.toHaveBeenCalled();
      }
    });

    it('should handle error when reading a file', () => {
      const path = 'test.txt';
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('read error');
      });
      try {
        const result = manager.readFile(path);
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.isErrored).toBeTruthy();
        expect(manager.error?.message).toEqual('Error in file system operation');
        const trace = manager.error?.trace() || [];
        expect(trace[0]).toEqual('CrashError: Error reading file');
        expect(trace[1]).toEqual('caused by Error: read error');
      }
    });
  });
});
