/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    source: WrappableSourcePlug<Type, Data, CustomHeaders>
  ): source is Plugs.Source.Flow<Type, Data, CustomHeaders> {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    source: WrappableSourcePlug<Type, Data, CustomHeaders>
  ): source is Plugs.Source.Sequence<Type, Data, CustomHeaders> {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    source: WrappableSourcePlug<Type, Data, CustomHeaders>
  ): source is Plugs.Source.CreditsFlow<Type, Data, CustomHeaders> {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    sink: WrappableSinkPlug<Type, Data, CustomHeaders>
  ): sink is Plugs.Sink.Tap<Type, Data, CustomHeaders> {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    sink: WrappableSinkPlug<Type, Data, CustomHeaders>
  ): sink is Plugs.Sink.Jet<Type, Data, CustomHeaders> {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    sources: Plugs.Source.Any<Type, Data, CustomHeaders>[],
    options: FirehoseOptions<Type, Data, CustomHeaders>,
    qos = 1
  ): Sources<Type, Data, CustomHeaders>[] {
    const sourceStreams: Sources<Type, Data, CustomHeaders>[] = [];
    for (const source of sources) {
      if (Helpers.IsFlowSource(source)) {
        sourceStreams.push(
          new Source.Flow<Type, Data, CustomHeaders>(source, {
            retryOptions: options.retryOptions,
            qos,
            readableOptions: { highWaterMark: options.bufferSize },
            postConsumeOptions: options.postConsumeOptions,
            logger: options.logger,
          })
        );
      } else if (Helpers.IsSequenceSource(source)) {
        sourceStreams.push(
          new Source.Sequence<Type, Data, CustomHeaders>(source, {
            retryOptions: options.retryOptions,
            qos,
            readableOptions: { highWaterMark: options.bufferSize },
            postConsumeOptions: options.postConsumeOptions,
            logger: options.logger,
          })
        );
      } else if (Helpers.IsCreditsFlowSource(source)) {
        sourceStreams.push(
          new Source.CreditsFlow<Type, Data, CustomHeaders>(source, {
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
    CustomHeaders extends Record<string, any> = Record<string, any>
  >(
    sinks: Plugs.Sink.Any<Type, Data, CustomHeaders>[],
    options: FirehoseOptions<Type, Data, CustomHeaders>
  ): Sinks<Type, Data, CustomHeaders>[] {
    const sinkStreams: Sinks<Type, Data, CustomHeaders>[] = [];
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
