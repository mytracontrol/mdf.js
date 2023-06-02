/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { EventsListeners, Status } from './Events.interfaces';

export class Events {
  private instance: any;
  private _events: EventsListeners;
  constructor(instance: any) {
    this.instance = instance;
    this._events = {};

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

  public listenerCount(name: string): number {
    if (this._events[name] != null) {
      return this._events[name].length;
    } else {
      return 0;
    }
  }

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
        // TODO: This condition wont be met bc this._events[name] was filtered above
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
          if (name !== 'error') {
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
