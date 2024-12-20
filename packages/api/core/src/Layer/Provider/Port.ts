/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance, SetContext } from '@mdf.js/logger';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';
import { Health } from '../..';

export declare interface Port<PortClient, PortConfig> {
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Multi) => void): this;
  /**
   * Add a listener for the `error` event, emitted when the component detects an error. This is a
   * one-time event, the listener will be removed after the first emission.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  once(event: 'error', listener: (error: Crash | Multi) => void): this;
  /**
   * Emit an `error` event, to notify errors in the resource management or access, this will change
   * the provider state by the upper manager.
   * @param event - `error` event
   * @param error - Error to be notified to the upper manager
   * @event
   */
  emit(event: 'error', error: Crash | Multi): boolean;
  /**
   * Add a listener for the `closed` event, emitted when the port resources are no longer available
   * @param event - `closed` event
   * @param listener - Closed event listener
   * @event
   */
  on(event: 'closed', listener: (error?: Crash | Multi) => void): this;
  /**
   * Add a listener for the `closed` event, emitted when the port resources are no longer available.
   * This is a one-time event, the listener will be removed after the first emission.
   * @param event - `closed` event
   * @param listener - Closed event listener
   * @event
   */
  once(event: 'closed', listener: (error?: Crash | Multi) => void): this;
  /**
   * Emit a `closed` event, to notify that the access to the resources is not longer possible. This
   * event should not be emitted if {@link Port.stop} or {@link Port.close } methods are used. This
   * event will change the provider state by the upper manager.
   * @param event - `closed` event
   * @param error - Error to be notified to the upper manager, if any
   * @event
   */
  emit(event: 'closed', error?: Crash | Multi): boolean;
  /**
   * Add a listener for the `unhealthy` event, emitted when the port has limited access to the
   * resources
   * @param event - `unhealthy` event
   * @param listener - Unhealthy event listener
   * @event
   */
  on(event: 'unhealthy', listener: (error: Crash | Multi) => void): this;
  /**
   * Add a listener for the `unhealthy` event, emitted when the port has limited access to the
   * resources. This is a one-time event, the listener will be removed after the first emission.
   * @param event - `unhealthy` event
   * @param listener - Unhealthy event listener
   * @event
   */
  once(event: 'unhealthy', listener: (error: Crash | Multi) => void): this;
  /**
   * Emit an `unhealthy` event, to notify that the port has limited access to the resources. This
   * event will change the provider state by the upper manager.
   * @param event - `unhealthy` event
   * @param error - Error to be notified to the upper manager
   * @event
   */
  emit(event: 'unhealthy', error: Crash | Multi): boolean;
  /**
   * Add a listener for the `healthy` event, emitted when the port has recovered the access to the
   * resources
   * @param event - `healthy` event
   * @param listener - Healthy event listener
   * @event
   */
  on(event: 'healthy', listener: () => void): this;
  /**
   * Add a listener for the `healthy` event, emitted when the port has recovered the access to the
   * resources. This is a one-time event, the listener will be removed after the first emission.
   * @param event - `healthy` event
   * @param listener - Healthy event listener
   * @event
   */
  once(event: 'healthy', listener: () => void): this;
  /**
   * Emit a `healthy` event, to notify that the port has recovered the access to the resources. This
   * event will change the provider state by the upper manager.
   * @param event - `healthy` event
   * @event
   */
  emit(event: 'healthy'): boolean;
}
/**
 * This is the class that should be extended to implement a new specific Port.
 *
 * This class implements some util logic to facilitate the creation of new Ports, for this reason is
 * exposed as abstract class, instead of an interface. The basic operations that already implemented
 * in the class are:
 *
 * - {@link Health.Checks } management: using the {@link Port.addCheck} method is
 * possible to include new observed values that will be used in the observability layers.
 * - Create a {@link Port.uuid} unique identifier for the port instance, this uuid is used in error
 * traceability.
 * - Establish the context for the logger to simplify the identification of the port in the logs,
 * this is, it's not necessary to indicate the uuid and context in each logging function call.
 * - Store the configuration _**PortConfig**_ previously validated by the Manager.
 *
 * What the user of this class should develop in the specific port:
 *
 * - The {@link Port.start} method, which is responsible initialize or stablish the connection to
 * the resources.
 * - The {@link Port.stop} method, which is responsible stop services or disconnect from the
 * resources.
 * - The {@link Port.close} method, which is responsible to destroy the services, resources or
 * perform a simple disconnection.
 * - The {@link Port.state} property, a boolean value that indicates if the port is connected
 * healthy (true) or not (false).
 * - The {@link Port.client} property, that return the _**PortClient**_ instance that is used to
 * interact with the resources.
 *
 * ![class diagram](../../../media/Provider-Class-Hierarchy.png)
 *
 * In the other hand, this class extends the `EventEmitter` class, so it's possible to emit
 * events to notify the status of the port:
 *
 * - _**error**_: should be emitted to notify errors in the resource management or access, this will
 * not change the provider state, but the error will be registered in the observability layers.
 * - _**closed**_: should be emitted if the access to the resources is not longer possible. This
 * event should not be emitted if {@link Port.stop} or {@link Port.close } methods are used.
 * - _**unhealthy**_: should be emitted when the port has limited access to the resources.
 * - _**healthy**_: should be emitted when the port has recovered the access to the resources.
 *
 * ![class diagram](../../../media/Provider-States-Events.png)
 *
 * Check some examples of implementation in:
 *
 * - [Elastic provider](https://www.npmjs.com/package/@mdf.js/elastic-provider)
 * - [Mongo Provider](https://www.npmjs.com/package/@mdf.js/mongo-provider)
 * @category Provider
 * @param PortClient - Underlying client type, this is, the real client of the wrapped provider
 * @param PortConfig - Port configuration object, could be an extended version of the client config
 * @public
 */
