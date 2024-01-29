/**
 * Copyright 2023 Netin Systems S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin Systems S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin Systems S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin Systems S.L.
 */

import fs from 'fs';
import * as glob from 'glob';
import path from 'path';
import { remark } from 'remark';
import remarkGFM from 'remark-gfm';
import remarkLint from 'remark-lint';
import remarkLintUnorderedListMarkerStyle from 'remark-lint-unordered-list-marker-style';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkToc from 'remark-toc';

/**
 * This script is used to prepare the artifacts for the distribution.
 * It will generate an artifact for each each application in apps folder and will include all the
 * necessary files for official Netin distribution.
 * All the specific files for each application is stored in the apps folder, the rest of the files
 * are stored in the .distribution folder.
 */

const SOURCE_FILES = './src/**/*.ts';
const README_FILE = 'README.md';

// Expresiones regulares para identificar variables de entorno y comentarios
const envVarRegex = /process\.env\[['"](?<varName>[^'"]+)['"]\]/;
const defaultValueRegex = /(default:|@defaultValue) (?<defaultValue>[^,]+)/;

const srcFiles = glob.sync(SOURCE_FILES, {
  nodir: true, ignore: {
    ignored: p => /\.test.ts$/.test(p.name),
  }
});
const variables = [];

for (const file of srcFiles) {
  const fileContent = fs.readFileSync(file, 'utf8');
  const matches = fileContent.match(envVarRegex);
  if (matches) {
    findAllEnvironmentVariablesInFile(fileContent, path.basename(file));
  }
}
// Now we have all the environment variables and their information, we need to update the markdown file
// with the information. For this we need to generate a new level 2 title **Environment variables**,
// overwriting the previous one if exists, and then generate a table with the information of each
// environment variable. We must include in the TOC the new title if it does not exist.
const readmeFile = fs.readFileSync(README_FILE, 'utf8');
const readMeMD = remark()
  .use(remarkParse)
  .use(remarkLint)
  .use(remarkLintUnorderedListMarkerStyle, '-')
  .use(remarkToc)
  .use(remarkGFM)
  .parse(readmeFile);

// We need to find all the nodes between the title **Environment variables** and the next title and remove them
// from the tree, including the title itself. We also need to find the node of the license and next nodes and
// save it to add it later.
findAndRemoveEnvironmentVariablesSection(readMeMD);
if (variables.length > 0) {
  const licenseNodes = findRemoveAndReturnLinceSection(readMeMD);
  const envVariablesNodes = generateListOfEnvironmentVariables(variables);
  readMeMD.children.push(...envVariablesNodes);
  if (licenseNodes) {
    readMeMD.children.push(...licenseNodes);
  }
}
const newReadmeFile = remark()
  .use(remarkParse)
  .use(remarkLint)
  .use(remarkLintUnorderedListMarkerStyle, '-')
  .use(remarkToc)
  .use(remarkGFM)
  .use(remarkStringify, { bullet: '-' })
  .stringify(readMeMD);
fs.writeFileSync(`${README_FILE}`, newReadmeFile);

/**
 * Finds all environment variables in a file and extracts their information.
 *
 * @param {string} fileContent - The content of the file.
 * @param {string} path - The path of the file.
 */
function findAllEnvironmentVariablesInFile(fileContent, path) {
  const lines = fileContent.split('\r\n');
  for (let index = 0; index < lines.length; index++) {
    const matches = lines[index].match(envVarRegex);
    if (matches && matches.groups && matches.groups['varName']) {
      let comment = findUpperCommentInFile(lines, index);
      const defaultValue = getDefaultValueFromComment(comment);
      if (defaultValue) {
        comment = comment.replace(defaultValueRegex, '').trim();
      }
      variables.push({ name: matches.groups['varName'], comment, path, defaultValue });
    }
  }
}
/**
 * Finds the upper comment in a file based on a given index.
 * The comment is always located above the declaration of a constant.
 *
 * @param {string[]} lines - The lines of the file.
 * @param {number} index - The index to start searching from.
 * @returns {string|undefined} - The upper comment or undefined if no comment is found.
 */
