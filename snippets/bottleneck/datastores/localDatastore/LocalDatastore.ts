/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import {
  FreeResult,
  LocalStoreOptionsComplete,
  RegistrationResult,
  StoreOptions,
  StoreOptionsComplete,
  SubmissionResult,
} from '..';
import { Bottleneck } from '../../bottleneck';
import { overwrite } from '../../parser';

/**
 * Represents a local datastore for rate limiting using the Bottleneck library.
 */
export class LocalDatastore {
  /** The instance of Bottleneck associated with the datastore */
  private instance: Bottleneck;
  /** The client ID associated with the datastore */
  private _clientId: string;

  // General store options
  /** The complete store options for the datastore */
  private _storeOptions: StoreOptionsComplete;

  // Store instance options (Local)
  /** The timeout duration for the limiter in the datastore */
  private _timeout: number | null;
  /** The interval for the heartbeat of the datastore in milliseconds */
  private _heartbeatInterval: number;

  /** The timestamp for the next request in the datastore */
  private _nextRequest: number;
  /** The timestamp for the last reservoir refresh in the datastore */
  private _lastReservoirRefresh: number;
  /** The timestamp for the last reservoir increase in the datastore */
  private _lastReservoirIncrease: number;
  /** The number of running requests in the datastore */
  private _running: number;
  /** The number of completed requests in the datastore */
  private _done: number;
  /** The unblock time for the datastore */
  private _unblockTime: number;
  /** A promise that resolves when the datastore is ready for use */
  private _ready: Promise<void>;
  /** The clients associated with the datastore */
  private _clients: object;
  /** The timer for the datastore heartbeat */
  private _heartbeat: NodeJS.Timeout | undefined;

  /**
   * Creates a new instance of the LocalDatastore class.
   * @param instance - The instance of Bottleneck associated with the datastore.
   * @param storeOptions - The complete store options for the datastore.
   * @param storeInstanceOptions - The specific options for the local store instance.
   */
  constructor(
    instance: Bottleneck,
    storeOptions: StoreOptionsComplete,
    storeInstanceOptions: LocalStoreOptionsComplete
  ) {
    this.instance = instance;
    this._storeOptions = storeOptions;
    this._clientId = instance.randomIndex();

    // Load initial Local store instance options
    this._timeout = storeInstanceOptions.timeout;
    this._heartbeatInterval = storeInstanceOptions.heartbeatInterval;

    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    this._running = 0;
    this._done = 0;
    this._unblockTime = 0;
    this._ready = Promise.resolve();
    this._clients = {};

    this._startHeartbeat();
  }

  /** Starts the heartbeat of the datastore */
  private _startHeartbeat() {
    const reservoirRefreshParamsProvided =
      this._storeOptions.reservoirRefreshInterval != null &&
      this._storeOptions.reservoirRefreshAmount != null;

    const reservoirIncreaseParamsProvided =
      this._storeOptions.reservoirIncreaseInterval != null &&
      this._storeOptions.reservoirIncreaseAmount != null;

    if (
      this._heartbeat == undefined &&
      (reservoirRefreshParamsProvided || reservoirIncreaseParamsProvided)
    ) {
      this._heartbeat = setInterval(() => {
        const now = Date.now();

        if (
          this._storeOptions.reservoirRefreshInterval != null &&
          now >= this._lastReservoirRefresh + this._storeOptions.reservoirRefreshInterval
        ) {
          this._lastReservoirRefresh = now;
          this._storeOptions.reservoir = this._storeOptions.reservoirRefreshAmount;
          this.instance.drainAll(this._computeCapacity());
        }

        if (
          this._storeOptions.reservoirIncreaseInterval != null &&
          now >= this._lastReservoirIncrease + this._storeOptions.reservoirIncreaseInterval
        ) {
          const amount = this._storeOptions.reservoirIncreaseAmount;
          const maximum = this._storeOptions.reservoirIncreaseMaximum;
          const reservoir = this._storeOptions.reservoir;
          this._lastReservoirIncrease = now;
          const incr = maximum
            ? Math.min(amount as number, maximum - (reservoir as number))
            : (amount as number);
          if (incr > 0) {
            (this._storeOptions.reservoir as number) += incr;
            this.instance.drainAll(this._computeCapacity());
          }
        }
      }, this.heartbeatInterval).unref();
    } else {
      clearInterval(this.heartbeat);
    }
  }

