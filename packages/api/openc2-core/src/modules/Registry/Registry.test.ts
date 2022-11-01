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

import { JobHandler } from '@mdf/core';
import { Registry } from '.';
import { Accessors } from '../../helpers';
import { Control } from '../../types';

const COMMAND: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      'x-netin:alarms': { entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' },
    },
    command_id: 'myCommandId',
    args: {
      duration: 50,
    },
  },
};

describe('#Registry', () => {
  describe('#Happy path', () => {
    it('Should create a new instance', () => {
      const registry = new Registry('test');
      expect(registry).toBeInstanceOf(Registry);
      // @ts-ignore - Test environment
      expect(registry.timeInterval).toBe((5 * 60 * 1000) / 2);
      const checks = registry.checks;
      expect(checks).toEqual({
        'test:commands': [
          {
            componentId: checks['test:commands'][0].componentId,
            componentType: 'source',
            observedUnit: 'pending commands',
            observedValue: 0,
            output: undefined,
            status: 'pass',
            time: checks['test:commands'][0].time,
          },
        ],
      });
    }, 300);
    it('Should add message up to the maximum allowed number', () => {
      const registry = new Registry('test', 10, 100);
      expect(registry.messages.length).toEqual(0);
      registry.push(COMMAND);
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      expect(registry.messages.length).toEqual(1);
      for (let i = 0; i < 101; i++) {
        registry.push(COMMAND);
      }
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      expect(registry.messages.length).toEqual(100);
      expect(registry.messages[0].request_id).toEqual(COMMAND.request_id);
      expect(registry.messages[99].request_id).toEqual(COMMAND.request_id);
      registry.clear();
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      expect(registry.messages.length).toEqual(0);
    }, 300);
    it('Should manage jobs properly', () => {
      const registry = new Registry('test', 10, 100);
      const job = new JobHandler(COMMAND, COMMAND.request_id, 'command', {
        headers: { duration: Accessors.getDelayFromCommandMessage(COMMAND) },
      });
      expect(registry.pendingJobs.size).toEqual(0);
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      registry.push(job);
      //@ts-ignore - Test environment
      expect(registry.interval).toBeDefined();
      expect(registry.pendingJobs.size).toEqual(1);
      job.done();
      const completedJob = registry.delete(job.uuid);
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      expect(registry.delete(job.uuid)).toBeUndefined();
      expect(completedJob).toBeInstanceOf(JobHandler);
      expect(registry.pendingJobs.size).toEqual(0);
      expect(registry.executedJobs.length).toEqual(1);
      for (let i = 0; i < 101; i++) {
        registry.push(job);
        registry.delete(job.uuid);
      }
      expect(registry.executedJobs.length).toEqual(100);
      expect(registry.executedJobs[0].id).toEqual(job.uuid);
      expect(registry.executedJobs[99].id).toEqual(job.uuid);
      registry.clear();
      //@ts-ignore - Test environment
      expect(registry.interval).toBeUndefined();
      expect(registry.executedJobs.length).toEqual(0);
    }, 300);
    it('Should cancel old jobs when aging time pass', done => {
      const registry = new Registry('test', 10, 100);
      //@ts-ignore - Test environment
      registry.timeInterval = 10;
      const job = new JobHandler(COMMAND, COMMAND.request_id, 'command', {
        headers: { duration: Accessors.getDelayFromCommandMessage(COMMAND) },
      });
      job.on('done', (job, result) => {
        expect(result).toEqual({
          createdAt: result.createdAt,
          errors: {
            info: undefined,
            message: 'Errors in job processing',
            name: 'ValidationError',
            subject: 'common',
            timestamp: result.errors?.timestamp,
            trace: ['CrashError: Job cancelled after 10 minutes of inactivity'],
            uuid: result.errors?.uuid,
          },
          hasErrors: true,
          id: result.id,
          jobId: result.jobId,
          quantity: 1,
          resolvedAt: result.resolvedAt,
          status: 'failed',
          type: 'command',
        });
        registry.delete(job);
        registry.clear();
        done();
      });
      const nowTime = new Date(Date.now() - 61 * 1000 * 10);
      // @ts-ignore - Test environment
      job.createdAt = nowTime;
      registry.push(job);
    }, 300);
    it('Should emit a status update if a job is close to be aged', done => {
      const registry = new Registry('test', 10, 100);
      const nowTime = new Date(Date.now() - (61 * 1000 * 10) / 2);
      registry.on('status', status => {
        expect(status).toEqual('warn');
        const checks = registry.checks;
        expect(checks).toEqual({
          'test:commands': [
            {
              componentId: checks['test:commands'][0].componentId,
              componentType: 'source',
              observedUnit: 'pending commands',
              observedValue: 1,
              output: [`${nowTime.toISOString()} - query:x-netin:alarms - processing`],
              status: 'warn',
              time: checks['test:commands'][0].time,
            },
          ],
        });
        done();
        registry.clear();
      });
      //@ts-ignore - Test environment
      registry.timeInterval = 10;
      const job = new JobHandler(COMMAND, COMMAND.request_id, 'command', {
        headers: { duration: Accessors.getDelayFromCommandMessage(COMMAND) },
      });
      // @ts-ignore - Test environment
      job.createdAt = nowTime;
      registry.push(job);
    }, 300);
  });
  describe('#Sad path', () => {});
});
