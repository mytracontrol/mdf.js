import { Events } from '../events/Events';
import { load } from '../parser/Parser';
import { BATCHER_DEFAULTS } from './Batcher.constants';
import { BatcherOptions, BatcherOptionsComplete } from './Batcher.interfaces';

export class Batcher<Data> {
  private _arr: Data[] = [];
  private _events: Events;
  private _timeout: NodeJS.Timeout | undefined;
  private _promise: Promise<void> | undefined;
  private _resolve: (() => void) | undefined;
  // private _promise: any;
  // private _resolve: any;

  // Batcher options
  private _batcherOptions: BatcherOptionsComplete;
  private _maxSize: number | null;
  private _maxTime: number | null;

  // TODO: What for?
  private _lastFlush: number;

  // Event listeners
  public on: any;
  public once: any;
  public removeAllListeners: any;

  constructor(options: BatcherOptions = {}) {
    /** Initialize batcher options */
    this._batcherOptions = load(options, BATCHER_DEFAULTS, {}) as BatcherOptionsComplete;
    this._maxSize = this._batcherOptions.maxSize;
    this._maxTime = this._batcherOptions.maxTime;

    /** Initialize event listeners */
    this._resetPromise();

    this._lastFlush = Date.now();

    /** Initialize event listeners */
    this.on = null;
    this.once = null;
    this.removeAllListeners = null;
    this._events = new Events(this);
  }

  private _resetPromise(): void {
    this._promise = new Promise<void>((res, rej) => {
      return (this._resolve = res);
    });
  }

  private _flush = (): void => {
    clearTimeout(this._timeout);
    this._lastFlush = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._resolve!();

    this._events.trigger('batch', this._arr);
    this._arr = [];
    this._resetPromise();
  };

  public add(data: Data): Promise<void> {
    this._arr.push(data);
    const ret = this._promise;

    if (this._arr.length === this._maxSize) {
      this._flush();
    } else if (this._maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(this._flush, this._maxTime);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return ret!;
  }
}
