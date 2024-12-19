/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Keygen } from './Keygen';
import type { KeygenOptions } from './types'; // Adjust the import path as necessary

describe('#FileFlinger #Keygen', () => {
  describe('#Happy path', () => {
    it('Should generate key with default patterns and values', () => {
      // Initialize Keygen with default options
      const keygen = new Keygen();
      // Generate key for a sample file
      const key = keygen.generateKey('/path/to/myfile.txt');
      // Expect the key to be the filename without extension
      expect(key).toBe('myfile');
    });
    it('Should generate key with custom key pattern and file pattern', () => {
      // Define custom options
      const options: KeygenOptions = {
        filePattern: '{sensor}_{measurement}_{date}.jsonl',
        keyPattern: '{sensor}/{measurement}/{date}',
      };
      // Initialize Keygen with custom options
      const keygen = new Keygen(options);
      // Generate key for a sample file matching the pattern
      const key = keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
      // Expect the key to match the pattern with correct values
      expect(key).toBe('sensor1/temperature/2023-10-24');
    });
    it('Should apply default values when placeholders are missing', () => {
      // Define options with default values
      const options: KeygenOptions = {
        filePattern: '{sensor}_{measurement}_{date}.jsonl',
        keyPattern: '{sensor}/{measurement}/{date}/{location}',
        defaultValues: { location: 'defaultLocation' },
      };
      // Initialize Keygen with options
      const keygen = new Keygen(options);
      // Generate key for a sample file
      const key = keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
      // Expect the key to include the default location
      expect(key).toBe('sensor1/temperature/2023-10-24/defaultLocation');
    });
    it('Should generate key with date placeholders', () => {
      // Define options using date placeholders
      const options: KeygenOptions = {
        filePattern: '{sensor}_{measurement}.jsonl',
        keyPattern: '{sensor}/{measurement}/{_year}/{_month}/{_day}',
      };
      // Initialize Keygen
      const keygen = new Keygen(options);
      // Generate key for a sample file
      const key = keygen.generateKey('/path/to/sensor1_temperature.jsonl');
      // Get current date components
      const date = new Date();
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      // Expect the key to include the correct date components
      expect(key).toBe(`sensor1/temperature/${year}/${month}/${day}`);
    });
  });
  describe('#Sad path', () => {
    it('Should throw error when filename does not match pattern', () => {
      // Define options with a specific file pattern
      const options: KeygenOptions = {
        filePattern: '{sensor}_{measurement}_{date}.jsonl',
      };
      // Initialize Keygen
      const keygen = new Keygen(options);
      // Attempt to generate key with an invalid filename
      expect(() => {
        keygen.generateKey('/path/to/invalid_filename.jsonl');
      }).toThrow(/does not match the pattern/);
    });
    it('Should include unknown placeholders in the key when not found in values', () => {
      // Define options with a placeholder that is not in values
      const options: KeygenOptions = {
        filePattern: '{sensor}_{measurement}_{date}.jsonl',
        keyPattern: '{sensor}/{measurement}/{date}/{unknown}',
      };
      // Initialize Keygen
      const keygen = new Keygen(options);
      // Generate key
      expect(() => {
        keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
      }).toThrow(
        `Error generating a key based on pattern [{sensor}/{measurement}/{date}/{unknown}] for file [sensor1_temperature_2023-10-24.jsonl]: Placeholder [unknown] not found in values`
      );
    });
  });
});
