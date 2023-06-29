/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { EventsListeners, Status } from '.';

/**
 * Represents an event emitter.
 * @remarks
 * This class provides functionality to add listeners, trigger events, and manage
 * event subscriptions.
 */
export class Events {
  /** The object instance associated with the event emitter */
  private instance: any;
  /** The collection of event listeners mapped by event names */
  private _events: EventsListeners;

  /**
   * Creates a new instance of the Events class.
   *
   * @param instance - The object to bind the event emitter functionality to.
   * @throws Error if an Emitter already exists for the provided object.
   */
  constructor(instance: any) {
    this.instance = instance;
    this._events = {};

    /** The object instance associated must have on, once and removeAllListeners properties */
    if (
      this.instance.on != null ||
      this.instance.once != null ||
      this.instance.removeAllListeners != null
    ) {
      throw new Error('An Emitter already exists for this object');
    }

    this.instance.on = (name: string, cb: any): any => {
      return this._addListener(name, 'many', cb);
    };

    this.instance.once = (name: string, cb: any): any => {
      return this._addListener(name, 'once', cb);
    };

    this.instance.removeAllListeners = (name?: string): void => {
      if (name) {
        delete this._events[name];
      } else {
        this._events = {};
      }
    };
  }

  /**
   * Adds a listener for the specified event.
   *
   * @param name - The name of the event.
   * @param status - The status of the listener ('many' or 'once').
   * @param cb - The callback function to invoke when the event is triggered.
   * @returns The object instance associated with the event emitter.
   */
  private _addListener(name: string, status: Status, cb: any): any {
    if (this._events[name] == null) {
      this._events[name] = [];
    }
    this._events[name].push({
      cb,
      status,
    });
    return this.instance;
  }

  /**
   * Returns the number of listeners subscribed to a specific event.
   * @param name - The name of the event.
   * @returns The number of listeners subscribed to the event.
   */
  public listenerCount(name: string): number {
    if (this._events[name] != null) {
      return this._events[name].length;
    } else {
      return 0;
    }
  }

  /**
   * Triggers an event and invokes all the subscribed listeners.
   * @param name - The name of the event to trigger.
   * @param args - The arguments to pass to the event listeners.
   * @returns A promise that resolves to the result of the event listeners.
   */
  public async trigger(name: string, ...args: any[]): Promise<any> {
    try {
      if (name !== 'debug') {
        this.trigger('debug', `Event triggered: ${name}`, args);
      }

      if (!this._events[name]) {
        return null;
      }

      this._events[name] = this._events[name].filter(listener => listener.status !== 'none');

      const promises = this._events[name].map(async listener => {
        if (listener.status === 'none') {
          return null;
        }

        if (listener.status === 'once') {
          listener.status = 'none';
        }

        try {
          const returned = typeof listener.cb === 'function' ? listener.cb(...args) : null;
          if (returned?.then && typeof returned.then === 'function') {
            return await returned;
          } else {
            return returned;
          }
        } catch (error) {
          // TODO: Check. Original: if ("name" !== "error")
          if (name != 'error') {
            this.trigger('error', error);
          }
          return null;
        }
      });

      const results = await Promise.all(promises);
      return results.find(x => x !== null) || null;
    } catch (error) {
      // TODO: Check. Original: if ("name" !== "error")
      if (name !== 'error') {
        this.trigger('error', error);
      }
      return null;
    }
  }
}
