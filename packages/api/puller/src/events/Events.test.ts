/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Events } from '.';

describe('#Puller #Events', () => {
  class Hello {
    emitter: Events;
    on: any;
    once: any;
    removeAllListeners: any;
    constructor() {
      this.emitter = new Events(this);
    }

    triggerInfoEvent(msg: string, num: number): Promise<any> {
      return this.emitter.trigger('info', msg, num);
    }
  }

  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of Events associated to the class where it is created`, () => {
      const helloObj = new Hello();
      expect(helloObj).toBeDefined();
      expect(helloObj.emitter).toBeDefined();
      expect(helloObj.emitter).toBeInstanceOf(Events);
    });
    it(`Should return the count of listeners registered for the associated instance`, () => {
      const helloObj1 = new Hello();
      const helloObj2 = new Hello();

      helloObj1.on('info', () => 1);
      expect(helloObj1.emitter.listenerCount('info')).toBe(1);

      helloObj1.once('info', () => 1);
      expect(helloObj1.emitter.listenerCount('info')).toBe(2);

      expect(helloObj2.emitter.listenerCount('info')).toBe(0);
    });

    it(`Should execute the callback given to the 'once' listener only the first time the event is triggered`, () => {
      const helloObj1 = new Hello();

      const onceCallback = jest.fn((msg: string, num: number) => {
        return `${msg} ${num}`;
      });
      helloObj1.once('info', onceCallback);

      helloObj1.triggerInfoEvent('hello', 1);
      helloObj1.triggerInfoEvent('world', 2);
      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(onceCallback).toHaveBeenCalledWith('hello', 1);
    });

    it(`Should execute the callback given to the 'on' listener every time the event is triggered`, () => {
      const helloObj1 = new Hello();

      const mockCallback = jest.fn((msg: string, num: number) => {
        return `${msg} ${num}`;
      });
      helloObj1.on('info', mockCallback);

      helloObj1.triggerInfoEvent('hello', 1);
      helloObj1.triggerInfoEvent('world', 2);
      helloObj1.triggerInfoEvent('bye', 3);
      expect(mockCallback.mock.calls).toHaveLength(3);
      expect(mockCallback.mock.calls[0]).toEqual(['hello', 1]);
      expect(mockCallback.mock.calls[1]).toEqual(['world', 2]);
      expect(mockCallback.mock.calls[2]).toEqual(['bye', 3]);
    });

    it(`Should return null when trying to trigger an event that is ot registered`, done => {
      const helloObj1 = new Hello();

      helloObj1.triggerInfoEvent('hello', 1).then(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it(`Should remove all listeners of the given event`, () => {
      const helloObj1 = new Hello();

      const callback = (msg: string, num: number) => {
        return `${msg} ${num}`;
      };
      helloObj1.on('info', callback);
      helloObj1.once('info', callback);
      expect(helloObj1.emitter.listenerCount('info')).toBe(2);

      helloObj1.removeAllListeners('info');
      expect(helloObj1.emitter.listenerCount('info')).toBe(0);
    });

    it(`Should remove all listeners of all events when none is given`, () => {
      const helloObj1 = new Hello();

      const callback = (msg: string, num: number) => {
        return `${msg} ${num}`;
      };
      helloObj1.on('info', callback);
      helloObj1.once('info', callback);
      helloObj1.once('warn', callback);
      expect(helloObj1.emitter.listenerCount('info')).toBe(2);
      expect(helloObj1.emitter.listenerCount('warn')).toBe(1);

      helloObj1.removeAllListeners();
      expect(helloObj1.emitter.listenerCount('info')).toBe(0);
      expect(helloObj1.emitter.listenerCount('warn')).toBe(0);
    });
  });

  describe('#Sad path', () => {
    it(`Should throw an error when trying to create an instance of Events for an instance that have already an associated Event emitter`, () => {
      let anotherEventsEmitter: Events | null = null;
      try {
        const helloObj = new Hello();
        anotherEventsEmitter = new Events(helloObj);
        throw new Error('Should not be here');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('An Emitter already exists for this object');
        expect(anotherEventsEmitter).toBeNull();
      }
    });

    it(`Should emit an error event when the execution of the given callback fails`, done => {
      const helloObj1 = new Hello();

      const callback = (msg: string, num: number) => {
        return Promise.reject(new Error(`Error executing callback with params: ${msg}, ${num}`));
      };
      helloObj1.on('info', callback);
      helloObj1.on('error', (error: Error) => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Error executing callback with params: hello, 1');
        done();
      });
      helloObj1.triggerInfoEvent('hello', 1);
    });
  });
});
