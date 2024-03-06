// /**
//  * Copyright 2022 Mytra Control S.L. All rights reserved.
//  *
//  * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
//  * or at https://opensource.org/licenses/MIT.
//  */

// /**
//  * In this file we translate a code from javascript to typescript.
// ```js
// "use strict";
// var Batcher, Events, parser;
// parser = require("./parser");
// Events = require("./Events");

// Batcher = function () {
//   class Batcher {
//     constructor(options = {}) {
//       this.options = options;
//       parser.load(this.options, this.defaults, this);
//       this.Events = new Events(this);
//       this._arr = [];

//       this._resetPromise();

//       this._lastFlush = Date.now();
//     }

//     _resetPromise() {
//       return this._promise = new this.Promise((res, rej) => {
//         return this._resolve = res;
//       });
//     }

//     _flush() {
//       clearTimeout(this._timeout);
//       this._lastFlush = Date.now();

//       this._resolve();

//       this.Events.trigger("batch", this._arr);
//       this._arr = [];
//       return this._resetPromise();
//     }

//     add(data) {
//       var ret;

//       this._arr.push(data);

//       ret = this._promise;

//       if (this._arr.length === this.maxSize) {
//         this._flush();
//       } else if (this.maxTime != null && this._arr.length === 1) {
//         this._timeout = setTimeout(() => {
//           return this._flush();
//         }, this.maxTime);
//       }

//       return ret;
//     }

//   }

//   ;
//   Batcher.prototype.defaults = {
//     maxTime: null,
//     maxSize: null,
//     Promise: Promise
//   };
//   return Batcher;
// }.call(void 0);

// module.exports = Batcher;
// ```
// */

// // import { load, overwrite } from './parser';
// // load({ a: 2 }, { b: 2 }, { c: 2 });
// // overwrite({ a: 2 }, { b: 2 }, { c: 2 });

// // const oeoe = new BTN.Batcher();

// // // const events = new Bottleneck.Events({});

// // TODO: Test bottleneck
// function delay(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 1000, trackDoneStatus: true });

// // async function myFunction(message: string, success: boolean) {
// //   return new Promise((resolve, reject) => {
// //     setTimeout(() => {
// //       if (success) {
// //         resolve(message);
// //       } else {
// //         reject('Boom!');
// //       }
// //     }, 500);
// //   });
// // }

// // limiter
// //   .schedule({ id: 'ABC123' }, () => myFunction('hello', true))
// //   .then(result => {
// //     console.log(result);
// //   })
// //   .catch(error => {
// //     console.log(error);
// //   });

// // limiter.on('received', function (info) {
// //   console.log(`Job received, id: ${info.options.id}`);
// // });
// // limiter.on('queued', function (info) {
// //   console.log(`Job queued, id: ${info.options.id}`);
// // });
// // limiter.on('scheduled', function (info) {
// //   console.log(`Job scheduled, id: ${info.options.id}`);
// // });
// // limiter.on('executing', function (info) {
// //   console.log(`Job executing, id: ${info.options.id}`);
// // });
// // limiter.on('done', function (info) {
// //   console.log(`Job done, id: ${info.options.id}`);
// // });

// // (async () => {
// //   await delay(1000);
// //   console.log(limiter.jobStatus('ABC123'));
// // })();

// // TODO: Test jobStatus
// // const _status = ['received', 'queued', 'done'];
// // const _jobs: Record<string, number> = { job1: 0, job2: 5 };
// // const _counts: number[] = [0, 5, 0];
// // function statusCounts(): Record<string, number> {
// //   return _counts.reduce((acc: Record<string, number>, v: number, i: number) => {
// //     acc[_status[i]] = v;
// //     return acc;
// //   }, {});
// // }
// // console.log(statusCounts());

// // TODO: Test Events
// // import Bottleneck from 'bottleneck';
// // class Hello {
// //   public emitter: Bottleneck.Events;
// //   public on: any;
// //   constructor() {
// //     this.emitter = new Bottleneck.Events(this);
// //   }

// //   doSomething() {
// //     this.emitter.trigger('test', 'hello', 'world', 123);
// //     // .then(val => console.log('val', val))
// //     // .catch(error => console.log('err', error));
// //     console.log('doSomething executed');
// //   }
// // }

// // async function testPromise(): Promise<number> {
// //   console.log('calling test promise');
// //   await delay(10000);
// //   console.log('after 10s...');
// //   return Promise.resolve(3);
// // }

// // const cb = async function callback(...args: any) {
// //   console.log('callback args', args);
// //   // return 2;
// //   return testPromise();
// // };

// // const myObject = new Hello();
// // myObject.on('test', cb);
// // myObject.doSomething();
// // console.log('end');

// // // TODO: Test load used with "this"
// // import { load } from './parser';
// // class TestClass {
// //   private attrStr: any;

// //   constructor(attrStr: any, attrObj: any) {
// //     // this.attrStr = attrStr;

// //     load(attrObj, attrObj, this);
// //   }

