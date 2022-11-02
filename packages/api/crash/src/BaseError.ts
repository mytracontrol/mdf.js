/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4, validate } from 'uuid';
import { CONFIG_MAX_ERROR_MESSAGE_LENGTH } from './const';
import { BaseObject, BaseOptions } from './types';
/** Class Base, manages errors in Netin Systems */
export class Base extends Error {
  /** Base error options */
  protected _options?: BaseOptions;
  /** uuid error identifier */
  protected _uuid: string;
  /** Error name (type) */
  public override name = 'BaseError';
  /** Error date */
  public date: Date;
  /** Error subject, `'common'` as default */
  public subject: string;
  /**
   * Create a new Base error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   * @param options - enhanced error options
   */
  constructor(message: string, uuid?: string | BaseOptions, options?: BaseOptions) {
    super(message);
    this.message = this.isSafeMessage(message, uuid);
    this._uuid = this.isSafeId(uuid);
    this._options = this.isSafeOptions(options || uuid);
    this.name = this.isSafeName(this._options?.name);
    this.date = this.isSafeDate(this._options?.info?.date);
    this.subject = this.isSafeSubject(this._options?.info?.subject);
    // #endregion
    Error.captureStackTrace(this, this.constructor);
  }
  /** Return the info object for this error */
  get info(): Record<string, unknown> | undefined {
    return this.parseInfo();
  }
  /** Return the unique identifier associated to this instance */
  get uuid(): string {
    return this._uuid;
  }
  /** Return a string formatted as `name:message` */
  public override toString(): string {
    return `${this.name}: ${this.message}`;
  }
  /** Return Base error in JSON format */
  protected toObject(): BaseObject {
    return {
      name: this.name,
      message: this.message,
      uuid: this._uuid,
      timestamp: this.date.toISOString(),
      subject: this.subject,
      info: this.parseInfo(),
    };
  }
  /**
   * Clean the info object in order to main only values that are not included in the rest of fields
   */
  private parseInfo(): Record<string, unknown> | undefined {
    if (!this._options?.info) {
      return undefined;
    }
    const info = { ...this._options?.info, date: undefined, subject: undefined };
    if (Object.values(info).every(value => typeof value === 'undefined')) {
      return undefined;
    } else {
      return info;
    }
  }
  /**
   * Check if the message is safe to be setted
   * @param message - human friendly error message
   * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
   * @returns
   */
  private isSafeMessage(message: string, uuid?: string | BaseOptions): string {
    if (typeof message !== 'string') {
      throw new Base('Message parameter must be a string', uuid);
    }
    if (message.length > CONFIG_MAX_ERROR_MESSAGE_LENGTH) {
      message = `${message.substring(0, CONFIG_MAX_ERROR_MESSAGE_LENGTH - 18)} ...too long error`;
    }
    return message;
  }
  /**
   * Check if the passed UUID is valid and safe
   * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
   * @returns
   */
  private isSafeId(uuid?: string | BaseOptions): string {
    if (typeof uuid === 'string' && validate(uuid)) {
      return uuid;
    } else if (typeof uuid === 'object' && !Array.isArray(uuid)) {
      return v4();
    } else if (typeof uuid === 'undefined') {
      return v4();
    } else {
      throw new Base('uuid parameter must be an string and RFC 4122 based', v4());
    }
  }
  /**
   * Check if the passed options are valid and safe
   * @param options - options to be setted
   * @returns
   */
  private isSafeOptions(options?: string | BaseOptions): BaseOptions | undefined {
    if (typeof options === 'object' && !Array.isArray(options)) {
      return options;
    } else if (['string', 'undefined'].includes(typeof options)) {
      return undefined;
    } else {
      throw new Base('options parameter must be an object', v4());
    }
  }
  /**
   * Check if the name, passed in options, is valid and safe
   * @param name - name of the error, used as category name
   * @returns
   */
  private isSafeName(name?: string): string {
    if (typeof name === 'string') {
      return name;
    } else if (typeof name !== 'undefined') {
      throw new Base('Option Parameter name must a string', this._uuid);
    } else {
      return this.name;
    }
  }
  /**
   * Check if the date, passed in options, is valid and safe
   * @param date - date of the error
   * @returns
   */
  private isSafeDate(date?: Date): Date {
    if (date instanceof Date) {
      return date;
    } else if (typeof date !== 'undefined') {
      throw new Base('Option Parameter info.date, if its setted, must be a Date', this._uuid);
    } else {
      return new Date();
    }
  }
  /**
   * Check if the subject, passed in options, is valid and safe
   * @param subject - subject of the error, `'common' as default`
   * @returns
   */
  private isSafeSubject(subject?: string): string {
    if (typeof subject === 'string') {
      return subject;
    } else if (typeof subject !== 'undefined') {
      throw new Base(
        'Option Parameter info.subject, if it is setted, must be a string',
        this._uuid
      );
    } else {
      return 'common';
    }
  }
}
