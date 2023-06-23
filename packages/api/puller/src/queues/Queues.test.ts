/**
 * In this file we implement the unit tests
 * for the Queues class in typescript using jest.
 */
import { Bottleneck } from '../bottleneck/Bottleneck';
import { Events } from '../events/Events';
import { Job } from '../job/Job';
import { States } from '../states/States';
import { Queues } from './Queues';

describe('#Puller #Queues', () => {
  const jobDefaults = {
    priority: 5,
    weight: 1,
    expiration: null,
    id: '<no-id>',
  };
  const bottleneck = new Bottleneck({});
  let jobEvents: Events;
  let jobStates: States;
  let job1: Job;
  let job2: Job;
  let job3: Job;
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jobEvents = bottleneck.events;
    jobStates = new States(['STATE1', 'STATE2']);
    job1 = new Job(
      () => true,
      [],
      { id: 'job1', priority: 1 },
      jobDefaults,
      false,
      jobEvents,
      jobStates
    );
    job2 = new Job(
      () => true,
      [],
      { id: 'job2', priority: 1 },
      jobDefaults,
      false,
      jobEvents,
      jobStates
    );
    job3 = new Job(
      () => true,
      [],
      { id: 'job3', priority: 3 },
      jobDefaults,
      false,
      jobEvents,
      jobStates
    );
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of Queues`, () => {
      const queues = new Queues(5);
      expect(queues).toBeDefined();
      expect(queues).toBeInstanceOf(Queues);
      expect(queues.lists.length).toBe(5);
    });

    it(`Should push a job in the list of its corresponding priority`, () => {
      const queues = new Queues(5); // priorities from 0 to 4
      const eventSpy = jest.spyOn(queues.events, 'trigger');

      queues.push(job1);
      expect(eventSpy).toHaveBeenCalledWith('leftzero');
      expect(queues.length).toBe(1);
      expect(queues.queued(0)).toBe(0);
      expect(queues.queued(1)).toBe(1);
      expect(queues.lists[1].shift()).toEqual(job1);
    });

    it(`Should return the number of jobs queued in the list of the given priority`, () => {
      const queues = new Queues(5); // priorities from 0 to 4

      queues.push(job1);
      queues.push(job2);
      queues.push(job3);
      expect(queues.queued(0)).toBe(0);
      expect(queues.queued(1)).toBe(2);
      expect(queues.queued(3)).toBe(1);
    });

    it(`Should return the number of jobs queued in all lists when no priority is given`, () => {
      const queues = new Queues(5); // priorities from 0 to 4

      queues.push(job1);
      queues.push(job2);
      queues.push(job3);
      expect(queues.queued()).toBe(3);
    });

    it(`Should shift and apply the given function to jobs of all priority lists`, () => {
      const jobsIds: string[] = [];
      const queues = new Queues(5); // priorities from 0 to 4
      queues.push(job1);
      queues.push(job2);
      queues.push(job3);

      queues.shiftAll((job: Job) => {
        jobsIds.push(job.options.id);
      });
      expect(jobsIds).toEqual(['job1', 'job2', 'job3']);
    });

    it(`Should return the first priority list when it is not empty`, () => {
      const queues = new Queues(5); // priorities from 0 to 4

      queues.push(job1);
      let listsFormPrior1 = queues.lists.slice(1);
      expect(queues.getFirst(listsFormPrior1).length).toEqual(1);

      queues.push(job2);
      listsFormPrior1 = queues.lists.slice(1);
      const firstList = queues.getFirst(listsFormPrior1);
      expect(firstList.length).toEqual(2);
      expect(firstList).toEqual(listsFormPrior1[0]);
    });

    it(`Should return the first non-empty priority list bypassing the previous empty ones`, () => {
      const queues = new Queues(5); // priorities from 0 to 4

      // push in priority 1, priority 0 is empty
      queues.push(job1);
      queues.push(job2);
      const firstList = queues.getFirst();
      expect(firstList.length).toEqual(2);
      expect(firstList).toEqual(queues.lists[1]);
    });

    it(`Should return an empty array when all the priority lists are empty`, () => {
      const queues = new Queues(5); // priorities from 0 to 4
      expect(queues.getFirst()).toEqual([]);
    });

    it(`Should shift an element from the last non-empty priority list from the priority given onwards`, () => {
      const queues = new Queues(3); // priorities from 0 to 2
      queues.push(job1);
      queues.push(job2);
      const result = queues.shiftLastFrom(1);
      expect(result).toEqual(job1);
    });

    it(`Should return undefined when all lists from the priority given onwards are empty`, () => {
      const queues = new Queues(5); // priorities from 0 to 4
      queues.push(job1);
      queues.push(job2);
      const result = queues.shiftLastFrom(2);
      expect(result).toBeUndefined();
    });
  });
});
