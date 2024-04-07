/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import * as Sink from '../Sink';
import * as Source from '../Source';
import {
  FirehoseOptions,
  Plugs,
  Sinks,
  Sources,
  WrappableSinkPlug,
  WrappableSourcePlug,
} from '../types';

export class Helpers {
  /**
   * Check if a source is a valid Flow Source
   * @param source - source to be checked
   * @returns
   */
  public static IsFlowSource<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(
    source: WrappableSourcePlug
  ): source is Plugs.Source.Flow<Type, Data, CustomHeaders, CustomOptions> {
    return (
      typeof source.postConsume === 'function' &&
      typeof source.ingestData === 'undefined' &&
      typeof source.init === 'function' &&
      typeof source.pause === 'function'
    );
  }
  /**
   * Check if a source is a valid Sequence Source
   * @param source - source to be checked
   * @returns
   */
  public static IsSequenceSource<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(
    source: WrappableSourcePlug
  ): source is Plugs.Source.Sequence<Type, Data, CustomHeaders, CustomOptions> {
    return typeof source.postConsume === 'function' && typeof source.ingestData === 'function';
  }
  /**
   * Check if a source is a valid Credit Flow Source
   * @param source - source to be checked
   * @returns
   */
  public static IsCreditsFlowSource<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(
    source: WrappableSourcePlug
  ): source is Plugs.Source.CreditsFlow<Type, Data, CustomHeaders, CustomOptions> {
    return typeof source.postConsume === 'function' && typeof source.addCredits === 'function';
  }
  /**
   * Check if a sink is a valid Tap Sink
   * @param sink - sink to be checked
   * @returns
   */
  public static IsTapSink<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(sink: WrappableSinkPlug): sink is Plugs.Sink.Tap<Type, Data, CustomHeaders, CustomOptions> {
    return typeof sink.single === 'function' && typeof sink.multi === 'undefined';
  }
  /**
   * Check if a sink is a valid Jet Sink
   * @param sink - sink to be checked
   * @returns
   */
  public static IsJetSink<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(sink: WrappableSinkPlug): sink is Plugs.Sink.Jet<Type, Data, CustomHeaders, CustomOptions> {
    return typeof sink.multi === 'function' && typeof sink.single === 'function';
  }
  /**
   * Create source streams from source plugs
   * @param sources - Source plugs to be processed
   * @param qos - indicates the quality of service for the job, indeed this indicate the number of
   * sinks that must be successfully processed to consider the job as successfully processed
   * @returns
   */
  public static GetSourceStreamsFromPlugs<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(
    sources: Plugs.Source.Any<Type, Data, CustomHeaders, CustomOptions>[],
    options: FirehoseOptions<Type, Data, CustomHeaders, CustomOptions>,
    qos = 1
  ): Sources[] {
    const sourceStreams: Sources[] = [];
    for (const source of sources) {
      if (Helpers.IsFlowSource(source)) {
        sourceStreams.push(
          new Source.Flow(source, {
            retryOptions: options.retryOptions,
            qos,
            readableOptions: { highWaterMark: options.bufferSize },
            postConsumeOptions: options.postConsumeOptions,
            logger: options.logger,
          })
        );
      } else if (Helpers.IsSequenceSource(source)) {
        sourceStreams.push(
          new Source.Sequence(source, {
            retryOptions: options.retryOptions,
            qos,
            readableOptions: { highWaterMark: options.bufferSize },
            postConsumeOptions: options.postConsumeOptions,
            logger: options.logger,
          })
        );
      } else if (Helpers.IsCreditsFlowSource(source)) {
        sourceStreams.push(
          new Source.CreditsFlow(source, {
            retryOptions: options.retryOptions,
            qos,
            readableOptions: { highWaterMark: options.bufferSize },
            postConsumeOptions: options.postConsumeOptions,
            logger: options.logger,
          })
        );
      } else {
        throw new Crash(`Source type not supported`);
      }
    }
    return sourceStreams;
  }
  /**
   * Create sinks streams from sink plugs
   * @param sinks - Sinks plugs to be processed
   * @returns
   */
  public static GetSinkStreamsFromPlugs<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >(
    sinks: Plugs.Sink.Any<Type, Data, CustomHeaders, CustomOptions>[],
    options: FirehoseOptions<Type, Data, CustomHeaders, CustomOptions>
  ): Sinks[] {
    const sinkStreams: Sinks[] = [];
    for (const sink of sinks) {
      if (Helpers.IsJetSink(sink)) {
        sinkStreams.push(
          new Sink.Jet(sink, {
            retryOptions: options.retryOptions,
            writableOptions: { highWaterMark: options.bufferSize },
            logger: options.logger,
          })
        );
      } else if (Helpers.IsTapSink(sink)) {
        sinkStreams.push(
          new Sink.Tap(sink, {
            retryOptions: options.retryOptions,
            writableOptions: { highWaterMark: options.bufferSize },
            logger: options.logger,
          })
        );
      } else {
        throw new Crash(`Sink type not supported`);
      }
    }
    return sinkStreams;
  }
}
