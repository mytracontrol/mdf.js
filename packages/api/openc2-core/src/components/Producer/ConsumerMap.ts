/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { get, isEqual, uniq } from 'lodash';
import { v4 } from 'uuid';
import { Accessors } from '../../helpers';
import { Control } from '../../types';

export declare interface ConsumerMap {
  /** Emitted when a producer's operation has some problem */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /** Emitted when new nodes are included included map */
  on(event: 'new', listener: (nodes: string[]) => void): this;
  /** Emitted when some nodes has been aged */
  on(event: 'aged', listener: (nodes: string[]) => void): this;
  /** Emitted when nodes are updated */
  on(event: 'update', listener: (nodes: string[]) => void): this;
  /** Emitted when the consumer has been updated */
  on(event: 'updated', listener: (nodes: string[]) => void): this;
}

export class ConsumerMap extends EventEmitter implements Health.Component {
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.Status;
  /** Component identification */
  public readonly componentId = v4();
  /** Consumer Map */
  private readonly map: Map<string, Health.Check<Control.Response>>;
  /** Aging timer  */
  private agingTimer?: NodeJS.Timeout;
  /**
   * Create a new instance of the consumer map
   * @param name - name of the producer
   * @param agingInterval - agingInterval to update the consumer map
   * @param maxAge - Max allowed age in in milliseconds for a table entry
   */
  constructor(
    public readonly name: string,
    private readonly agingInterval: number,
    private readonly maxAge: number
  ) {
    super();
    this.map = new Map();
  }
  /** Get the actual nodes */
  public get nodes(): Control.Response[] {
    return Array.from(this.map.values())
      .map(node => node.observedValue)
      .filter(node => node !== undefined) as Control.Response[];
  }
  /**
   * Returns the grouped features of all the consumer in the map
   * @returns
   */
  public getGroupedFeatures(): { pairs: Control.ActionTargetPairs; profiles: string[] } {
    const nodes = this.nodes;
    const pairs: Control.ActionTargetPairs = {};
    const arrayOfPairs = nodes.map(node => node.results?.pairs || {});
    for (const nodePairs of arrayOfPairs) {
      for (const [action, targets] of Object.entries(nodePairs)) {
        if (pairs[action as Control.Action]) {
          pairs[action as Control.Action] = uniq(
            (pairs[action as Control.Action] as string[]).concat(targets)
          );
        } else {
          pairs[action as Control.Action] = targets;
        }
      }
    }
    const profiles = uniq(nodes.map(node => node.results?.profiles ?? []).flat());
    return { pairs, profiles };
  }
  /**
   * Return the consumers identifiers that has the indicated action/target pair
   * @param action - action to search
   * @param target - target requested
   */
  public getConsumersWithPair(action: string, target: string): string[] {
    const consumers: string[] = [];
    for (const [consumerId, consumer] of this.map.entries()) {
      const targets = get(consumer, `observedValue.results.pairs.${action}`, []) as string[];
      if (targets.includes(target)) {
        consumers.push(consumerId);
      }
    }
    return consumers;
  }
  /**
   * Perform the update of the health map
   * @param responses - responses to update the consumer map
   */
  public update(responses: Control.ResponseMessage[]): void {
    const emitAsNewEntry: string[] = [];
    const emitAsChanged: string[] = [];
    for (const response of responses) {
      const actualRegistry = this.map.get(response.from);
      if (!actualRegistry) {
        emitAsNewEntry.push(response.from);
      } else if (!isEqual(actualRegistry.observedValue, response.content)) {
        emitAsChanged.push(response.from);
      }
      this.updateEntry(response);
    }
    if (emitAsNewEntry.length > 0) {
      this.emit('new', emitAsNewEntry);
    }
    if (emitAsChanged.length > 0) {
      this.emit('update', emitAsChanged);
    }
    if (emitAsChanged.length > 0 || emitAsNewEntry.length > 0) {
      this.emit('updated', emitAsChanged.concat(emitAsNewEntry));
    }
    this.emitStatus();
    if (!this.agingTimer && this.map.size > 0) {
      this.agingTimer = setInterval(this.aging, this.agingInterval);
    }
  }
  /**
   * Get one node from the map
   * @param consumerId - consumer id to get the status
   * @returns
   */
  public getNode(consumerId: string): Health.Check<Control.Response> | undefined {
    return this.map.get(consumerId);
  }
  /** Return the state of all the underlying consumers */
  public get checks(): Health.Checks<Control.Response> {
    return { [`${this.name}:consumers`]: Array.from(this.map.values()) };
  }
  /** Perform the aging of the consumer map */
  private readonly aging = (): void => {
    const emitAsAged: string[] = [];
    const checkTime = new Date().getTime();
    for (const [consumerId, consumer] of this.map.entries()) {
      const age = checkTime - new Date(consumer.time || 0).getTime();
      if (age > this.maxAge) {
        emitAsAged.push(consumerId);
        this.map.delete(consumerId);
      }
    }
    if (emitAsAged.length > 0) {
      this.emit('aged', emitAsAged);
      this.emit('updated', emitAsAged);
    }
    if (this.map.size === 0) {
      clearInterval(this.agingTimer);
      this.agingTimer = undefined;
    }
  };
  /**
   * Update the consumer map with a new response
   * @param response - response to update the consumer map
   */
  private updateEntry(response: Control.ResponseMessage): void {
    this.map.set(response.from, {
      componentId: response.from,
      componentType: 'OpenC2 Consumer',
      time: new Date(response.created).toISOString(),
      status: Accessors.getStatusFromResponseMessage(response),
      observedValue: response.content,
      observedUnit: 'features',
    });
  }
  /** Overall component status */
  private get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Emit the status if it's different from the last emitted status */
  private emitStatus(): void {
    if (this.lastStatusEmitted !== this.status) {
      this.lastStatusEmitted = this.status;
      this.emit('status', this.status);
    }
  }
  /** Clean the nodes map */
  public clear(): void {
    this.map.clear();
    if (this.agingTimer) {
      clearInterval(this.agingTimer);
      this.agingTimer = undefined;
    }
  }
}
