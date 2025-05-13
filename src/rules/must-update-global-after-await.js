/**
 * @fileoverview Must update global after await
 * @author undrfined
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Must update global after await",
      recommended: false,
      url: null,
    },
    fixable: null,
    schema: [],
    messages: {
      mustUpdateGlobalAfterAwait: "Global is outdated because of await here -> {{before}}, use global = getGlobal() to update",
    }
  },

  create(context) {
    let blocks = 0;
    let awaitNode = null;
    let hasAwait = false;
    let awaitBlockLevel;
    let globalDeclared = false;
    let globalUpdatedAfterAwait = false;
    let returnAfterAwait = false;
    let inBranch = false;
    let branchStack = [];

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------
    function endFunction() {
      hasAwait = false;
      awaitNode = null;
      awaitBlockLevel = undefined;
      globalDeclared = false;
      globalUpdatedAfterAwait = false;
      returnAfterAwait = false;
      inBranch = false;
      branchStack = [];
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      'FunctionDeclaration:exit': endFunction,
      'FunctionExpression:exit': endFunction,
      'ArrowFunctionExpression:exit': endFunction,
      'IfStatement': () => {
        branchStack.push(inBranch);
        inBranch = true;
      },
      'IfStatement:exit': () => {
        inBranch = branchStack.pop();
      },
      'SwitchStatement': () => {
        branchStack.push(inBranch);
        inBranch = true;
      },
      'SwitchStatement:exit': () => {
        inBranch = branchStack.pop();
      },
      'AwaitExpression:exit': (node) => {
        if(!node) return;
        if (globalDeclared) {
          hasAwait = true;
          awaitBlockLevel = blocks;
          awaitNode = node;
          globalUpdatedAfterAwait = false;
        }
      },
      'BlockStatement': () => {
        blocks += 1;
      },
      'BlockStatement:exit': () => {
        blocks -= 1;
        if(awaitBlockLevel && blocks === awaitBlockLevel) {
          awaitBlockLevel = undefined;
        }
      },
      'ReturnStatement': (node) => {
        if (hasAwait && !globalUpdatedAfterAwait && inBranch) {
          returnAfterAwait = true;
        }
      },
      'ReturnStatement:exit': (node) => {
        if(hasAwait && awaitBlockLevel && blocks === awaitBlockLevel && node.parent.type === 'BlockExpression') {
          endFunction();
        }
      },
      'AssignmentExpression': (node) => {
        if(node.left.type !== "Identifier" || node.left.name !== "global") return;
        
        if (node.right.type === "CallExpression" && 
            (node.right.callee.name === "getGlobal" || node.right.callee.name === "getUntypedGlobal")) {
          if (!globalDeclared) {
            globalDeclared = true;
          }
          
          if (hasAwait) {
            globalUpdatedAfterAwait = true;
          }
        }
      },
      'VariableDeclarator': (node) => {
        if (node.id.type === "Identifier" && node.id.name === "global" && 
            node.init && node.init.type === "CallExpression" && 
            (node.init.callee.name === "getGlobal" || node.init.callee.name === "getUntypedGlobal")) {
          globalDeclared = true;
        }
      },
      Identifier: (node) => {
        if(node.name !== "global") return;
        
        // Skip if this is the global being declared or assigned
        if(node.parent.type === "AssignmentExpression" && node.parent.left === node) return;
        if(node.parent.type === "VariableDeclarator" && node.parent.id === node) return;
        
        // Only report if we have a global declaration, followed by an await without a return, without reassignment
        if(globalDeclared && hasAwait && !globalUpdatedAfterAwait && !returnAfterAwait) {
          context.report({
            node,
            messageId: "mustUpdateGlobalAfterAwait",
            data: {
              before: awaitNode ? awaitNode.loc.start.line + ':' + awaitNode.loc.start.column : 'unknown'
            },
          });
        }
      },
      "Program:exit": endFunction,
    };
  },
};
