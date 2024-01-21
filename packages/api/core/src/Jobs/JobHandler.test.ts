/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Crash, Multi } from '@mdf.js/crash';
import { v5 } from 'uuid';
import { Jobs } from '..';
import { MDF_NAMESPACE_OID } from '../const';
import { JobHandler } from './JobHandler';
import { Status } from './types';

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#JobHandler', () => {
  describe('#Happy path', () => {
    it(`Should create an instance of a job handler properly used the JobRequest`, () => {
      const job = new JobHandler({
        data: 'myData',
        jobUserId: 'myId',
        type: 'myType',
        options: {
          headers: { routing: { topic: 'myTopic' } },
        },
      });
      expect(job.status).toEqual(Status.PENDING);
      expect(job.data).toEqual('myData');
      expect(job.status).toEqual(Status.PROCESSING);
      expect(job.type).toEqual('myType');
      expect(job.jobUserId).toEqual('myId');
      expect(job.jobUserUUID).toEqual(v5('myId', MDF_NAMESPACE_OID));
      expect(job.uuid).toEqual(job.uuid);
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.processTime).toEqual(-1);
      expect(job.result()).toEqual({
        uuid: job.result().uuid,
        jobUserId: 'myId',
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        type: 'myType',
        status: Status.PROCESSING,
      });
    });
    it(`Should create an instance of a job handler properly used the JobRequest with default value`, () => {
      const job = new JobHandler({
        data: ['myData'],
        jobUserId: 'myId',
        options: {
          headers: { routing: { topic: 'myTopic' } },
        },
      });
      expect(job.status).toEqual(Status.PENDING);
      expect(job.data).toEqual(['myData']);
      expect(job.status).toEqual(Status.PROCESSING);
      expect(job.type).toEqual('default');
      expect(job.jobUserId).toEqual('myId');
      expect(job.jobUserUUID).toEqual(v5('myId', MDF_NAMESPACE_OID));
      expect(job.uuid).toEqual(job.uuid);
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.processTime).toEqual(-1);
      expect(job.result()).toEqual({
        uuid: job.result().uuid,
        jobUserId: 'myId',
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        type: 'default',
        status: Status.PROCESSING,
      });
    });
    it(`Should create an instance of a job handler properly`, () => {
      const job = new JobHandler<string>('myId', 'myData', 'myType', {
        headers: { routing: { topic: 'myTopic' } },
      });
      expect(job.status).toEqual(Status.PENDING);
      job.data = 'myOtherData';
      expect(job.data).toEqual('myOtherData');
      expect(job.status).toEqual(Status.PROCESSING);
      expect(job.type).toEqual('myType');
      expect(job.uuid).toEqual(job.uuid);
      expect(job.jobUserId).toEqual('myId');
      expect(job.jobUserUUID).toEqual(v5('myId', MDF_NAMESPACE_OID));
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.processTime).toEqual(-1);
      expect(job.result()).toEqual({
        uuid: job.uuid,
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        jobUserId: 'myId',
        type: 'myType',
        status: Status.PROCESSING,
      });
    });
    it(`Should create an instance of a job handler properly with default value`, () => {
      const job = new JobHandler<string>('myId', 'myData');
      expect(job.status).toEqual(Status.PENDING);
      job.data = 'myOtherData';
      expect(job.data).toEqual('myOtherData');
      expect(job.status).toEqual(Status.PROCESSING);
      expect(job.type).toEqual('default');
      expect(job.uuid).toEqual(job.uuid);
      expect(job.jobUserId).toEqual('myId');
      expect(job.jobUserUUID).toEqual(v5('myId', MDF_NAMESPACE_OID));
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.processTime).toEqual(-1);
      expect(job.result()).toEqual({
        uuid: job.uuid,
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        jobUserId: 'myId',
        type: 'default',
        status: Status.PROCESSING,
      });
    });
    it(`Should be possible to add errors to the job handler`, () => {
      const job = new JobHandler<string>('myId', 'myData', 'myType');
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.result()).toEqual({
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        uuid: job.uuid,
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        jobUserId: 'myId',
        type: 'myType',
        status: Status.PENDING,
      });
      const myError = new Crash('myError');
      job.addError(myError);
      job.addError(myError);
      expect(job.errors).toBeDefined();
      expect(job.hasErrors).toBeTruthy();
      expect(job.result()).toEqual({
        uuid: job.uuid,
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: true,
        errors: {
          info: undefined,
          message: 'Errors in job processing',
          name: 'ValidationError',
          subject: 'common',
          timestamp: job.errors?.date.toISOString(),
          trace: ['CrashError: myError', 'CrashError: myError'],
          uuid: job.errors?.uuid,
        },
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        jobUserId: 'myId',
        type: 'myType',
        status: Status.PROCESSING,
      });
    });
    it(`Should be possible to finnish the job without errors`, done => {
      const job = new JobHandler<string>('myId', 'myData', 'myType');
      job.on('done', (uuid: string, result: Jobs.Result<string>, error?: Multi) => {
        expect(uuid).toEqual(job.uuid);
        expect(result).toEqual({
          uuid: job.uuid,
          jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
          createdAt: job.createdAt.toISOString(),
          resolvedAt: result.resolvedAt,
          quantity: 1,
          hasErrors: false,
          errors: undefined,
          jobUserId: 'myId',
          type: 'myType',
          status: Status.COMPLETED,
        });
        expect(error).toBeUndefined();
        expect(job.processTime).toBeGreaterThan(-1);
        done();
      });
      job.done();
    });
    it(`Should be possible to finnish the job with errors`, done => {
      const job = new JobHandler<string>('myId', 'myData', 'myType');
      const myError = new Crash('myError');
      job.on('done', (uuid: string, result: Jobs.Result<string>, error?: Multi) => {
        expect(uuid).toEqual(job.uuid);
        expect(result).toEqual({
          uuid: result.uuid,
          createdAt: job.createdAt.toISOString(),
          resolvedAt: result.resolvedAt,
          quantity: 1,
          hasErrors: true,
          errors: {
            info: undefined,
            message: 'Errors in job processing',
            name: 'ValidationError',
            subject: 'common',
            timestamp: job.errors?.date.toISOString(),
            trace: ['CrashError: myError'],
            uuid: result.errors?.uuid,
          },
          jobUserId: 'myId',
          jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
          type: 'myType',
          status: Status.FAILED,
        });
        expect(job.result()).toEqual(result);
        expect(error).toBeDefined();
        expect(job.errors).toBeDefined();
        expect(job.hasErrors).toBeTruthy();
        done();
      });
      job.done(myError);
    });
    it(`Should return an object with the key data of the Job`, () => {
      const job = new JobHandler<string>('myId', 'myData', 'myType');
      expect(job.toObject()).toEqual({
        uuid: job.uuid,
        jobUserUUID: v5('myId', MDF_NAMESPACE_OID),
        jobUserId: 'myId',
        data: 'myData',
        type: 'myType',
        options: undefined,
        status: Status.PROCESSING,
      });
    });
  });
  describe('#Sad path', () => {
    it(`Should throw an error if try to create a job without jobId`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler(undefined, 'myData', 'myType');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, the first parameter must be a jobUserId or a JobRequest object'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
    it(`Should throw an error if try to create a job with invalid type`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myId', 'myData', 4);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, type must be a string'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
    it(`Should throw an error if try to create a job without data = undefined`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myId', undefined, 'myType');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, data is mandatory'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
    it(`Should throw an error if try to create a job without data = null`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myId', null, 'myType');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, data is mandatory'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
    it(`Should throw an error if try to create a job with invalid options`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myId', 3, 'myType', 'myBadOptions');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, options should be a object'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
  });
});
// #endregion