function findUpperCommentInFile(lines, index) {
  let endOfComment = 0;
  let startOfComment = 0;
  let comment = undefined;
  if (index < 0) {
    return;
  }
  // Need to find the line where the constant is declared, the comment is always above the declaration
  // the function isConstantDeclaration is used to find the line where the constant is declared
  while (index >= 0) {
    if (isConstantDeclaration(lines[index])) {
      break;
    }
    index--;
  }
  if (index < 0) {
    return;
  }
  // Should check if the upper line has the end of comment, in other case, no comment is found
  if (!lines[index - 1].includes('*/')) {
    return;
  }
  endOfComment = index - 1;
  // Search for the start of the comment
  while (index >= 0) {
    if (lines[index].includes('/*')) {
      break;
    }
    index--;
  }
  if (index < 0) {
    return;
  }
  startOfComment = index;
  // Join all the lines of the comment, cleaning:
  //  - '/**' in the first line
  //  - '*/' in the last line
  //  - '*' in the rest of the lines
  if (startOfComment === endOfComment) {
    comment = lines[startOfComment].replace('/**', '').replace('*/', '');
  } else {
    const firstLine = lines[startOfComment].replace('/**', '');
    const lastLine = lines[endOfComment].replace('*/', '');
    const middleLines = lines.slice(startOfComment + 1, endOfComment).map(line => line.replace('*', ''));
    comment = [firstLine, ...middleLines, lastLine].join(' ');
  }
  // Clean spaces if there are more than one space between words or at the beginning or end of the comment
  return comment.replace(/\s\s+/g, ' ').trim();
}
/**
 * Obtiene el valor predeterminado de un comentario.
 * @param {string} comment - El comentario del cual se desea obtener el valor predeterminado.
 * @returns {string|undefined} El valor predeterminado del comentario, o undefined si no se encuentra.
 */
function getDefaultValueFromComment(comment) {
  if (!comment) {
    return;
  }
  const matches = comment.match(defaultValueRegex);
  if (matches && matches.groups && matches.groups['defaultValue']) {
    return matches.groups['defaultValue'];
  }
  return;
}
/**
 * Checks if a given line is a constant declaration.
 *
 * @param {string} line - The line to check.
 * @returns {boolean} - True if the line is a constant declaration, false otherwise.
 */
function isConstantDeclaration(line) {
  return line.includes('const');
}
/**
 * Finds and removes the section containing environment variables from a given Markdown document.
 * 
 * @param {object} readMeMD - The Markdown document object.
 */
function findAndRemoveEnvironmentVariablesSection(readMeMD) {
  for (let index = 0; index < readMeMD.children.length; index++) {
    const node = readMeMD.children[index];
    if (node.type === 'heading') {
      let nodeTitle = undefined;
      if (node.children[0].type === 'strong') {
        nodeTitle = node.children[0].children[0].value;
      } else if (node.children[0].type === 'text') {
        nodeTitle = node.children[0].value;
      }
      if (nodeTitle === 'Environment variables') {
        // Remove all the nodes between the title and the next title
        readMeMD.children.splice(index, 1);
        while (index < readMeMD.children.length) {
          if (readMeMD.children[index].type === 'heading' && readMeMD.children[index].depth === 2) {
            break;
          }
          readMeMD.children.splice(index, 1);
        }
        break;
      }
    }
  }
}
/**
 * Finds, removes, and returns the license section from the given readMeMD object.
 * 
 * @param {Object} readMeMD - The readMeMD object.
 * @returns {Array} - An array of nodes representing the license section.
 */
