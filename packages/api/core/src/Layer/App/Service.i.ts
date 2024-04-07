/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Links } from '@mdf.js/crash';
import { Router } from 'express';
import { Registry } from 'prom-client';
import { Resource } from './Resource.i';

/**
 * A service is a special kind of resource that besides {@link Resource} properties, it could offer:
 * - Its own REST API endpoints, using an express router, to expose details about service, this
 * endpoints will be exposed under the observability paths.
 * - A links property to define the endpoints that the service expose, this information will be
 * exposed in the observability paths.
 * - A metrics property to expose the metrics of the service, this registry will be merged with the
 * global metrics registry.
 */
export interface Service extends Resource {
  /** Express router */
  router?: Router;
  /** Service base path */
  links?: Links;
  /** Get the metrics registry */
  metrics?: Registry;
}
