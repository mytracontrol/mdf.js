/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { State } from '.';
import { AnyWrappedPort, ProviderState } from '../types';
import { RunningState } from './Running';
import { StoppedState } from './Stopped';

/**
 * Provider Error state
 * @category State
 * @public
 */
export class ErrorState implements State {
  /** Actual provider state */
  public readonly state: ProviderState = 'error';
  /** Handler for disconnected or unhealthy events */
  private readonly errorEventHandler = (error: Crash | Error): Promise<void> => this.fail(error);
  /** Handler for auto-fix events */
  private readonly fixedEventHandler = (): Promise<void> => this.start();
  /** Handler for close event */
  private readonly closeEventHandler = (): Promise<void> => this.stop();
  /**
   * Create a instance of the error instance
   * @param instance - Port instance
   * @param changeState - Provider state change function
   * @param manageError - Provider error management function function
   */
  constructor(
    private readonly instance: AnyWrappedPort,
    private readonly changeState: (newState: State) => void,
    private readonly manageError: (error: unknown) => void
  ) {
    this.instance.on('unhealthy', this.errorEventHandler);
    this.instance.once('closed', this.closeEventHandler);
    this.instance.once('healthy', this.fixedEventHandler);
  }
  /** Stop the process: internal jobs, external dependencies connections ... */
  public async stop(): Promise<void> {
    this.cleanEventHandlers();
    try {
      await this.instance.stop();
    } catch (error) {
      await this.fail(Crash.from(error));
      throw error;
    }
    this.changeState(new StoppedState(this.instance, this.changeState, this.manageError));
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
    this.manageError(error);
  }
  /** Clean event handlers for error state */
  public cleanEventHandlers(): void {
    this.instance.off('unhealthy', this.errorEventHandler);
    this.instance.off('closed', this.closeEventHandler);
    this.instance.off('healthy', this.fixedEventHandler);
  }
}
