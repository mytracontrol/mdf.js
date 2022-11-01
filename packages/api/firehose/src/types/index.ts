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

export * from './FirehoseOptions.i';
export * as Plugs from './Plugs';
export * from './PostConsumeOptions.i';
export * from './SourceOptions.i';
export * from './WrappableSinkPlug.i';
export * from './WrappableSourcePlug.i';

import * as Sink from '../Sink';
import * as Source from '../Source';

export type Sinks = Sink.Jet | Sink.Tap;
export type Sources = Source.Flow | Source.Sequence;