  /**
   * Publishes a message to the datastore.
   * @param message - The message to publish.
   * @returns A promise that resolves when the message is published.
   */
  public async __publish__(message: any): Promise<void> {
    await this.yieldLoop();
    this.instance.emit('message', message.toString());
  }

  /**
   * Disconnects from the datastore.
   * @param flush - Indicates whether to flush pending commands before
   * disconnecting (default: true).
   * @returns A promise that resolves when the disconnection is complete.
   */
  async __disconnect__(flush: boolean): Promise<void> {
    await this.yieldLoop();
    clearInterval(this.heartbeat);
    return Promise.resolve();
  }

  /**
   * Pauses execution for a specified time.
   * @param t - The time to pause in milliseconds.
   * @returns A promise that resolves after the specified time.
   */
  private yieldLoop(t = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, t));
  }

  /**
   * Computes time penalty for unblocking queue.
   * @returns The time penalty value for unblocking queue.
   */
  private _computePenalty(): number {
    return this._storeOptions.penalty ?? (15 * this._storeOptions.minTime || 5000);
  }

  /**
   * Updates the settings of the datastore.
   * @param options - The new store options to update.
   * @returns A promise that resolves with a boolean indicating if the settings
   * were updated successfully.
   */
  public async __updateSettings__(options: StoreOptions): Promise<boolean> {
    await this.yieldLoop();
    overwrite(options, options, this._storeOptions);
    this._startHeartbeat();
    this.instance.drainAll(this._computeCapacity());
    return true;
  }

  /**
   * Retrieves the number of currently running requests in the datastore.
   * @returns A promise that resolves with the number of running requests.
   */
  public async __running__(): Promise<number> {
    await this.yieldLoop();
    return this._running;
  }

  /**
   * Retrieves the number of queued requests in the datastore.
   * @returns A promise that resolves with the number of queued requests.
   */
  public async __queued__(): Promise<number> {
    await this.yieldLoop();
    return this.instance.queued();
  }

  /**
   * Retrieves the number of completed requests in the datastore.
   * @returns A promise that resolves with the number of completed requests.
   */
  public async __done__(): Promise<number> {
    await this.yieldLoop();
    return this._done;
  }

  /**
   * Checks if the next request on group can be processed based on the specified time.
   * @param time - The (current) time in milliseconds.
   * @returns A promise that resolves with a boolean indicating if the next request
   * can be processed.
   */
  public async __groupCheck__(time: number): Promise<boolean> {
    await this.yieldLoop();
    return this._nextRequest + (this._timeout as number) <= time;
  }

  /**
   * Computes the capacity of limiter job queue.
   * @returns The capacity of limiter job queue, or null if the capacity cannot be determined.
   */
  private _computeCapacity(): number | null {
    const maxConcurrent = this._storeOptions.maxConcurrent;
    const reservoir = this._storeOptions.reservoir;
    if (maxConcurrent != null && reservoir != null) {
      return Math.min(maxConcurrent - this._running, reservoir);
    } else if (maxConcurrent != null) {
      return maxConcurrent - this._running;
    } else if (reservoir != null) {
      return reservoir;
    } else {
      return null;
    }
  }

  /**
   * Checks if the conditions for processing a request are met.
   * @param weight - The weight of the request.
   * @returns A boolean indicating if the conditions are met.
   */
  private _conditionsCheck(weight: number): boolean {
    const capacity = this._computeCapacity();
    return capacity == null || weight <= capacity;
  }

  /**
   * Increments the reservoir of the limiter.
   * @param incr - The increment value for the reservoir.
   * @returns A promise that resolves with the new value of the reservoir.
   */
  public async __incrementReservoir__(incr: number): Promise<number> {
    await this.yieldLoop();
    (this._storeOptions.reservoir as number) += incr;
    this.instance.drainAll(this._computeCapacity());
    return this._storeOptions.reservoir as number;
  }

  /**
   * Retrieves the current value of the reservoir in the limiter.
   * @returns A promise that resolves with the current value of the reservoir,
   * or null if the reservoir is not set.
   */
  public async __currentReservoir__(): Promise<number | null> {
    await this.yieldLoop();
    return this._storeOptions.reservoir;
  }

  /**
   * Checks if the limiter job queue is blocked at the specified time.
   * @param now - The current time in milliseconds.
   * @returns A boolean indicating if the limiter job queue is blocked.
   */
  private _isBlocked(now: number): boolean {
    return this._unblockTime >= now;
  }

  /**
   * Checks if a job can be processed based on the weight and current time.
   * @param weight - The weight of the job.
   * @param now - The current time in milliseconds.
   * @returns A boolean indicating if the job can be processed.
   */
  private _check(weight: number, now: number): boolean {
    return this._conditionsCheck(weight) && this._nextRequest - now <= 0;
  }

  /**
   * Checks if a job with the specified weight can be processed based on the current conditions.
   * @param weight - The weight of the job.
   * @returns A promise that resolves with a boolean indicating if the job can be processed.
   */
  public async __check__(weight: number): Promise<boolean> {
    await this.yieldLoop();
    const now = Date.now();
    return this._check(weight, now);
  }

  /**
   * Registers a job with the specified index, weight, and expiration in the limiter.
   * @param index - The index of the job.
   * @param weight - The weight of the request.
   * @param expiration - The expiration time of the job.
   * @returns A promise that resolves with a RegistrationResult object indicating the status
   * of the registration.
   */
  public async __register__(
    index: string,
    weight: number,
    expiration: number
  ): Promise<RegistrationResult> {
    let result: RegistrationResult;
    await this.yieldLoop();
    const now = Date.now();
    if (this._conditionsCheck(weight)) {
      this._running += weight;
      if (this._storeOptions.reservoir != null) {
        this._storeOptions.reservoir -= weight;
      }
      const wait = Math.max(this._nextRequest - now, 0);
      this._nextRequest = now + wait + this._storeOptions.minTime;
      result = { success: true, wait: wait, reservoir: this._storeOptions.reservoir };
    } else {
      result = { success: false };
    }

    return result;
  }

  /**
   * Checks if the strategy of the limiter is set to blocked.
   * @returns A boolean indicating if the strategy is set to blocked.
   */
  private _strategyIsBlocked(): boolean {
    return this._storeOptions.strategy == 3;
  }

  /**
   * Submits a job to the limiter if it can be submitted.
   * @param queueLength - The length of the queue in the limiter.
   * @param weight - The weight of the job.
   * @returns A promise that resolves with a SubmissionResult object indicating the status
   * of the submission.
   */
  public async __submit__(queueLength: number, weight: number): Promise<SubmissionResult> {
    await this.yieldLoop();
    if (this._storeOptions.maxConcurrent != null && weight > this._storeOptions.maxConcurrent) {
      throw new Crash(
        `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this._storeOptions.maxConcurrent}`
      );
    }

    const now = Date.now();
    const reachedHWM =
      this._storeOptions.highWater != null &&
      queueLength == this._storeOptions.highWater &&
      !this._check(weight, now);
    const blocked = this._strategyIsBlocked() && (reachedHWM || this._isBlocked(now));
    if (blocked) {
      this._unblockTime = now + this._computePenalty();
      this._nextRequest = this._unblockTime + this._storeOptions.minTime;
      this.instance.dropAllQueued();
    }

    const result: SubmissionResult = {
      reachedHWM: reachedHWM,
      blocked: blocked,
      strategy: this._storeOptions.strategy,
    };
    return result;
  }

  /**
   * Frees resources associated with a completed job in the limiter.
   * @param index - The index of the completed job.
   * @param weight - The weight of the completed job.
   * @returns A promise that resolves with a FreeResult object indicating the status
   * of freeing the resources.
   */
  public async __free__(index: string, weight: number): Promise<FreeResult> {
    await this.yieldLoop();
    this._running -= weight;
    this._done += weight;
    this.instance.drainAll(this._computeCapacity());

    const result: FreeResult = { running: this._running };
    return result;
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets a promise that resolves when the datastore is ready for use */
  public get ready(): Promise<void> {
    return this._ready;
  }
  /** Gets the client ID associated with the datastore */
  public get clientId(): string {
    return this._clientId;
  }
  /** Gets the timer for the datastore heartbeat, or undefined if the timer is not set */
  public get heartbeat(): NodeJS.Timeout | undefined {
    return this._heartbeat;
  }
  /** Gets the interval for the heartbeat of the datastore in milliseconds */
  public get heartbeatInterval(): number {
    return this._heartbeatInterval;
  }
  /** Gets the clients associated with the datastore */
  public get clients(): object {
    return this._clients;
  }
}
