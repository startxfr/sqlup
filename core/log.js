/* global module, require, process, res, $app */
//'use strict';

/**
 * Log manager
 * @module log
 * @constructor
 * @type $log
 */
var $log = {
  config: {},
  isDebug: false,
  /**
   * Initialise log according to the log section in sqlup.json. 
   * @param {bool} isDebug
   * @returns {log}
   */
  init: function (isDebug) {
    this.isDebug = (isDebug) ? true : false;
    return this;
  },
  /**
   * Log a debug trace
   * @param {string} a debug trace
   * @param {integer} duration duration of this action
   * @returns {$log}
   */
  debug: function (a, duration) {
    var dur = "";
    if (duration !== null && duration !== undefined) {
      dur += "  (" + duration + "ms)";
    }
    if (this.isDebug) {
      console.log(a + dur);
    }
    return this;
  },
  /**
   * Log a info trace
   * @param {string} a info trace
   * @param {integer} duration duration of this action
   * @returns {$log}
   */
  info: function (a, duration) {
    var dur = "";
    if (duration !== null && duration !== undefined) {
      dur += "  (" + duration + "ms)";
    }
      console.info(a + dur);
    return this;
  },
  /**
   * Log a warn trace
   * @param {string} a warn trace
   * @param {integer} duration duration of this action
   * @returns {$log}
   */
  warn: function (a, duration) {
    var dur = "";
    if (duration !== null && duration !== undefined) {
      dur += "  (" + duration + "ms)";
    }
      console.warn(a + dur);
    return this;
  },
  /**
   * Log an error trace
   * @param {string} a error trace
   * @param {integer} duration duration of this action
   * @returns {$log}
   */
  error: function (a, duration) {
    var dur = "";
    if (duration !== null && duration !== undefined) {
      dur += "  (" + duration + "ms)";
    }
      console.error(a + dur);
    return this;
  },
  formatRecursive: function (obj, data, excludeKey) {
    if (typeof obj === 'object') {
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          if ((typeof excludeKey === "object" && !(p in excludeKey)) || typeof excludeKey !== "object") {
            if (typeof obj[p] === 'string') {
              if ($log.stringHasFormat(obj[p])) {
                obj[p] = $log.format(obj[p], data);
              }
            }
            else if (typeof obj[p] === 'object') {
              $log.formatRecursive(obj[p], data, excludeKey);
            }
            else {
              $log.formatRecursive(obj[p], data, excludeKey);
            }
          }
        }
      }
    }
  },
  stringHasFormat: function (str) {
    if (typeof str === "string") {
      if (str.indexOf("{{") > -1 && str.indexOf("}}") > -1) {
        return true;
      }
    }
    return false;
  },
  format: require("mustache").render
};

module.exports = $log;