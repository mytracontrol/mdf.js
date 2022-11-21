/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Multi } from '@mdf.js/crash';
import { EventEmitter } from 'events';
import { v4, v5 } from 'uuid';
import { MDF_NAMESPACE_OID } from '../const';
import { Headers, JobObject, Options, Result, Status } from './types';

/**
 * JobHandler events
 * @category @mdf.js/core
 */
export declare interface JobHandler<Type, Data> {
  /** Emitted when a job has ended */
  on(event: 'done', listener: (uuid: string, result: Result<Type>, error?: Multi) => void): this;
}

export class JobHandler<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, unknown> = Record<string, unknown>
  >
  extends EventEmitter
  implements JobObject<Type, Data, CustomHeaders>
{
  /** Job processing identification */
  public readonly uuid: string;
  /** Date object with the timestamp when the job was created */
  public readonly createdAt: Date;
  /** Job meta information, used to pass specific information for sinks and sources */
  public readonly headers: Headers<CustomHeaders>;
  /** Date object with the timestamp when the job was resolved */
  private resolvedAt?: Date;
  /** Job processing status */
  private _status: Status = Status.PENDING;
  /** Error raised during job processing */
  private _errors?: Multi;
  /** Job payload */
  private _data: Data;
  /** Pending confirmation */
  private pendingDone: number;
  /**
   * Create a new instance of JobHandler
   * @param data - Job payload
   * @param jobId - Job identifier, defined by the user
   * @param type - Job type, used as selector for strategies
   * @param options - JobHandler options
   */
  constructor(
    data: Data,
    public readonly jobId: string,
    public readonly type: Type,
    options?: Options<CustomHeaders>
  ) {
    super();
    if (typeof jobId !== 'string') {
      throw new Crash(
        'Error creating a valid JobHandler, JobId is mandatory and must be a string',
        v4(),
        { name: 'ValidationError' }
      );
    }
    this.uuid = v5(this.jobId, MDF_NAMESPACE_OID);
    if (data === undefined || data === null) {
      throw new Crash('Error creating a valid JobHandler, data is mandatory', this.uuid, {
        name: 'ValidationError',
      });
    }
    this._data = data;
    if (typeof type !== 'string') {
      throw new Crash('Error creating a valid JobHandler, type must be a string', this.uuid, {
        name: 'ValidationError',
      });
    }
    if (options && typeof options !== 'object') {
      throw new Crash('Error creating a valid JobHandler, options should be a object', v4(), {
        name: 'ValidationError',
      });
    }
    this.createdAt = new Date();
    this.pendingDone = options?.qos || 1;
    this.headers = options?.headers || ({} as Headers<CustomHeaders>);
  }
  /** Job payload */
  public get data(): Data {
    this.updateStatusToProcessing();
    return this._data;
  }
  public set data(value: Data) {
    this.updateStatusToProcessing();
    this._data = value;
  }
  /** True if the job task raised any error */
  public get hasErrors(): boolean {
    if (this._errors) {
      return true;
    } else {
      return false;
    }
  }
  /** Errors raised during the job */
  public get errors(): Multi | undefined {
    return this._errors;
  }
  /** Return the process time in msec */
  public get processTime(): number {
    if (this.resolvedAt) {
      return this.resolvedAt.getTime() - this.createdAt.getTime();
    } else {
      return -1;
    }
  }
  /** Return the job processing status */
  public get status(): Status {
    return this._status;
  }
  /**
   * Add a new error in the job
   * @param error - error to be added to the job
   */
  public addError(error: Crash | Multi): void {
    if (this._errors) {
      this._errors.push(error);
    } else {
      this._errors = new Multi('Errors in job processing', this.uuid, {
        name: 'ValidationError',
        causes: error,
      });
    }
    this.updateStatusToProcessing();
  }
  /**
   * Notify the results of the process
   * @param error - conditional parameter for error notification
   */
  public done(error?: Crash): void {
    this.pendingDone--;
    if (error) {
      this.addError(error);
    }
    if (this.pendingDone <= 0 && !this.resolvedAt) {
      this.resolvedAt = new Date();
      if (this.hasErrors) {
        this._status = Status.FAILED;
      } else {
        this._status = Status.COMPLETED;
      }
      this.emit('done', this.uuid, this.result(), this._errors);
    }
  }
  /** Return the result of the publication process */
  public result(): Result<Type> {
    return {
      id: this.uuid,
      createdAt: this.createdAt.toISOString(),
      resolvedAt: this.resolvedAt?.toISOString() || '',
      quantity: Array.isArray(this._data) ? this._data.length : 1,
      hasErrors: this._errors ? this._errors.size > 0 : false,
      errors: this._errors ? this._errors.toJSON() : undefined,
      jobId: this.jobId,
      type: this.type,
      status: this._status,
    };
  }
  /** Return an object with the key information of the job, this information is used by the plugs */
  public toObject(): JobObject<Type, Data, CustomHeaders> {
    return {
      data: this.data,
      type: this.type,
      jobId: this.jobId,
      status: this._status,
      headers: this.headers,
    };
  }
  /** Update the job status to processing if it is in pending state */
  private updateStatusToProcessing(): void {
    if (this._status === Status.PENDING) {
      this._status = Status.PROCESSING;
    }
  }
}
