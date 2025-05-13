/**
 * @fileoverview eslint-plugin-tt-multitab
 * @author undrfined
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
module.exports.rules = requireIndex(__dirname + "/rules");

module.exports.configs = {
  recommended: {
    rules: {
      "tt-multitab/no-immediate-global": "error",
      "tt-multitab/set-global-only-variable": "error",
      "tt-multitab/must-update-global-after-await": "error",
      "tt-multitab/must-specify-action-handler-return-type": "error",
    },
  },
};
