/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
// ************************************************************************************************
// #region Component imports
import { Crash, Multi } from '@mdf/crash';
import { v5 } from 'uuid';
import { Jobs } from '..';
import { MMS_NAMESPACE_OID } from '../const';
import { Status } from '../types/jobs';
import { JobHandler } from './JobHandler';

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#JobHandler', () => {
  describe('#Happy path', () => {
    it(`Should create an instance of a job handler properly`, () => {
      const job = new JobHandler<string>('myData', 'myId', 'myType', {
        headers: { routing: { topic: 'myTopic' } },
      });
      expect(job.status).toEqual(Status.PENDING);
      expect(job.data).toEqual('myData');
      expect(job.status).toEqual(Status.PROCESSING);
      expect(job.type).toEqual('myType');
      expect(job.jobId).toEqual('myId');
      expect(job.uuid).toEqual(v5('myId', MMS_NAMESPACE_OID));
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.processTime).toEqual(-1);
      expect(job.result()).toEqual({
        id: v5('myId', MMS_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        jobId: 'myId',
        type: 'myType',
        status: Status.PROCESSING,
      });
    });
    it(`Should be possible to add errors to the job handler`, () => {
      const job = new JobHandler<string>('myData', 'myId', 'myType');
      expect(job.errors).toBeUndefined();
      expect(job.hasErrors).toBeFalsy();
      expect(job.result()).toEqual({
        id: v5('myId', MMS_NAMESPACE_OID),
        createdAt: job.createdAt.toISOString(),
        resolvedAt: '',
        quantity: 1,
        hasErrors: false,
        errors: undefined,
        jobId: 'myId',
        type: 'myType',
        status: Status.PENDING,
      });
      const myError = new Crash('myError');
      job.addError(myError);
      job.addError(myError);
      expect(job.errors).toBeDefined();
      expect(job.hasErrors).toBeTruthy();
      expect(job.result()).toEqual({
        id: v5('myId', MMS_NAMESPACE_OID),
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
          uuid: v5('myId', MMS_NAMESPACE_OID),
        },
        jobId: 'myId',
        type: 'myType',
        status: Status.PROCESSING,
      });
    });
    it(`Should be possible to finnish the job without errors`, done => {
      const job = new JobHandler<string>('myData', 'myId', 'myType');
      job.on('done', (uuid: string, result: Jobs.Result<string>, error?: Multi) => {
        expect(uuid).toEqual(v5('myId', MMS_NAMESPACE_OID));
        expect(result).toEqual({
          id: v5('myId', MMS_NAMESPACE_OID),
          createdAt: job.createdAt.toISOString(),
          resolvedAt: result.resolvedAt,
          quantity: 1,
          hasErrors: false,
          errors: undefined,
          jobId: 'myId',
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
      const job = new JobHandler<string>('myData', 'myId', 'myType');
      const myError = new Crash('myError');
      job.on('done', (uuid: string, result: Jobs.Result<string>, error?: Multi) => {
        expect(uuid).toEqual(v5('myId', MMS_NAMESPACE_OID));
        expect(result).toEqual({
          id: v5('myId', MMS_NAMESPACE_OID),
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
            uuid: v5('myId', MMS_NAMESPACE_OID),
          },
          jobId: 'myId',
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
      const job = new JobHandler<string>('myData', 'myId', 'myType');
      expect(job.toObject()).toEqual({
        data: 'myData',
        type: 'myType',
        jobId: 'myId',
        headers: {},
        status: Status.PROCESSING,
      });
    });
  });
  describe('#Sad path', () => {
    it(`Should throw an error if try to create a job without jobId`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myData', undefined, 'myType');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error creating a valid JobHandler, JobId is mandatory and must be a string'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        done();
      }
    });
    it(`Should throw an error if try to create a job with invalid type`, done => {
      try {
        //@ts-ignore - Test environment
        new JobHandler('myData', 'myId', 4);
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
        new JobHandler(undefined, 'myId', 'myType');
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
        new JobHandler(null, 'myId', 'myType');
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
        new JobHandler(3, 'myId', 'myType', 'myBadOptions');
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
