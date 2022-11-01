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
import { Crash } from '@mdf/crash';
import { State } from '.';
import { AnyWrappedPort, ProviderState } from '../../types';
import { RunningState } from './Running';
import { StoppedState } from './Stopped';

/** Stopped state */
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
    private instance: AnyWrappedPort,
    private changeState: (newState: State) => void,
    private manageError: (error: unknown) => void
  ) {
    this.instance.on('error', this.errorEventHandler);
    this.instance.on('unhealthy', this.errorEventHandler);
    this.instance.once('closed', this.closeEventHandler);
    this.instance.once('healthy', this.fixedEventHandler);
    this.instance.once('ready', this.fixedEventHandler);
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
  /** Pause the process: pause internal jobs */
  public async pause(): Promise<void> {
    await this.stop();
  }
  /** Resume the process: resume internal jobs */
  public async resume(): Promise<void> {
    await this.start();
  }
  /** Clean event handlers for error state */
  public cleanEventHandlers(): void {
    this.instance.off('error', this.errorEventHandler);
    this.instance.off('unhealthy', this.errorEventHandler);
    this.instance.off('closed', this.closeEventHandler);
    this.instance.off('healthy', this.fixedEventHandler);
    this.instance.off('ready', this.fixedEventHandler);
  }
}
