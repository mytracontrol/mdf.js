/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Component, Resource, Service } from './App';
import { Manager } from './Provider';

export * as App from './App';
export * as Provider from './Provider';

/** Represents an observable entity that can be monitored. */
export type Observable = Manager<any, any, any> | Component | Resource | Service;
