/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { State } from '.';
import { Port } from '../Port';
import { ProviderState } from '../types';
import { ErrorState } from './Error';
import { RunningState } from './Running';

/**
 * Provider Stopped state
 * @category State
 * @public
 */
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
    private readonly instance: Port<any, any>,
    private readonly changeState: (newState: State) => void,
    private readonly manageError: (error: unknown) => void
  ) {
    this.instance.once('unhealthy', this.errorEventHandler);
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
  /** Clean event handlers for error state */
  private cleanEventHandlers(): void {
    this.instance.off('unhealthy', this.errorEventHandler);
  }
}
