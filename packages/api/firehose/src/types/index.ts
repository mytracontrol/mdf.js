/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export * from './EngineOptions.i';
export * from './FirehoseOptions.i';
export * as Plugs from './Plugs';
export * from './PostConsumeOptions.i';
export * from './SinkOptions.i';
export * from './SourceOptions.i';
export * from './WrappableSinkPlug.i';
export * from './WrappableSourcePlug.i';

import * as Sink from '../Sink';
import * as Source from '../Source';

export * from './OpenJobs.t';

export type Sinks = Sink.Jet | Sink.Tap;
export type Sources = Source.Flow | Source.Sequence | Source.CreditsFlow;
