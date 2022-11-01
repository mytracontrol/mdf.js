/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Crash } from '@mdf.js/crash';
import { State } from '.';
import { AnyWrappedPort, ProviderState } from '../../types';
import { ErrorState } from './Error';
import { RunningState } from './Running';

/** Stopped state */
export class StoppedState implements State {
  /** Actual provider state */
  public readonly state: ProviderState = 'stopped';
  /** Handler for disconnected or unhealthy events */
  private readonly errorEventHandler = (error: Crash | Error): Promise<void> => this.fail(error);
  /**
   * Create a instance of the stopped instance
   * @param instance - Port instance
   * @param changeState - Provider state change function
   * @param manageError - Provider error management function function
   */
  constructor(
    private instance: AnyWrappedPort,
    private changeState: (newState: State) => void,
    private manageError: (error: unknown) => void
  ) {
    this.instance.once('error', this.errorEventHandler);
  }
  /** Stop the process: internal jobs, external dependencies connections ... */
  public async stop(): Promise<void> {
    try {
      await this.instance.stop();
    } catch (error) {
      await this.fail(Crash.from(error));
      throw error;
    }
  }
  /** Initialize the process: internal jobs, external dependencies connections ... */
  public async start(): Promise<void> {
    this.cleanEventHandlers();
    try {
      await this.instance.start();
    } catch (error) {
      await this.fail(Crash.from(error));
      throw error;
    }
    this.changeState(new RunningState(this.instance, this.changeState, this.manageError));
  }
  /**
   * Go to error state: waiting for new state o auto-fix de the problems
   * @param error - incoming error from provider
   */
  public async fail(error: Crash | Error): Promise<void> {
    this.cleanEventHandlers();
    this.manageError(error);
    this.changeState(new ErrorState(this.instance, this.changeState, this.manageError));
  }
  /** Pause the process: pause internal jobs */
  public async pause(): Promise<void> {
    await this.stop();
  }
  /** Resume the process: resume internal jobs */
  public async resume(): Promise<void> {
    await this.start();
  }
  /** Clean event handlers for error state */
  private cleanEventHandlers(): void {
    this.instance.off('error', this.errorEventHandler);
  }
}
