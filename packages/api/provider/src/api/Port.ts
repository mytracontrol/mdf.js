/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, SetContext } from '@mdf.js/logger';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';

/** Port base interface */
export declare interface Port<PortClient, PortConfig> {
  /** Emitted if an error occurs on the port side */
  on(event: 'error', listener: (error: Crash) => void): this;
  /** Emitted when the port is ready to be used */
  on(event: 'ready', listener: () => void): this;
  /** Emitted when the port is no longer available */
  on(event: 'closed', listener: (error?: Crash) => void): this;
  /** Emitted one of the nodes is not healthy */
  on(event: 'unhealthy', listener: (error: Crash) => void): this;
  /** Emitted one all the nodes are healthy */
  on(event: 'healthy', listener: () => void): this;
}
export abstract class Port<PortClient, PortConfig> extends EventEmitter {
  /** Port unique identifier for trace purposes */
  public readonly uuid: string = v4();
  /** Port name, to be used as identifier */
  protected readonly name: string;
  /** Port logger, to be used internally */
  protected readonly logger: LoggerInstance;
  /** Port configuration options */
  public readonly config: PortConfig;
  /** Port diagnostic checks */
  private readonly checksMap: Map<string, Health.API.Check[]> = new Map();
  /**
   * Abstract implementation of base functionalities of a Port
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param name - Port name, to be used as identifier
   */
  constructor(config: PortConfig, logger: LoggerInstance, name: string) {
    super();
    this.config = config;
    this.name = name;
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
   */
  protected addCheck(measure: string, check: Health.API.Check): boolean {
    if (
      (check.status && !Health.API.STATUS.includes(check.status)) ||
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
  public get checks(): Record<string, Health.API.Check[]> {
    const checks: Record<string, Health.API.Check[]> = {};
    for (const [measure, checksArray] of this.checksMap) {
      checks[measure] = checksArray;
    }
    return checks;
  }
  /** Return the underlying port client */
  public abstract get client(): PortClient;
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public abstract get state(): boolean;
  /** Return the port status */
  /** Start the port, making it available */
  public abstract start(): Promise<void>;
  /** Stop the port, making it unavailable */
  public abstract stop(): Promise<void>;
  /** Close the port, making it no longer available */
  public abstract close(): Promise<void>;
}
