/* global module, require, process, $log, $timer, $app */
//'use strict';

/**
 * mysql resource handler
 * @module resource/mysql
 * @constructor
 * @param {string} id
 * @param {object} config
 * @type resource
 */
module.exports = function (id, config) {
  var $mqdb = {
    id: id,
    pool: [],
    config: {},
    init: function (config) {
      var timerId = 'resource_mysql_init_' + $mqdb.id;
      $timer.start(timerId);
      if (config) {
        $mqdb.config = config;
      }
      if (!$mqdb.config.server) {
        throw new Error("no 'server' key found in resource '" + $mqdb.id + "' config");
      }
      if (!$mqdb.config.server.host) {
        throw new Error("no 'server.host' key found in resource '" + $mqdb.id + "' config");
      }
      if (!$mqdb.config.server.database) {
        throw new Error("no 'server.database' key found in resource '" + $mqdb.id + "' config");
      }
      $mqdb.config.server.host = $log.format("" + $mqdb.config.server.host, process.env);
      $mqdb.config.server.database = $log.format("" + $mqdb.config.server.database, process.env);
      if ($mqdb.config.server.port) {
        $mqdb.config.server.port = $log.format("" + $mqdb.config.server.port, process.env);
      }
      if ($mqdb.config.server.user) {
        $mqdb.config.server.user = $log.format("" + $mqdb.config.server.user, process.env);
      }
      if ($mqdb.config.server.password) {
        $mqdb.config.server.password = $log.format("" + $mqdb.config.server.password, process.env);
      }
      $mqdb.config.server.multipleStatements = true;
      $mqdb.config._sign = $mqdb.config.server.host + '::' + $mqdb.config.server.database;
      $mqdb.conn = require("mysql");
      if (typeof $mqdb.pool[$mqdb.config._sign] === 'undefined') {
        $log.debug("initialize new mysql connection to " + $mqdb.config._sign);
        $mqdb.pool[$mqdb.config._sign] = $mqdb.conn.createConnection($mqdb.config.server);
      }
      else {
        $log.debug("resource '" + $mqdb.id + "' : use existing connection to mysql " + $mqdb.config._sign);
      }
      return $mqdb;
    },
    start: function (callback) {
      var timerId = 'resource_mysql_start_' + $mqdb.id;
      $log.debug("Starting resource");
      var cb = function () {
        $log.debug("started ", $timer.timeStop(timerId));
        if (typeof callback === "function") {
          callback();
        }
      };
      $mqdb.open(callback);
      return $mqdb;
    },
    stop: function (callback) {
      $log.debug("Stopping resource");
      $mqdb.pool[$mqdb.config._sign].destroy();
      if (typeof callback === "function") {
        callback(null, $mqdb);
      }
      return $mqdb;
    },
    open: function (callback) {
      var timerId = 'mysql_open_' + $mqdb.id;
      $timer.start(timerId);
      $mqdb.pool[$mqdb.config._sign].connect(function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          if (err.code === "ER_BAD_DB_ERROR") {
            $log.warn("error connecting resource '" + $mqdb.id + "' to " + $mqdb.config._sign + ' : ' + (err.sqlMessage || err.message), duration);
            $log.info("trying to create database '" + $mqdb.config.server.database + "' in " + $mqdb.config.server.host, duration);
            $mqdb.openAndCreateDB(callback);
          }
          else {
            throw new Error("error connecting resource '" + $mqdb.id + "' to " + $mqdb.config._sign + ' : ' + (err.sqlMessage || err.message));
          }
        }
        else {
          $log.debug("connected to '" + $mqdb.config._sign + "'", duration);
          if (typeof callback === "function") {
            callback(null, $mqdb);
          }
          // permanent ping to keep connection alive
          var timelaps = $mqdb.config.keepAliveInterval || 20;
          setInterval(function () {
            $log.debug("ping '" + $mqdb.config._sign + "' to keep connection alived");
            $mqdb.pool[$mqdb.config._sign].query('SELECT 1');
          }, timelaps * 1000);
        }
      });
      return $mqdb;
    },
    openAndCreateDB: function (callback) {
      var timerId = 'mysql_openAndCreateDB_' + $mqdb.id;
      $timer.start(timerId);
      var dbname = $mqdb.config.server.database;
      delete $mqdb.config.server.database;
      $mqdb.pool[$mqdb.config._sign] = $mqdb.conn.createConnection($mqdb.config.server);
      $mqdb.pool[$mqdb.config._sign].connect(function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          throw new Error("error connecting resource '" + $mqdb.id + "' to " + $mqdb.config._sign + ' : ' + err.message);
        }
        else {
          $log.debug("connected to '" + $mqdb.config.server.host + "'", duration);
          $mqdb.pool[$mqdb.config._sign].query("CREATE DATABASE " + dbname + ";", function (err, result) {
            if (err) throw new Error("could not create database '" + dbname + ' : ' + err.message);
            $log.info("Database '" + dbname + "' created in " + $mqdb.config.server.host, duration);
            $mqdb.config.server.database = dbname;
            $mqdb.pool[$mqdb.config._sign].destroy();
            $mqdb.pool[$mqdb.config._sign] = $mqdb.conn.createConnection($mqdb.config.server);
            $mqdb.open(callback);
          });
        }
      });
      return $mqdb;
    },
    query: function (sql, callback) {
      var timerId = 'mysql_query_' + sql;
      $timer.start(timerId);
      $log.debug("exec sql " + sql);
      return $mqdb.pool[$mqdb.config._sign].query(sql, (callback) ? callback(timerId) : $mqdb.__queryDefaultCallback(timerId));
    },
    __queryDefaultCallback: function (timerId) {
      return function (error, results, fields) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.error("query could not be executed because " + error.message, duration);
        }
      };
    },
    /**
     * Load a dump file into database
     * @param {string} file
     * @param {function} callback
     */
    load: function (file, callback) {
      var timerId = 'mysql_load_' + file;
      $timer.start(timerId);
      $log.debug("load sql " + file);
      var sql = require('fs').readFileSync(file).toString();
      return $mqdb.pool[$mqdb.config._sign].query(sql, (callback) ? callback(timerId) : $mqdb.__queryDefaultCallback(timerId));
    }
  };
  $mqdb.init(config);
  return $mqdb;
};