function findRemoveAndReturnLinceSection(readMeMD) {
  let licenseNodes = [];
  for (let index = 0; index < readMeMD.children.length; index++) {
    const node = readMeMD.children[index];
    if (node.type === 'heading') {
      let nodeTitle = undefined;
      if (node.children[0].type === 'strong') {
        nodeTitle = node.children[0].children[0].value;
      } else if (node.children[0].type === 'text') {
        nodeTitle = node.children[0].value;
      }
      if (nodeTitle === 'License') {
        // Save all the nodes between the title and the next title, including the title
        licenseNodes.push(node);
        readMeMD.children.splice(index, 1);
        while (index < readMeMD.children.length) {
          if (readMeMD.children[index].type === 'heading' && readMeMD.children[index].depth === 2) {
            break;
          }
          licenseNodes.push(readMeMD.children[index]);
          readMeMD.children.splice(index, 1);
        }
      }
    }
  }
  return deletePositionPropertyRecursively(licenseNodes);
}
/**
 * Recursively deletes the 'position' property from each node in the given array of nodes.
 * If a node has children, the function is called recursively on each child node.
 * @param {Array} nodes - The array of nodes to process.
 * @returns {Array} - The modified array of nodes.
 */
function deletePositionPropertyRecursively(nodes) {
  for (const node of nodes) {
    delete node.position;
    if (node.children) {
      deletePositionPropertyRecursively(node.children);
    }
  }
  return nodes;
}
/**
 * Generates a table of environment variables.
 * 
 * @param {Array<Object>} envVariables - An array of environment variables.
 * @returns {Array<Object>} - An array representing the table of environment variables.
 */
function generateTableOfEnvironmentVariables(envVariables) {
  const envVariablesTitle = {
    type: 'heading',
    depth: 2,
    children: [{ type: 'strong', children: [{ type: 'text', value: 'Environment variables' }] }],
  };
  const envVariablesTable = {
    type: 'table',
    align: ['left', 'center', 'left'],
    children: [
      {
        type: 'tableRow',
        children: [
          { type: 'tableCell', children: [{ type: 'text', value: 'Variable' }] },
          { type: 'tableCell', children: [{ type: 'text', value: 'Default value' }] },
          { type: 'tableCell', children: [{ type: 'text', value: 'Description' }] },
        ],
      },
    ],
  };
  for (const envVariable of envVariables) {
    envVariablesTable.children.push({
      type: 'tableRow',
      children: [
        { type: 'tableCell', children: [{ type: 'text', value: envVariable.name }] },
        { type: 'tableCell', children: [{ type: 'text', value: envVariable.defaultValue }] },
        { type: 'tableCell', children: [{ type: 'text', value: envVariable.comment }] },
      ],
    });
  }
  return [envVariablesTitle, envVariablesTable];
}
/**
 * Generates a list of environment variables.
 * 
 * @param {Array<Object>} envVariables - The array of environment variables.
 * @returns {Array<Object>} - The list of environment variables in a specific format.
 */
function generateListOfEnvironmentVariables(envVariables) {
  const envVariablesTitle = {
    type: 'heading',
    depth: 2,
    children: [{ type: 'strong', children: [{ type: 'text', value: 'Environment variables' }] }],
  };
  const envVariablesList = {
    type: 'list',
    ordered: false,
    spread: false,
    children: [],
  };
  for (const envVariable of envVariables) {
    if (!envVariable.comment) {
      console.log(`WARNING: No comment found for environment variable ${envVariable.name} in file ${envVariable.path}`);
    };
    let defaultValue = [];
    if (envVariable.defaultValue) {
      defaultValue = [
        { type: 'text', value: ' (default: ', },
        { type: 'inlineCode', value: envVariable.defaultValue },
        { type: 'text', value: `): ${envVariable.comment}` }];
    } else {
      defaultValue = [{ type: 'text', value: `: ${envVariable.comment}` }];
    }
    envVariablesList.children.push({
      type: 'listItem',
      spread: false,
      checked: null,
      children: [{
        type: 'paragraph',
        children: [
          {
            type: 'strong', children: [
              { type: 'text', value: envVariable.name },
            ]
          },
          ...defaultValue,
        ],
      }],
    });
  }
  return [envVariablesTitle, envVariablesList];
}
