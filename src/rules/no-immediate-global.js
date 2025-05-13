/**
 * @fileoverview No immediate global
 * @author undrfined
 */
"use strict";

const path = require('path');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "No immediate global",
      recommended: false,
      url: null,
    },
    fixable: null,
    schema: [],
    messages: {
      noImmediateGlobal: "Only use getGlobal() to assign to global variable",
    }
  },

  create(context) {
    return {
      CallExpression: (node) => {
        // Use the newer, non-deprecated properties from the context object
        const filename = context.filename || context.sourceCode?.source?.path;
        const cwd = process.cwd(); // Use Node.js process.cwd() instead of ESLint's getCwd()
        
        // Normalize paths to handle Windows backslashes
        const relativePath = path.relative(cwd, filename);
        const normalizedPath = path.normalize(relativePath);
        
        // Check if the file is in the src/global directory
        if(!normalizedPath.startsWith(path.join('src', 'global'))) return;
        
        if(node.callee.name === 'getGlobal') {
          // Check if getGlobal() is used in a valid assignment context
          const isAssignmentExpr = node.parent.type === 'AssignmentExpression' && node.parent.right === node;
          const isVariableDeclarator = node.parent.type === 'VariableDeclarator' && node.parent.init === node;
          
          // Only report if getGlobal is not used for assignment
          if(!isAssignmentExpr && !isVariableDeclarator) {
            context.report({
              node,
              messageId: "noImmediateGlobal",
            });
          }
        }
      }
    };
  },
};
