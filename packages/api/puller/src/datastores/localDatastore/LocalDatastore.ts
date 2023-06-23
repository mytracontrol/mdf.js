import { Bottleneck } from '../../bottleneck/Bottleneck';
import { BottleneckError } from '../../bottleneckError/BottleneckError';
import { overwrite } from '../../parser/Parser';
import {
  FreeResult,
  LocalStoreOptionsComplete,
  RegistrationResult,
  StoreOptions,
  StoreOptionsComplete,
  SubmissionResult,
} from '../DataStores.interfaces';

export class LocalDatastore {
  private instance: Bottleneck;
  private _clientId: string;

  // General store options
  private _storeOptions: StoreOptionsComplete;

  // Store instance options (Local)
  private _timeout: number | null;
  private _heartbeatInterval: number;

  private _nextRequest: number;
  private _lastReservoirRefresh: number;
  private _lastReservoirIncrease: number;
  private _running: number;
  private _done: number;
  private _unblockTime: number;
  private _ready: Promise<void>;
  private _clients: object;
  private _heartbeat: NodeJS.Timer | undefined;

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

  public async __publish__(message: any): Promise<void> {
    await this.yieldLoop();
    this.instance.events.trigger('message', message.toString());
  }

  async __disconnect__(flush: boolean): Promise<void> {
    await this.yieldLoop();
    clearInterval(this.heartbeat);
    return Promise.resolve();
  }

  private yieldLoop(t = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, t));
  }

  private _computePenalty(): number {
    return this._storeOptions.penalty ?? (15 * this._storeOptions.minTime || 5000);
  }

  public async __updateSettings__(options: StoreOptions): Promise<boolean> {
    await this.yieldLoop();
    overwrite(options, options, this._storeOptions);
    this._startHeartbeat();
    this.instance.drainAll(this._computeCapacity());
    return true;
  }

  public async __running__(): Promise<number> {
    await this.yieldLoop();
    return this._running;
  }

  public async __queued__(): Promise<number | undefined> {
    await this.yieldLoop();
    return this.instance.queued();
  }

  public async __done__(): Promise<number> {
    await this.yieldLoop();
    return this._done;
  }

  public async __groupCheck__(time: number): Promise<boolean> {
    await this.yieldLoop();
    return this._nextRequest + (this._timeout as number) <= time;
  }

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

  private _conditionsCheck(weight: number): boolean {
    const capacity = this._computeCapacity();
    return capacity == null || weight <= capacity;
  }

  public async __incrementReservoir__(incr: number): Promise<number> {
    await this.yieldLoop();
    (this._storeOptions.reservoir as number) += incr;
    this.instance.drainAll(this._computeCapacity());
    return this._storeOptions.reservoir as number;
  }

  public async __currentReservoir__(): Promise<number | null> {
    await this.yieldLoop();
    return this._storeOptions.reservoir;
  }

  private _isBlocked(now: number): boolean {
    return this._unblockTime >= now;
  }

  private _check(weight: number, now: number): boolean {
    return this._conditionsCheck(weight) && this._nextRequest - now <= 0;
  }

  public async __check__(weight: number): Promise<boolean> {
    await this.yieldLoop();
    const now = Date.now();
    return this._check(weight, now);
  }

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

  private _strategyIsBlocked(): boolean {
    return this._storeOptions.strategy == 3;
  }

  public async __submit__(queueLength: number, weight: number): Promise<SubmissionResult> {
    await this.yieldLoop();
    if (this._storeOptions.maxConcurrent != null && weight > this._storeOptions.maxConcurrent) {
      throw new BottleneckError(
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

  public async __free__(index: string, weight: number): Promise<FreeResult> {
    await this.yieldLoop();
    this._running -= weight;
    this._done += weight;
    this.instance.drainAll(this._computeCapacity());

    const result: FreeResult = { running: this._running };
    return result;
  }

  //-------------------- GETTERS --------------------
  public get ready(): Promise<void> {
    return this._ready;
  }

  public get clientId(): string {
    return this._clientId;
  }

  public get heartbeat(): NodeJS.Timeout | undefined {
    return this._heartbeat;
  }

  public get heartbeatInterval(): number {
    return this._heartbeatInterval;
  }

  public get clients(): object {
    return this._clients;
  }
}
