/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */
import CorsModule from 'cors';
import { RequestHandler } from 'express';
import { CorsConfig } from './CorsConfig.i';

/** CorsManagement class manages the API request CORS */
export class Cors {
  /** Flag that indicates that CORS is enabled */
  readonly #enable: boolean;
  /** CORS configuration */
  readonly #config?: CorsConfig;
  /** CORS Options */
  readonly #corsOptions: CorsModule.CorsOptions = {};
  /** Cors middleware */
  readonly #corsModule: RequestHandler;
  /** Origin whitelist */
  readonly #whitelist: (string | RegExp)[] = [];
  /** Return a cors handler middleware instance */
  public static handler(configuration?: CorsConfig): RequestHandler {
    return new Cors(configuration).handler;
  }
  /** Return a cors handler middleware instance */
  private get handler(): RequestHandler {
    return this.#corsModule;
  }
  /**
   * Create an instance of CorsManagement
   * @param configuration - CORS Configuration
   */
  private constructor(configuration?: CorsConfig) {
    this.#config = configuration;
    this.#enable = this.#config && this.#config.enabled === false ? false : true;
    // *****************************************************************************************
    // #region Cors options
    this.#corsOptions.methods = this.#config?.methods;
    this.#corsOptions.allowedHeaders = this.#config?.allowHeaders;
    this.#corsOptions.exposedHeaders = this.#config?.exposedHeaders;
    this.#corsOptions.credentials = this.#config?.credentials;
    this.#corsOptions.maxAge = this.#config?.maxAge;
    this.#corsOptions.preflightContinue = this.#config?.preflightContinue;
    this.#corsOptions.optionsSuccessStatus = this.#config?.optionsSuccessStatus;

    this.#whitelist = this.adaptWhiteList(this.#config?.whitelist);
    if (!this.#enable) {
      this.#corsOptions.origin = false;
    } else if (!this.#config?.whitelist) {
      this.#corsOptions.origin = true;
    } else if (!this.#config?.allowAppClients) {
      this.#corsOptions.origin = this.#whitelist;
    } else {
      this.#corsOptions.origin = this.originFilter;
    }
    this.#corsModule = CorsModule(this.#corsOptions);
  }
  /**
   * Adapt the whitelist parameter to the CORS module
   * @param whitelist - Whitelist of allowed dominio
   */
  private adaptWhiteList(whitelist?: string | (string | RegExp)[]): (string | RegExp)[] {
    if (!whitelist) {
      return [new RegExp(/.*/)];
    } else if (typeof whitelist === 'string') {
      if (whitelist === '*') {
        return [new RegExp(/.*/)];
      } else {
        return [whitelist];
      }
    } else {
      return whitelist;
    }
  }
  /**
   * Handle a request to define if it allowed by the CORS configuration
   * @param requestOrigin - request to analyze
   * @param callback - callback to define if the request is allowed or not
   */
  private readonly originFilter = (
    requestOrigin: string | undefined,
    callback: (err: Error | null, allow: boolean) => void
  ): void => {
    let regexMatch = false;
    if (!requestOrigin || this.#whitelist.indexOf(requestOrigin) !== -1) {
      callback(null, true);
    } else {
      this.#whitelist.forEach(allowedOrigin => {
        if (allowedOrigin instanceof RegExp && !regexMatch) {
          regexMatch = allowedOrigin.test(requestOrigin);
        }
      });
      if (regexMatch) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  };
}
