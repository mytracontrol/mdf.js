/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { GroupOptions } from '.';

/** Default values for Group */
export const GROUP_DEFAULTS: GroupOptions = {
  timeout: 1000 * 60 * 5,
  connection: null,
  id: 'group-key',
};
