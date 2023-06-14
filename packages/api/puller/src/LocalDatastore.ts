import { LocalStoreOptions } from './Bottleneck.interfaces';
import { BottleneckError } from './BottleneckError';
import { FreeResult, RegistrationResult, SubmissionResult } from './DataStores.interfaces';
import { load, overwrite } from './parser/Parser';

export class LocalDatastore {
  private instance: any;
  private clientId: number;
  private _nextRequest: number;
  private _lastReservoirRefresh: number;
  private _lastReservoirIncrease: number;
  private _running: number;
  private _done: number;
  private _unblockTime: number;
  private ready: Promise<void>;
  private clients: any;
  private storeOptions: any;
  private heartbeat: any;
  // TODO: Check
  public heartbeatInterval: number;

  constructor(instance: any, storeOptions: any, storeInstanceOptions: any) {
    this.instance = instance;
    this.clientId = instance._randomIndex();
    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    this._running = 0;
    this._done = 0;
    this._unblockTime = 0;

    this.ready = Promise.resolve();
    this.clients = {};

    this.storeOptions = storeOptions;

    load(storeInstanceOptions, storeInstanceOptions, this);
    this._startHeartbeat();
  }

  _startHeartbeat() {
    const reservoirRefreshParamsProvided =
      this.storeOptions.reservoirRefreshInterval != null &&
      this.storeOptions.reservoirRefreshAmount != null;

    const reservoirIncreaseParamsProvided =
      this.storeOptions.reservoirIncreaseInterval != null &&
      this.storeOptions.reservoirIncreaseAmount != null;

    if (
      !this.heartbeat != null &&
      (reservoirRefreshParamsProvided || reservoirIncreaseParamsProvided)
    ) {
      this.heartbeat = setInterval(() => {
        const now = Date.now();

        if (
          this.storeOptions.reservoirRefreshInterval != null &&
          now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval
        ) {
          this._lastReservoirRefresh = now;
          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
          this.instance._drainAll(this.computeCapacity());
        }

        if (
          this.storeOptions.reservoirIncreaseInterval != null &&
          now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval
        ) {
          // TODO: Check this.storeOptions type
          const {
            reservoirIncreaseAmount: amount,
            reservoirIncreaseMaximum: maximum,
            reservoir,
          } = this.storeOptions;
          this._lastReservoirIncrease = now;
          const incr = maximum ? Math.min(amount, maximum - reservoir) : amount;
          if (incr > 0) {
            this.storeOptions.reservoir += incr;
            this.instance._drainAll(this.computeCapacity());
          }
        }
      }, this.heartbeatInterval).unref();
    } else {
      clearInterval(this.heartbeat);
    }
  }

  async __publish__(message: any): Promise<void> {
    await this.yieldLoop();
    this.instance.trigger('message', message.toString());
  }

  // TODO: DONE: Param flush is not used, removed
  async __disconnect__(): Promise<void> {
    await this.yieldLoop();
    clearInterval(this.heartbeat);
    return Promise.resolve();
  }

  yieldLoop(t = 0): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, t);
    });
  }

  computePenalty(): number {
    return this.storeOptions.penalty ?? (15 * this.storeOptions.minTime || 5000);
  }

  async __updateSettings__(options: LocalStoreOptions): Promise<boolean> {
    await this.yieldLoop();
    overwrite(options, options, this.storeOptions);
    this._startHeartbeat();
    this.instance._drainAll(this.computeCapacity());
    // TODO: Check if it needs to return true
    return true;
  }

  async __running__(): Promise<number> {
    await this.yieldLoop();
    return this._running;
  }

  async __queued__(): Promise<any> {
    await this.yieldLoop();
    return this.instance._queued;
  }

  async __done__(): Promise<number> {
    await this.yieldLoop();
    return this._done;
  }

  async __groupCheck__(time: number): Promise<boolean> {
    await this.yieldLoop();
    return this._unblockTime <= time;
  }

  computeCapacity(): number | null {
    // TODO: Check types
    const { maxConcurrent, reservoir } = this.storeOptions;
    if (maxConcurrent != null && reservoir != null) {
      return Math.min(maxConcurrent - this._running - reservoir);
    } else if (maxConcurrent) {
      return maxConcurrent - this._running;
    } else if (reservoir) {
      return reservoir;
    } else {
      return null;
    }
  }

  conditionsCheck(weight: number): boolean {
    const capacity = this.computeCapacity();
    return capacity == null || weight <= capacity;
  }

  async __incrementReservoir__(incr: number): Promise<any> {
    await this.yieldLoop();
    this.storeOptions.reservoir += incr;
    this.instance._drainAll(this.computeCapacity());
    return this.storeOptions.reservoir;
  }

  async __currentReservoir__(): Promise<any> {
    await this.yieldLoop();
    return this.storeOptions.reservoir;
  }

  isBlocked(now: number): boolean {
    return this._unblockTime >= now;
  }

  check(weight: number, now: number): boolean {
    return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
  }

  async __check__(weight: number): Promise<boolean> {
    await this.yieldLoop();
    const now = Date.now();
    return this.check(weight, now);
  }

  // TODO: DONE: Params index, weight and expiration not used, removed
  async __register__(
    index: string,
    weight: number,
    expiration: number
  ): Promise<RegistrationResult> {
    let result: RegistrationResult;
    await this.yieldLoop();
    const now = Date.now();
    if (this.conditionsCheck(weight)) {
      this._running += weight;
      if (this.storeOptions.reservoir != null) {
        this.storeOptions.reservoir -= weight;
      }
      const wait = Math.max(this._nextRequest - now, 0);
      this._nextRequest = now + wait + this.storeOptions.minTime;
      result = { success: true, wait: wait, reservoir: this.storeOptions.reservoir };
    } else {
      result = { success: false };
    }

    return result;
  }

  strategyIsBlocked(): boolean {
    return this.storeOptions.strategy == 3;
  }

  async __submit__(queueLength: number, weight: number): Promise<SubmissionResult> {
    await this.yieldLoop();
    if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
      throw new BottleneckError(
        `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`
      );
    }

    const now = Date.now();
    const reachedHWM =
      this.storeOptions.highWater != null &&
      queueLength == this.storeOptions.highWater &&
      !this.check(weight, now);
    const blocked = this.strategyIsBlocked() && (reachedHWM || this.isBlocked(now));
    if (blocked) {
      this._unblockTime = now + this.computePenalty();
      this._nextRequest = this._unblockTime + this.storeOptions.minTime;
      this.instance._dropAllQueued();
    }

    const result: SubmissionResult = {
      reachedHWM: reachedHWM,
      blocked: blocked,
      strategy: this.storeOptions.strategy,
    };
    return result;
  }

  // TODO: DONE: Param index not used, removed
  async __free__(weight: number): Promise<FreeResult> {
    await this.yieldLoop();
    this._running -= weight;
    this._done += weight;
    this.instance._drainAll(this.computeCapacity());

    const result: FreeResult = { running: this._running };
    return result;
  }

  //-------------------- GETTERS --------------------
  public get _ready(): Promise<void> {
    return this.ready;
  }

  public get _clients(): any {
    return this.clients;
  }

  public get _clientId(): number {
    return this.clientId;
  }

  public get _heartbeat(): any {
    return this.heartbeat;
  }
}