export abstract class Port<PortClient, PortConfig> extends EventEmitter {
  /** Port unique identifier for trace purposes */
  public readonly uuid: string = v4();
  /** Port logger, to be used internally */
  protected readonly logger: LoggerInstance;
  /** Port diagnostic checks */
  private readonly checksMap: Map<string, Health.Check[]> = new Map();
  /**
   * Abstract implementation of basic functionalities of a Port
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param name - Port name, to be used as identifier
   */
  constructor(
    public readonly config: PortConfig,
    logger: LoggerInstance,
    public readonly name: string
  ) {
    super();
    this.logger = SetContext(logger, this.name, this.uuid);
  }
  /**
   * Update or add a check measure.
   * This should be used to inform about the state of resources behind the Port, for example memory
   * usage, CPU usage, etc.
   *
   * The new check will be taking into account in the overall health status.
   * The new check will be included in the `checks` object with the key indicated in the param
   * `measure`.* If this key already exists, the `componentId` of the `check` parameter will be
   * checked, if there is a check with the same `componentId` in the array, the check will be
   * updated, in other case the new check will be added to the existing array.
   *
   * The maximum number external checks is 100
   * @param measure - measure identification
   * @param check - check to be updated or included
   * @returns true, if the check has been updated
   * @public
   */
  protected addCheck(measure: string, check: Health.Check): boolean {
    if (
      (check.status && !Health.STATUSES.includes(check.status)) ||
      typeof check.componentId !== 'string' ||
      this.checksMap.size >= 100
    ) {
      return false;
    }
    const checks = this.checksMap.get(measure) || [];
    const entryIndex = checks.findIndex(entry => entry.componentId === check.componentId);
    if (entryIndex === -1) {
      checks.push(check);
    } else {
      checks[entryIndex] = check;
    }
    this.checksMap.set(measure, checks);
    return true;
  }
  /** Return the actual checks */
  public get checks(): Record<string, Health.Check[]> {
    const checks: Record<string, Health.Check[]> = {};
    for (const [measure, checksArray] of this.checksMap) {
      checks[measure] = checksArray;
    }
    return checks;
  }
  /** Return the underlying port client */
  public abstract get client(): PortClient;
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public abstract get state(): boolean;
  /** Start the port, making it available */
  public abstract start(): Promise<void>;
  /** Stop the port, making it unavailable */
  public abstract stop(): Promise<void>;
  /** Close the port, making it no longer available */
  public abstract close(): Promise<void>;
}
