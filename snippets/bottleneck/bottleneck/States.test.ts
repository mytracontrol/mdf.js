/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { States } from '../states';

describe('#Bottleneck #States', () => {
  const status = ['INIT', 'RUNNING', 'DONE'];
  describe('#Happy path', () => {
    it(`Should create a new instance of States`, () => {
      const states = new States(status);
      expect(states).toBeDefined();
      expect(states).toBeInstanceOf(States);
      expect(states.counts).toEqual([0, 0, 0]);
    }, 300);
    it(`Should start a job by setting its state to the first one`, () => {
      const states = new States(status);
      states.start('job1');
      expect(states.jobStatus('job1')).toBe('INIT');
      expect(states.counts).toEqual([1, 0, 0]);
    }, 300);
    it(`Should set a job state to the next one when it is not the last state`, () => {
      const states = new States(status);
      states.start('job1');
      states.next('job1');
      expect(states.jobStatus('job1')).toBe('RUNNING');
      expect(states.counts).toEqual([0, 1, 0]);

      states.next('job1');
      expect(states.jobStatus('job1')).toBe('DONE');
      expect(states.counts).toEqual([0, 0, 1]);
    }, 300);
    it(`Should delete a job from states tracking when it has passed the last state`, () => {
      const states = new States(status);
      states.start('job1');
      states.next('job1');
      states.next('job1');
      expect(states.jobStatus('job1')).toBe('DONE');
      expect(states.counts).toEqual([0, 0, 1]);

      states.next('job1');
      expect(states.jobStatus('job1')).toBeNull();
      expect(states.counts).toEqual([0, 0, 0]);
    }, 300);
    it(`Should remove the job id from the states tracking`, () => {
      const states = new States(status);
      states.start('job1');
      expect(states.jobStatus('job1')).toBe('INIT');
      expect(states.counts).toEqual([1, 0, 0]);

      const removed = states.remove('job1');
      expect(removed).toBe(true);
      expect(states.jobStatus('job1')).toBeNull();
    }, 300);
    it(`Should do nothing when the job id to remove is not in states tracking`, () => {
      const states = new States(status);
      expect(states.jobStatus('job1')).toBeNull();

      const removed = states.remove('job1');
      expect(removed).toBe(false);
    }, 300);
    it(`Should return the current state of a job id`, () => {
      const states = new States(status);
      states.start('job1');
      expect(states.jobStatus('job1')).toBe('INIT');

      states.next('job1');
      expect(states.jobStatus('job1')).toBe('RUNNING');

      states.next('job1');
      expect(states.jobStatus('job1')).toBe('DONE');
      expect(states.jobStatus('job2')).toBeNull();
    }, 300);
    it(`Should return null when the job id is not in states tracking`, () => {
      const states = new States(status);
      expect(states.jobStatus('job1')).toBeNull();
    }, 300);
    it(`Should return the job ids at a given status`, () => {
      const states = new States(status);
      states.start('job1');
      states.start('job2');
      states.start('job3');
      states.start('job4');
      states.next('job2');
      states.next('job3');
      states.next('job3');

      expect(states.statusJobs('INIT')).toEqual(['job1', 'job4']);
      expect(states.statusJobs('RUNNING')).toEqual(['job2']);
      expect(states.statusJobs('DONE')).toEqual(['job3']);
    }, 300);
    it(`Should return all job ids when no status key is given`, () => {
      const states = new States(status);
      states.start('job1');
      states.start('job2');
      states.start('job3');
      states.start('job4');
      states.next('job2');
      states.next('job3');
      states.next('job3');

      expect(states.statusJobs()).toEqual(['job1', 'job2', 'job3', 'job4']);
    }, 300);
    it(`Should return the number of jobs at each status`, () => {
      const states = new States(status);
      states.start('job1');
      states.start('job2');
      states.start('job3');
      states.start('job4');
      states.next('job2');
      states.next('job3');
      states.next('job3');

      expect(states.statusCounts()).toEqual({
        INIT: 2,
        RUNNING: 1,
        DONE: 1,
      });
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should throw an error when trying to move a job to the next state when it is not in states tracking`, () => {
      const states = new States(status);
      expect(() => states.next('job1')).toThrow('Job job1 does not exist');
    }, 300);
    it(`Should throw an error when trying to get the status of a job not in states tracking`, () => {
      const states = new States(status);
      expect(() => states.statusJobs('NO_NE')).toThrow('Status must be one of INIT, RUNNING, DONE');
    }, 300);
  });
});
