/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
process.env['CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL'] = '1000';

import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Observability, ObservabilityOptions } from '@mdf.js/observability';
import { v4 } from 'uuid';
import { Firehose, Plugs } from '.';
import {
  MyCreditsFlowPlug,
  MyFlowPlug,
  MyJetPlug,
  MyQuickFlowPlug,
  MyQuickSequencePlug,
  MySequencePlug,
  MyStrategy,
  MyTapPlug,
  MyWindowPlug,
} from './test';

const config: ObservabilityOptions = {
  name: 'myObservability',
  version: '1',
  description: 'myObservability service',
  processId: v4(),
  release: '1.0.0',
  isCluster: false,
};

type OnlyForCoverage = Plugs.Sink.Jet;

describe('#Firehose', () => {
  describe('#Happy path', () => {
    it('Should create a new Firehose with a Sequence Source and a Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MySequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      let jobEmitted = false;
      firehose.on('job', job => {
        expect(job).toBeDefined();
        expect(job.data).toBeDefined();
        expect(job.type).toBeDefined();
        expect(job.type).toEqual('myType');
        expect(job.jobUserId).toBeDefined();
        expect(job.options).toBeDefined();
        expect(job.options?.headers).toBeDefined();
        expect(job.options?.headers).toEqual({ 'x-my-header': 'my-header-value' });
        jobEmitted = true;
      });
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '4') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 4`);
          expect(metrics.metrics).toContain(`api_all_job_in_processing_total{type="myType"} 6`);
          expect(service.errorsRegistry.size).toEqual(0);
          const checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MyTapPlug:lastOperation'][0].status).toEqual('pass');
          expect(checks['MyTapPlug:lastOperation'][0].componentType).toEqual('plug');
          expect(checks['MyTapPlug:lastOperation'][0].observedValue).toEqual('ok');
          expect(checks['MyTapPlug:lastOperation'][0].observedUnit).toEqual(
            'result of last operation'
          );
          expect(checks['MyTapPlug:lastOperation'][0].time).toBeDefined();

          expect(checks['MySequencePlug:lastOperation'][0].status).toEqual('pass');
          expect(checks['MySequencePlug:lastOperation'][0].componentType).toEqual('plug');
          expect(checks['MySequencePlug:lastOperation'][0].observedValue).toEqual('ok');
          expect(checks['MySequencePlug:lastOperation'][0].observedUnit).toEqual(
            'result of last operation'
          );
          expect(checks['MySequencePlug:lastOperation'][0].time).toBeDefined();
          firehose.close();
          service.stop().then(() => {
            if (jobEmitted) {
              done();
            } else {
              done(new Error('Job not emitted'));
            }
          });
        }
      });
      firehose.start().then();
    }, 300);
    it('Should create a new Firehose with a CreditFlow Source and a Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MyCreditsFlowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      let jobEmitted = false;
      firehose.on('job', job => {
        expect(job).toBeDefined();
        expect(job.data).toBeDefined();
        expect(job.type).toBeDefined();
        expect(job.type).toEqual('myType');
        expect(job.jobUserId).toBeDefined();
        expect(job.options).toBeDefined();
        expect(job.options?.headers).toBeDefined();
        expect(job.options?.headers).toEqual({ 'x-my-header': 'my-header-value' });
        jobEmitted = true;
      });
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '4') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 4`);
          expect(metrics.metrics).toContain(`api_all_job_in_processing_total{type="myType"} 0`);
          expect(service.errorsRegistry.size).toEqual(0);
          const checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MyTapPlug:lastOperation'][0].status).toEqual('pass');
          expect(checks['MyTapPlug:lastOperation'][0].componentType).toEqual('plug');
          expect(checks['MyTapPlug:lastOperation'][0].observedValue).toEqual('ok');
          expect(checks['MyTapPlug:lastOperation'][0].observedUnit).toEqual(
            'result of last operation'
          );
          expect(checks['MyTapPlug:lastOperation'][0].time).toBeDefined();

          expect(checks['MyCreditsFlowPlug:lastOperation'][0].status).toEqual('pass');
          expect(checks['MyCreditsFlowPlug:lastOperation'][0].componentType).toEqual('plug');
          expect(checks['MyCreditsFlowPlug:lastOperation'][0].observedValue).toEqual('ok');
          expect(checks['MyCreditsFlowPlug:lastOperation'][0].observedUnit).toEqual(
            'result of last operation'
          );
          expect(checks['MyCreditsFlowPlug:lastOperation'][0].time).toBeDefined();
          firehose.close();
          service.stop().then(() => {
            if (jobEmitted) {
              done();
            } else {
              done(new Error('Job not emitted'));
            }
          });
        }
      });
      firehose.start().then();
    }, 300);
    it('Should repiping the streams if there is a unexpected unpipe, and it should still work', done => {
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MySequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
      });
      let unpipe = false;
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (unpipe) {
          await firehose.stop();
          //@ts-ignore - Test environment
          expect(firehose.stopping).toEqual(true);
          //@ts-ignore - Test environment
          expect(firehose.engine.destroyed).toEqual(false);
          //@ts-ignore - Test environment
          expect(firehose.engine.readableFlowing).toEqual(false);
          //@ts-ignore - Test environment
          expect(firehose.sinks.length).toEqual(0);
          //@ts-ignore - Test environment
          expect(firehose.sources.length).toEqual(0);
          await firehose.close();
          //@ts-ignore - Test environment
          expect(firehose.engine.destroyed).toEqual(true);
          done();
        }
        if (result.jobUserId === '4') {
          //@ts-ignore - Test environment
          firehose.engine.unpipe(firehose.sinks[0]);
          unpipe = true;
        }
      });
      firehose.start().then();
    }, 300);
    it('Should create a new Firehose with a Window Source and a Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MyWindowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(metrics.metrics).toContain(`api_all_job_in_processing_total{type="myType"} 6`);
          expect(metrics.metrics).toContain(
            `api_publishing_job_duration_milliseconds_bucket{le="10000",type="myType"} 10`
          );
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
        if (result.jobUserId === '11') {
          firehose.close();
          service.stop().then(() => done(new Error('Job should not be emitted')));
        }
      });
      firehose.start().then();
    }, 300);
    it('Should create a new Firehose with a Flow Source and a Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MyFlowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('job', job => {
        expect(job).toBeDefined();
        expect(job.data).toBeDefined();
        expect(job.type).toBeDefined();
        expect(job.type).toEqual('myType');
        expect(job.jobUserId).toBeDefined();
        expect(job.options).toBeDefined();
        expect(job.options?.headers).toBeDefined();
        expect(job.options?.headers).toEqual({ 'x-my-header': 'my-header-value' });
      });
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Sequence Source and a Jet Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const mySourcePlug = new MySequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 5,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Window Source and a Jet Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const mySourcePlug = new MyWindowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
        if (result.jobUserId === '11') {
          firehose.close();
          service.stop().then(() => done(new Error('Job should not be emitted')));
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Flow Source and a Jet Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const mySourcePlug = new MyFlowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Flow Source and 4 Jet/Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const myOtherSinkPlug = new MyTapPlug();
      const mySourcePlug = new MyFlowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug, mySinkPlug, myOtherSinkPlug, myOtherSinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '4') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 4`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Sequence Source and 4 Jet/Tap Sink, start it and check is working', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const myOtherSinkPlug = new MyTapPlug();
      const mySourcePlug = new MySequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug, mySinkPlug, myOtherSinkPlug, myOtherSinkPlug],
        bufferSize: 2,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          const metrics = await service.metricsRegistry.metrics();
          expect(metrics).toBeDefined();
          expect(metrics.metrics).toBeDefined();
          expect(metrics.metrics).toContain(`api_all_job_processed_total{type="myType"} 10`);
          expect(service.errorsRegistry.size).toEqual(0);
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should create a new Firehose with a Flow Source and a Jet Sink, start it and check is working with some strategies applied to jobs', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      jest.spyOn(mySinkPlug, 'single').mockImplementation(async (job: Jobs.JobObject<any>) => {
        return new Promise<void>((resolve, reject) => {
          expect(job).toBeDefined();
          expect(job.jobUserId).toBeDefined();
          expect(job.data).toBeDefined();
          expect(job.data).toEqual(parseInt(job.jobUserId) + 3);
          process.nextTick(() => {
            resolve();
          });
        });
      });
      const mySourcePlug = new MyFlowPlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
        strategies: {
          myType: [new MyStrategy('myType', 1), new MyStrategy('myType', 2)],
          otherType: [new MyStrategy('myType', 4), new MyStrategy('myType', 8)],
        },
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should add errors to the job if a strategy returns invalid data', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      jest.spyOn(mySinkPlug, 'single').mockImplementation(async (job: Jobs.JobObject<any>) => {
        return new Promise<void>((resolve, reject) => {
          expect(job).toBeDefined();
          expect(job.jobUserId).toBeDefined();
          expect(job.data).toBeDefined();
          expect(job.data).toEqual(parseInt(job.jobUserId) + 1);
          process.nextTick(() => {
            resolve();
          });
        });
      });
      const mySourcePlug = new MyFlowPlug(10);
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
        strategies: {
          myType: [new MyStrategy('myType', 1), new MyStrategy('myType', 'a')],
        },
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '4') {
          expect(service.errorsRegistry.size).toEqual(4);
          expect(service.errorsRegistry.errors[0].trace[0]).toContain(
            'CrashError: Job finished with errors'
          );
          expect(service.errorsRegistry.errors[0].trace[1]).toContain(
            'caused by ValidationError: Errors in job processing'
          );
          expect(service.errorsRegistry.errors[0].trace[2]).toContain(
            'failed with CrashError: Strategy myType return an undefined job or a job with no data, it has not be applied'
          );
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
    it('Should add errors to the job if a strategy throws', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      jest.spyOn(mySinkPlug, 'single').mockImplementation(async (job: Jobs.JobObject<any>) => {
        return new Promise<void>((resolve, reject) => {
          expect(job).toBeDefined();
          expect(job.jobUserId).toBeDefined();
          expect(job.data).toBeDefined();
          expect(job.data).toEqual(parseInt(job.jobUserId) + 1);
          process.nextTick(() => {
            resolve();
          });
        });
      });
      const mySourcePlug = new MyFlowPlug(10);
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 4,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
        strategies: {
          ///@ts-ignore - Test environment
          myType: [new MyStrategy('myType', 1), new MyStrategy('myType', [])],
        },
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '4') {
          expect(service.errorsRegistry.size).toEqual(4);
          expect(service.errorsRegistry.errors[0].subject).toEqual('firehose');
          expect(service.errorsRegistry.errors[0].trace[0]).toContain(
            'CrashError: Job finished with errors'
          );
          expect(service.errorsRegistry.errors[0].trace[1]).toContain(
            'caused by ValidationError: Errors in job processing'
          );
          expect(service.errorsRegistry.errors[0].trace[2]).toContain(
            'failed with CrashError: Strategy myType throw an error during process: Invalid count, it has not be applied'
          );
          firehose.close();
          service.stop().then(done);
        }
      });
      firehose.start();
    }, 300);
  });
  describe('#Sad Path', () => {
    it(`Should throw an error if there is not sinks`, () => {
      expect(() => {
        new Firehose('MyFirehose', {
          sources: [new MyFlowPlug()],
          sinks: [],
        });
      }).toThrowError('Firehose must have at least one sink');
    }, 300);
    it(`Should throw an error if there is not source`, () => {
      expect(() => {
        new Firehose('MyFirehose', {
          sources: [],
          sinks: [new MyTapPlug()],
        });
      }).toThrowError('Firehose must have at least one source');
    }, 300);
    it(`Should throw an error if there is a not valid source`, () => {
      const fh = new Firehose('MyFirehose', {
        //@ts-ignore - Test environment
        sources: [new MyFlowPlug(), {}],
        sinks: [new MyTapPlug()],
      });
      fh.start()
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error.message).toEqual('Source type not supported');
        });
    }, 300);
    it(`Should throw an error if there is a not valid sink`, () => {
      const fh = new Firehose('MyFirehose', {
        sources: [new MyFlowPlug()],
        //@ts-ignore - Test environment
        sinks: [new MyTapPlug(), {}],
      });
      fh.start()
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error.message).toEqual('Sink type not supported');
        });
    }, 300);
    it(`Should emit an error if any of the streams/plugs emit an error`, done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      const mySourcePlug = new MyFlowPlug();
      const myFirehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
      });
      service.healthRegistry.register(myFirehose);
      let errorCount = 0;
      myFirehose.on('error', (error: Error) => {
        expect(error.message).toContain('Error from stream');
        errorCount++;
        if (errorCount === 5) {
          expect(service.errorsRegistry.errors.length).toEqual(5);
          expect(service.errorsRegistry.errors[0].subject).toEqual('MyFirehose');
          expect(service.errorsRegistry.errors[0].trace[0]).toContain('Error: Error from stream');
          myFirehose.close();
          done();
        }
      });
      myFirehose.start();
      //@ts-ignore - Test environment
      myFirehose.engine.emit('error', new Error('Error from stream: engine'));
      //@ts-ignore - Test environment
      for (const source of myFirehose.sources) {
        source.emit('error', new Error('Error from stream: source'));
      }
      //@ts-ignore - Test environment
      for (const sink of myFirehose.sinks) {
        sink.emit('error', new Error('Error from stream: sink'));
      }
      mySinkPlug.emit('error', new Error('Error from stream: sink plug'));
      mySourcePlug.emit('error', new Error('Error from stream: source plug'));
    }, 300);
    it('Should increase the number of unknown jobs if the postConsume function resolve as undefined, but not more than 100', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const mySourcePlug = new MyQuickSequencePlug();
      mySourcePlug.founded = false;
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.start();
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '101') {
          const checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].output?.length).toEqual(100);
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].status).toEqual('fail');
        }
        if (result.jobUserId === '200') {
          const checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MySequencePlug:stream'][0].observedUnit).toEqual('jobs');
          expect(checks['MySequencePlug:stream'][0].componentType).toEqual('stream');
          expect(checks['MySequencePlug:stream'][0].status).toEqual('pass');
          expect(checks['MySequencePlug:stream'][0].observedValue).toEqual('0/200');

          expect(checks['MySequencePlug:window'][0].observedUnit).toEqual('pending windows jobs');
          expect(checks['MySequencePlug:window'][0].componentType).toEqual('stream');
          expect(checks['MySequencePlug:window'][0].status).toEqual('pass');
          expect(checks['MySequencePlug:window'][0].observedValue).toEqual('0/200');
          expect(checks['MySequencePlug:window'][0].output).toBeUndefined();

          expect(checks['MyJetPlug:stream'][0].observedUnit).toEqual('jobs');
          expect(checks['MyJetPlug:stream'][0].componentType).toEqual('stream');
          expect(checks['MyJetPlug:stream'][0].status).toEqual('pass');
          expect(checks['MyJetPlug:stream'][0].observedValue).toEqual('0/200');

          expect(checks['engine:stream'][0].observedUnit).toEqual('writable jobs');
          expect(checks['engine:stream'][0].componentType).toEqual('stream');
          expect(checks['engine:stream'][0].status).toEqual('pass');
          expect(checks['engine:stream'][0].observedValue).toEqual('0/200');

          expect(checks['engine:stream'][1].observedUnit).toEqual('readable jobs');
          expect(checks['engine:stream'][1].componentType).toEqual('stream');
          expect(checks['engine:stream'][1].status).toEqual('pass');
          expect(checks['engine:stream'][1].observedValue).toEqual('0/200');
          firehose.close();
          service.stop().then(done);
        }
      });
    }, 300);
    it('Should indicate a fail state in the window check if the window is not updated for any reason', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      jest.spyOn(mySinkPlug, 'single').mockImplementation(() => {
        return new Promise(() => {});
      });
      const mySourcePlug = new MyWindowPlug();
      mySourcePlug.founded = false;
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 2,
      });
      service.healthRegistry.register(firehose);
      firehose.on('job', job => {
        if (job.jobUserId === '8') {
          const checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MyWindowPlug:window'][0].observedUnit).toEqual('pending windows jobs');
          expect(checks['MyWindowPlug:window'][0].componentType).toEqual('stream');
          expect(checks['MyWindowPlug:window'][0].status).toEqual('warn');
          expect(checks['MyWindowPlug:window'][0].observedValue).toEqual('2/2');
          expect(checks['MyWindowPlug:window'][0].output).toEqual(
            'All the requested jobs has been ingested, but no new request has been received'
          );
          firehose.close();
          done();
        }
      });
      firehose.start();
    }, 300);
    it('Should increase the number of uncleaned jobs if the postConsume function rejects in the source side', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      const mySourcePlug = new MyQuickSequencePlug();
      mySourcePlug.shouldReject = 10;
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
        postConsumeOptions: {
          checkUncleanedInterval: 20,
        },
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      let statusCounter = 0;
      firehose.on('status', status => {
        expect(status).toBeDefined();
        statusCounter++;
      });
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        if (result.jobUserId === '10') {
          let checks = service.healthRegistry.health.checks as Health.API.Checks;
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].output).toBeUndefined();
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].status).toEqual('pass');
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].componentType).toEqual(
            'source'
          );
          expect(checks['MySequencePlug:unknownJobsInPostConsume'][0].observedUnit).toEqual(
            'unknown jobs'
          );
          expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].output?.length).toEqual(10);
          expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].status).toEqual('fail');
          expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].componentType).toEqual(
            'source'
          );
          expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].observedUnit).toEqual(
            'uncleaned jobs'
          );
          expect(checks['MySequencePlug:lastOperation'][0].status).toEqual('fail');
          expect(checks['MySequencePlug:lastOperation'][0].observedValue).toEqual('error');
          expect((checks['MySequencePlug:lastOperation'][0].output as string[])[0]).toEqual(
            'CrashError: Error performing [postConsume] operation on MySequencePlug plug'
          );
          expect((checks['MySequencePlug:lastOperation'][0].output as string[])[1]).toEqual(
            'caused by InterruptionError: Too much attempts [1], the promise will not be retried'
          );
          expect((checks['MySequencePlug:lastOperation'][0].output as string[])[2]).toEqual(
            'caused by CrashError: my reason to reject'
          );
          setTimeout(() => {
            checks = service.healthRegistry.health.checks as Health.API.Checks;
            expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].output).toBeUndefined();
            expect(checks['MySequencePlug:uncleanedJobsInPostConsume'][0].status).toEqual('pass');
            expect(statusCounter).toEqual(5);
            firehose.close();
            service.stop().then(done);
          }, 40);
        }
      });
      firehose.start();
    }, 300);
    it('Should indicate that the lastOperation was finished with error if single/multi rejects and not call done at all with default config', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      mySinkPlug.shouldReject = 10;
      const mySourcePlug = new MyQuickSequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.start();
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        throw new Error('Expected to not receive any done event');
      });
      setTimeout(() => {
        const checks = service.healthRegistry.health.checks as Health.API.Checks;
        expect((checks['MyJetPlug:lastOperation'][0].output as string[])[0]).toEqual(
          'Error: Was rejected by my own'
        );
        expect((checks['MyJetPlug:lastOperation'][0].output as string[])[1]).toEqual(
          'caused by Error: Was rejected by my own'
        );
        expect(checks['MyJetPlug:lastOperation'][0].status).toEqual('fail');
        expect(checks['MyJetPlug:lastOperation'][0].observedValue).toEqual('error');
        firehose.close();
        service.stop().then(done);
      }, 200);
    }, 300);
    it('Should indicate that the lastOperation was finished with error if single rejects and call if the error is IrresolvableError with Sequence Source', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      mySinkPlug.shouldReject = 100000;
      mySinkPlug.irresolvable = true;
      const mySourcePlug = new MyQuickSequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.start();
      firehose.once('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        expect(error).toBeDefined();
        expect(error?.message).toEqual('Errors in job processing');
      });
      setTimeout(async () => {
        const checks = service.healthRegistry.health.checks as Health.API.Checks;
        expect((checks['MyTapPlug:lastOperation'][0].output as string[])[0]).toEqual(
          'IrresolvableError: Was rejected by my own'
        );
        expect(checks['MyTapPlug:lastOperation'][0].status).toEqual('fail');
        const metrics = await service.metricsRegistry.metrics();
        expect(metrics).toBeDefined();
        expect(metrics.metrics).toBeDefined();
        expect(metrics.metrics).toContain(`api_all_errors_job_processing_total{type="myType"} 200`);
        firehose.close();
        service.stop().then(done);
      }, 200);
    }, 300);
    it('Should indicate that the lastOperation was finished with error if single rejects and call if the error is IrresolvableError with a Flow Source', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyTapPlug();
      mySinkPlug.shouldReject = 100000;
      mySinkPlug.irresolvable = true;
      const mySourcePlug = new MyQuickFlowPlug(200);
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.start();
      firehose.once('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        expect(error).toBeDefined();
        expect(error?.message).toEqual('Errors in job processing');
      });
      setTimeout(async () => {
        const checks = service.healthRegistry.health.checks as Health.API.Checks;
        expect((checks['MyTapPlug:lastOperation'][0].output as string[])[0]).toEqual(
          'IrresolvableError: Was rejected by my own'
        );
        expect(checks['MyTapPlug:lastOperation'][0].status).toEqual('fail');
        expect(checks['MyTapPlug:stream'][0].observedValue).toEqual('0/200');
        const metrics = await service.metricsRegistry.metrics();
        expect(metrics).toBeDefined();
        expect(metrics.metrics).toBeDefined();
        expect(metrics.metrics).toContain(`api_all_errors_job_processing_total{type="myType"} 200`);
        expect(metrics.metrics).toContain(`api_publishing_throughput_sum{type="myType"} 492`);
        firehose.close();
        service.stop().then(done);
      }, 200);
    }, 300);
    it('Should indicate that the lastOperation was finished with error if single/multi rejects and call if the error is IrresolvableError', done => {
      const service = new Observability(config);
      const mySinkPlug = new MyJetPlug();
      let called = 0;
      mySinkPlug.shouldReject = 100000;
      mySinkPlug.irresolvable = true;
      const mySourcePlug = new MyQuickSequencePlug();
      const firehose = new Firehose('MyFirehose', {
        sources: [mySourcePlug],
        sinks: [mySinkPlug],
        bufferSize: 200,
        metricsRegistry: service.metricsRegistry,
        errorsRegistry: service.errorsRegistry,
      });
      expect(firehose).toBeDefined();
      expect(firehose.name).toEqual('MyFirehose');
      expect(firehose.componentId).toBeDefined();
      service.healthRegistry.register(firehose);
      firehose.start();
      firehose.on('done', async (uuid: string, result: Jobs.Result, error?: Crash) => {
        expect(error).toBeDefined();
        expect(error?.message).toEqual('Errors in job processing');
        called++;
      });
      setTimeout(() => {
        const checks = service.healthRegistry.health.checks as Health.API.Checks;
        expect((checks['MyJetPlug:lastOperation'][0].output as string[])[0]).toEqual(
          'IrresolvableError: Was rejected by my own'
        );
        expect(checks['MyJetPlug:lastOperation'][0].status).toEqual('fail');
        expect(checks['MyJetPlug:lastOperation'][0].observedValue).toEqual('error');
        if (called !== 200) {
          throw new Error('Expected to receive done event');
        }
        firehose.close();
        service.stop().then(done);
      }, 200);
    }, 300);
  });
});
