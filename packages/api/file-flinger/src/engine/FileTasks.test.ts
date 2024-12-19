/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Sequence, Single } from '@mdf.js/tasks';
import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import stream from 'stream';
import { v4 } from 'uuid';
import { Pusher } from '../pusher';
import { FileTasks } from './FileTasks';
import { ErrorStrategy, PostProcessingStrategy } from './types';

// @ts-expect-error - Mocking the pusher
const pusher = {
  name: 'test',
  componentId: v4(),
  push: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  close: jest.fn(),
} as Pusher;
describe('#FileFlinger #FileTasks', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('Should create a new instance of FileTasks', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const fileFlinger = new FileTasks({ pushers: [pusher] });
      expect(fileFlinger).toBeInstanceOf(FileTasks);
    });
    it('Should create a task handler as a sequence for file processing with default values', () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({ pushers: [pusher] });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      // Verify that the sequence is an instance of Sequence
      expect(sequence).toBeInstanceOf(Sequence);
    });
    it('Should create a task handler as a sequence for file processing with "delete" as post processing task', () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      // Verify that the sequence is an instance of Sequence
      expect(sequence).toBeInstanceOf(Sequence);
      //@ts-expect-error - Verify that the post processing task is a sequence
      expect(sequence.pattern.post[0].taskId).toEqual('delete');
    });
    it('Should create a task handler as a sequence for file processing with "archive" as post processing task', () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ARCHIVE,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      // Verify that the sequence is an instance of Sequence
      expect(sequence).toBeInstanceOf(Sequence);
      //@ts-expect-error - Verify that the post processing task is a sequence
      expect(sequence.pattern.post[0].taskId).toEqual('archive');
    });
    it('Should create a task handler as a sequence for file processing with "zip" as post processing task', () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ZIP,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      // Verify that the sequence is an instance of Sequence
      expect(sequence).toBeInstanceOf(Sequence);
      //@ts-expect-error - Verify that the post processing task is a sequence
      expect(sequence.pattern.post[0].taskId).toEqual('zip');
    });
    it('Should create a task handler as a single for error processing with default values', () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({ pushers: [pusher] });
      // Get the process directory task sequence
      const sequence = fileTasks.getProcessErroredFileTask(
        '/path/to/directory',
        new Error('Test error')
      );
      // Verify that the sequence is an instance of Sequence
      expect(sequence).toBeInstanceOf(Single);
    });
    it('Should process a file properly if all the tasks resolve with a "delete" post processing strategy in a linux system - error: { code: 1 } & !stderr', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeDefined();
    });
    it('Should process a file properly if all the tasks resolve with a "delete" post processing strategy in a linux system - stdout: ""', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, '', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeDefined();
    });
    it('Should process a file properly if all the tasks resolve with a "delete" post processing strategy in a windows system - stdout: "True"', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'False', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeDefined();
    });
    it(`Should process a file properly if all the tasks resolve with a "archive" post processing strategy in a linux system - error: { code: 1 } & !stderr`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ARCHIVE,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeDefined();
    });
    it(`Should process a file properly if all the tasks resolve with a "zip" post processing strategy in a linux system - error: { code: 1 } & !stderr`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ZIP,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'createReadStream').mockReturnValue({} as any);
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      jest.spyOn(stream, 'pipeline').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (a: any, b: any, c: any, cb: (error: any) => void) => {
          cb(null);
        }
      );
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeDefined();
    });
    it(`Should process an errored file properly if all the tasks resolve with a "delete" error strategy in a linux system - error: { code: 1 } & !stderr`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        errorStrategy: ErrorStrategy.DELETE,
      });
      // Get the process directory task sequence
      const sequence = fileTasks.getProcessErroredFileTask(
        '/path/to/directory',
        new Error('Test error')
      );
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeUndefined();
      const entries = Array.from(fileTasks.erroredFiles.entries());
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toEqual('directory');
      expect(entries[0][1]).toEqual({
        errorTrace: ['Error: Test error'],
        path: '/path/to/directory',
        strategy: 'delete',
      });
    });
    it(`Should process an errored file properly if all the tasks resolve with a "dead letter" error strategy in a linux system - error: { code: 1 } & !stderr`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        errorStrategy: ErrorStrategy.DEAD_LETTER,
        deadLetterFolder: '/path/to/dead-letter',
      });
      // Get the process directory task sequence
      const sequence = fileTasks.getProcessErroredFileTask(
        '/path/to/directory',
        new Error('Test error')
      );
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeUndefined();
      const entries = Array.from(fileTasks.erroredFiles.entries());
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toEqual('directory');
      expect(entries[0][1]).toEqual({
        errorTrace: ['Error: Test error'],
        path: '/path/to/directory',
        strategy: 'dead-letter',
      });
    });
    it(`Should process an errored file properly if all the tasks resolve with a "ignore" error strategy in a linux system - error: { code: 1 } & !stderr`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        errorStrategy: ErrorStrategy.IGNORE,
      });
      // Get the process directory task sequence
      const sequence = fileTasks.getProcessErroredFileTask(
        '/path/to/directory',
        new Error('Test error')
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeUndefined();
      const entries = Array.from(fileTasks.erroredFiles.entries());
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toEqual('directory');
      expect(entries[0][1]).toEqual({
        errorTrace: ['Error: Test error'],
        path: '/path/to/directory',
        strategy: 'ignore',
      });
    });
    it(`Should process an errored file properly if delete process fail with a "delete" error strategy in a linux system - error: { code: 1 } & !stderr including it in the register`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        errorStrategy: ErrorStrategy.DELETE,
      });
      // Get the process directory task sequence
      const sequence = fileTasks.getProcessErroredFileTask(
        '/path/to/directory',
        new Error('Test error')
      );
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'no-null', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).resolves.toBeUndefined();
      const entries = Array.from(fileTasks.erroredFiles.entries());
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toEqual('directory');
      expect(entries[0][1]).toEqual({
        errorTrace: [
          'Error: Test error',
          'CrashError: Error processing file [directory]: Error deleting file /path/to/directory: File [/path/to/directory] is currently open and cannot be deleted',
          'caused by CrashError: Error deleting file /path/to/directory: File [/path/to/directory] is currently open and cannot be deleted',
          'caused by CrashError: File [/path/to/directory] is currently open and cannot be deleted',
        ],
        path: '/path/to/directory',
        strategy: 'delete',
      });
    });
  });
  describe('#Sad path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it(`Should throw an error if no pushers are passed`, () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileTasks({ pushers: [] });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe('FileFlinger must have at least one pusher');
      }
    });
    it(`Should throw an error if the post processing strategy is not to delete and there is not an archive folder`, () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileTasks({
          pushers: [pusher],
          postProcessingStrategy: PostProcessingStrategy.ARCHIVE,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe(
          'FileFlinger must have an archive folder if postProcessingStrategy is not DELETE'
        );
      }
    });
    it(`Should throw an error if the error strategy is dead letter and there is not a dead letter folder`, () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileTasks({
          pushers: [pusher],
          errorStrategy: ErrorStrategy.DEAD_LETTER,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe(
          'FileFlinger must have a dead-letter folder if onKeyingError is DEAD_LETTER'
        );
      }
    });
    it('Should throw a error if the post processing strategy is supported', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileTasks({
          pushers: [pusher],
          postProcessingStrategy: 'unsupported' as PostProcessingStrategy,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe('Unknown post-processing strategy: unsupported');
      }
    });
    it('Should throw a error if the error strategy is supported', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
      try {
        new FileTasks({
          pushers: [pusher],
          errorStrategy: 'unsupported' as ErrorStrategy,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe('Unknown error strategy: unsupported');
      }
    });
    it('Should rejects the file processing if there is a problem in the push file process', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockRejectedValue(new Error('myError'));
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Execution error in task [push]: CrashError: Execution error in task [push]: Error pushing file /path/to/file.txt to test: myError,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by CrashError: Error pushing file /path/to/file.txt to test: myError,\ncaused by Error: myError'
      );
    });
    it('Should rejects the file processing if the file is in use with a "delete" post processing strategy in a linux system - stdout: "no-null"', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'no-null', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [delete]: Error deleting file /path/to/file.txt: File [/path/to/file.txt] is currently open and cannot be deleted'
      );
    });
    it('Should rejects the file processing if the file is in use with a "delete" post processing strategy in a linux system - stderr: "no-null"', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 2, message: 'myError' }, null, 'no-null');
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [delete]: Error deleting file /path/to/file.txt: Error checking file status with lsof: myError'
      );
    });
    it('Should rejects the file processing if the file is in use with a "delete" post processing strategy in a windows system - error', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 2, message: 'myError' }, null, 'no-null');
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [delete]: Error deleting file /path/to/file.txt: Error checking file status with PowerShell: myError'
      );
    });
    it('Should rejects the file processing if the file is in use with a "delete" post processing strategy in a windows system - stdout: "True"', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.DELETE,
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'unlinkSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'True', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [delete]: Error deleting file /path/to/file.txt: File [/path/to/file.txt] is currently open and cannot be deleted'
      );
    });
    it('Should rejects the file processing if the file is in use with a "archive" post processing strategy in a linux system - stdout: "no-null"', async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ARCHIVE,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'renameSync').mockReturnValue();
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'no-null', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [archive]: Error archiving file [/path/to/file.txt] to [/path/to/archive]: File [/path/to/file.txt] is currently open and cannot be archived'
      );
    });
    it(`Should rejects the file processing if the file is in use with a "zip" post processing strategy in a linux system - stdout: "no-null"`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ZIP,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'createReadStream').mockReturnValue({} as any);
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      jest.spyOn(stream, 'pipeline').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (a: any, b: any, c: any, cb: (error: any) => void) => {
          cb(null);
        }
      );
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb(null, 'no-null', null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [zip]: File [/path/to/file.txt] is currently open and cannot be zipped'
      );
    });
    it(`Should rejects the file processing if the file can not be open with a "zip" post processing strategy`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ZIP,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
        throw new Error('myError');
      });
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      jest.spyOn(stream, 'pipeline').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (a: any, b: any, c: any, cb: (error: any) => void) => {
          cb(null);
        }
      );
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [zip]: Error creating read/write streams: myError'
      );
    });
    it(`Should rejects the file processing if there is a problem zipping the file with a "zip" post processing strategy`, async () => {
      // Create a new FileTasks instance
      const fileTasks = new FileTasks({
        pushers: [pusher],
        postProcessingStrategy: PostProcessingStrategy.ZIP,
        archiveFolder: '/path/to/archive',
      });
      // Get the process file task sequence
      const sequence = fileTasks.getProcessFileTask('/path/to/file.txt', 'file-key');
      jest.spyOn(os, 'type').mockReturnValue('Linux');
      jest.spyOn(pusher, 'push').mockResolvedValue();
      jest.spyOn(fs, 'createReadStream').mockReturnValue({} as any);
      jest.spyOn(fs, 'createWriteStream').mockReturnValue({} as any);
      jest.spyOn(stream, 'pipeline').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (a: any, b: any, c: any, cb: (error: any) => void) => {
          cb(new Error('myError'));
        }
      );
      jest.spyOn(child_process, 'execFile').mockImplementation(
        // @ts-expect-error - Mocking the execFileSync
        (file: string, args: string[], cb: (error: any, stdout: any, stderr: any) => void) => {
          cb({ code: 1 }, null, null);
        }
      );
      // Run the sequence
      await expect(sequence.execute()).rejects.toThrow(
        'Execution error in task [file-key]: Error executing the [post] phase: Execution error in task [zip]: Error zipping file [/path/to/file.txt]: myError'
      );
    });
  });
});