// //   public debug() {
// //     console.log(`this: ${JSON.stringify(this)}`);
// //     console.log(`attrStr: ${this.attrStr}`);
// //     // console.log(`b: ${this['b']}`);
// //   }
// // }

// // const testObj = new TestClass('hello', { attrStr: 2, b: 3 });
// // testObj.debug();
// // console.log(`a: ${testObj['b']}`);

// // // TODO: Test Batcher add flush resolve
// // import Bottleneck from 'bottleneck';
// // const batcher = new Bottleneck.Batcher({ maxTime: 1000 });
// // // import { Batcher } from './batcher/Batcher';
// // // const batcher = new Batcher({ maxTime: 1000 });

// // const batches: any[] = [];

// // batcher.on('batch', (arr: any[]) => {
// //   batches.push(arr);
// // });

// // batcher.add(10).then(() => {
// //   console.log(`promise 1 resolved`);
// // });

// // console.log('Waiting 5s...', Date.now());
// // delay(5000)
// //   .then(() => {
// //     console.log('After 10s...', Date.now());
// //     batcher.add(20).then(() => {
// //       console.log(`promise 2 resolved`);
// //     });

// //     batcher.add(30).then(() => {
// //       console.log(`promise 3 resolved`);
// //     });
// //     return Promise.resolve();
// //   })
// //   .then(() => {
// //     console.log('Waiting 10s...', Date.now());
// //     return delay(10000);
// //   })
// //   .then(() => {
// //     console.log('After 10s...', Date.now());
// //     console.log(batches);
// //   });

// import BTN from 'bottleneck';
// import { Bottleneck } from './bottleneck/Bottleneck';
// const iniTime = Date.now();

// const config = {
//   minTime: 3000,
//   maxConcurrent: 1,
//   datastore: 'local',
// };
// const jobConfig = { id: 'job1' };
// const job = (jobId: string) => {
//   console.log(`${jobId} executing...`, Math.floor(Math.floor((Date.now() - iniTime) / 1000)));
//   // return new Promise(resolve => setTimeout(() => resolve, 5000));
//   return Promise.resolve(`${jobId} resolved`);
// };
// const resolve = (jobId: string) => {
//   console.log(`${jobId} executed...`, Math.floor(Math.floor((Date.now() - iniTime) / 1000)));
//   return Promise.resolve(`${jobId} executed`);
// };
// const error = (error: any) => {
//   console.log('error1 ', error);
// };
// const stopConfig = {
//   dropWaitingJobs: true,
//   enqueueErrorMessage: 'Test stop enqueue error message',
//   dropErrorMessage: 'Test stop drop error message',
// };
// const resolveStop = () => {
//   return Promise.resolve(Math.floor((Date.now() - iniTime) / 1000));
// };
// const bottleneck = new BTN(config);
// const bottleneck2 = new Bottleneck(config);

// // const spySchedule = jest.spyOn(bottleneck, 'schedule');
// // jest.spyOn(bottleneck['_states'], 'counts', 'get').mockReturnValue([0, 0, 0, 0]);

// // Schedule a job
// // const promise1 = bottleneck.schedule(jobConfig, job).then(resolve).catch(error);
// const promise2 = bottleneck
//   .schedule(jobConfig, () => job('job1'))
//   .then(() => resolve('job1'))
//   .catch(error);
// // const promise3 = bottleneck
// //   .schedule({ id: 'job2' }, () => job('job2'))
// //   .then(() => resolve('job2'))
// //   .catch(error);

// // Schedule another job to stay enqueued until job1 is executed
// // const promise2 = bottleneck
// //   .schedule({ id: 'job2' }, () => {
// //     return new Promise(resolve => setTimeout(resolve, 1000));
// //   })
// //   .then(() => {
// //     throw new Error('Should not be here');
// //   })
// //   .catch(error => {
// //     // expect(error).toBeInstanceOf(Crash);
// //     // expect(error.message).toBe('Test stop drop error message');
// //     console.log('error2 ', error);
// //     return Promise.resolve('job2 dropped');
// //   });

// // Stop the limiter
// // const promiseStop = bottleneck.stop(stopConfig).then(resolveStop).catch(error);
// // const promiseStop2 = bottleneck2.stop(stopConfig).then(resolveStop).catch(error);

// // Try to schedule a new job after stopping the limiter
// // const promise3 = bottleneck
// //   .schedule({ id: 'job3' }, () => {
// //     return new Promise(resolve => setTimeout(resolve, 1000));
// //   })
// //   .then(() => {
// //     throw new Error('Should not be here');
// //   })
// //   .catch(error => {
// //     // expect(error).toBeInstanceOf(Crash);
// //     // expect(error.message).toBe('Test stop enqueue error message');
// //     return Promise.resolve('job3 not enqueued');
// //   });

// // promiseStop
// //   .then(result => {
// //     console.log('promiseStop resolved: ', result);
// //   })
// //   .catch(error => {
// //     console.log('promiseStop rejected');
// //   });
