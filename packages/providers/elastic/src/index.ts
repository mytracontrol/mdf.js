/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Elastic Provider.
 * As the rest of the providers, it is a wrapper around a third party library. The only exported
 * item is namespace `Elastic` which contains the provider factory, besides some useful types to
 * manage the provider.
 *
 * This means that the provider is not directly available, but it must be created using the factory
 * function.
 *
 * @example
 * ```typescript
 * import { Elastic } from '@mdf.js/elastic-provider';
 * const provider = Elastic.Factory.create();
 * ```
 * `create` function accepts a configuration object as parameter, which is used to configure the
 * provider. This configuration object is a {@link "@mdf.js/core" | Layer.Provider.FactoryOptions}
 * object, which is a generic object that can be extended to add provider specific configuration
 * options.
 *
 * In this case, the configuration object is a {@link Config} object, which is a type exported by
 * the provider. This object is a {@link ClientOptions} object, which is a type exported by the
 * third party library.
 *
 * This means that our {@link FactoryOptions} object has the next structure:
 * @inheritdoc FactoryOptions
 *
 * @example
 */
export * as Elastic from './provider';
