/* global module, require, process, $log, $timer, $app */
//'use strict';

/**
 * postgres resource handler
 * @module resource/postgres
 * @constructor
 * @param {string} id
 * @param {object} config
 * @type resource
 */
module.exports = function (id, config) {
  var $pgdb = {
    id: id,
    pool: [],
    config: {},
    init: function (config) {
      var timerId = 'resource_postgres_init_' + $pgdb.id;
      $timer.start(timerId);
      if (config) {
        $pgdb.config = config;
      }
      if (!$pgdb.config.server) {
        throw new Error("no 'server' key found in resource '" + $pgdb.id + "' config");
      }
      if (!$pgdb.config.server.host) {
        throw new Error("no 'server.host' key found in resource '" + $pgdb.id + "' config");
      }
      if (!$pgdb.config.server.database) {
        throw new Error("no 'server.database' key found in resource '" + $pgdb.id + "' config");
      }
      $pgdb.config.server.host = $log.format("" + $pgdb.config.server.host, process.env);
      $pgdb.config.server.database = $log.format("" + $pgdb.config.server.database, process.env);
      if ($pgdb.config.server.port) {
        $pgdb.config.server.port = $log.format("" + $pgdb.config.server.port, process.env);
      }
      if ($pgdb.config.server.user) {
        $pgdb.config.server.user = $log.format("" + $pgdb.config.server.user, process.env);
      }
      if ($pgdb.config.server.password) {
        $pgdb.config.server.password = $log.format("" + $pgdb.config.server.password, process.env);
      }
      $pgdb.config._sign = $pgdb.config.server.host + '::' + $pgdb.config.server.database;
      $pgdb.conn = require("pg").Client;
      if (typeof $pgdb.pool[$pgdb.config._sign] === 'undefined') {
        $log.debug("initialize new postgresql connection to " + $pgdb.config._sign, 4);
        $pgdb.pool[$pgdb.config._sign] = new $pgdb.conn($pgdb.config.server);
      }
      else {
        $log.debug("resource '" + $pgdb.id + "' : use existing connection to postgres " + $pgdb.config._sign, 4);
      }
      return $pgdb;
    },
    start: function (callback) {
      var timerId = 'resource_postgres_start_' + $pgdb.id;
      $log.debug("Starting resource", 3);
      var cb = function () {
        $log.debug("started ", 1, $timer.timeStop(timerId));
        if (typeof callback === "function") {
          callback();
        }
      };
      $pgdb.open(callback);
      return $pgdb;
    },
    stop: function (callback) {
      $log.debug("Stopping resource", 2);
      $pgdb.pool[$pgdb.config._sign].end();
      if (typeof callback === "function") {
        callback(null, $pgdb);
      }
      return $pgdb;
    },
    open: function (callback) {
      var timerId = 'postgres_open_' + $pgdb.id;
      $timer.start(timerId);
      $pgdb.pool[$pgdb.config._sign].connect(function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          throw new Error("error connecting resource '" + $pgdb.id + "' to " + $pgdb.config._sign + ' : ' + err.message);
        }
        else {
          $log.debug("connected to '" + $pgdb.config._sign + "'", 4, duration);
        }
        if (typeof callback === "function") {
          callback(null, $pgdb);
        }
      });
      return $pgdb;
    },
    query: function (sql, callback) {
      var timerId = 'postgres_query_' + sql;
      $timer.start(timerId);
      $log.info("exec sql " + sql);
      return $pgdb.pool[$pgdb.config._sign].query(sql, (callback) ? callback(timerId) : $pgdb.__queryDefaultCallback(timerId));
    },
    __queryDefaultCallback: function (timerId) {
      return function (error, results) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.error("query could not be executed because " + error.message, duration);
        }
      };
    },
    /**
     * Read a document from the postgres storage
     * @param {string} table
     * @param {object} filter
     * @param {function} callback
     */
    read: function (table, filter, callback) {
      var connection = $pgdb.pool[$pgdb.config._sign];
      var sqlFilter = '';
      if (typeof filter === 'object' && Object.keys(filter).length > 0) {
        for (var i in filter) {
          sqlFilter += "`" + i + "` = " + connection.escape(filter[i]) + " AND";
        }
        var timerId = 'postgres_read_' + table + '_' + sqlFilter.slice(0, -3);
        $timer.start(timerId);
        $log.info("read table " + table);
        var sql = "SELECT * FROM " + table + " WHERE " + sqlFilter.slice(0, -3) + ";";
        return connection.query(sql, (callback) ? callback(timerId) : $pgdb.__readDefaultCallback(timerId));
      }
      else {
        $log.warn("error reading entry in postgres because no filter found (prevent reading all content in table)");
        return false;
      }
    },
    __readDefaultCallback: function (timerId) {
      return function (error, results) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn("error reading entry in postgres because " + error.message, duration);
        }
        else {
          $log.debug("reading entry in postgres ", 4, duration);
        }
      };
    },
    /**
     * Insert a new document into the postgres storage
     * @param {string} table
     * @param {object} data
     * @param {function} callback
     */
    insert: function (table, data, callback) {
      var timerId = 'postgres_insert_' + table;
      $timer.start(timerId);
      $log.info("add new entry in table '" + table + "'");
      var connection = $pgdb.pool[$pgdb.config._sign];
      var fields = '';
      var vals = '';
      for (var i in data) {
        fields += "`" + i + "`,";
        vals += connection.escape(data[i]) + ",";
      }
      var sql = "INSERT INTO " + table + " (" + fields.slice(0, -1) + ") VALUES(" + vals.slice(0, -1) + ");";
      return connection.query(sql, (callback) ? callback(timerId) : $pgdb.__insertDefaultCallback(timerId));
    },
    __insertDefaultCallback: function (timerId) {
      return function (error, results) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn("resource '" + $pgdb.id + "' : error adding new entry because " + error.message, duration);
        }
        else {
          $log.debug("resource '" + $pgdb.id + "' : new entry added", 3, duration);
        }
      };
    },
    /**
     * Update a document into the postgres storage
     * @param {string} table
     * @param {object} data
     * @param {object} filter
     * @param {function} callback
     */
    update: function (table, data, filter, callback) {
      var connection = $pgdb.pool[$pgdb.config._sign];
      var sqlFrag = '';
      var sqlFilter = '';
      $log.info("update entry in table '" + table + "'");
      if (typeof filter === 'object' && Object.keys(filter).length > 0) {
        for (var i in filter) {
          sqlFilter += "`" + i + "` = " + connection.escape(filter[i]) + " AND";
        }
        var timerId = 'postgres_udpate_' + table + '_' + sqlFilter.slice(0, -3);
        $timer.start(timerId);
        for (var i in data) {
          sqlFrag += "`" + i + "` = " + connection.escape(data[i]) + ",";
        }
        var sql = "UPDATE " + table + " SET " + sqlFrag.slice(0, -1) + " WHERE " + sqlFilter.slice(0, -3) + ";";
        return connection.query(sql, (callback) ? callback(timerId) : $pgdb.__updateDefaultCallback(timerId));
      }
      else {
        $log.warn("error updating entry in postgres because no filter found (prevent updating all table)");
        return false;
      }
    },
    __updateDefaultCallback: function (timerId) {
      return function (error, results) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn("error updating entry in postgres because " + error.message, duration);
        }
        else {
          $log.debug("updating entry in postgres ", 4, duration);
        }
      };
    },
    /**
     * delete a document into the postgres storage
     * @param {string} table
     * @param {string} filter
     * @param {function} callback
     */
    delete: function (table, filter, callback) {
      var connection = $pgdb.pool[$pgdb.config._sign];
      var sqlFilter = '';
      $log.info("delete entry in table '" + table + "'");
      if (typeof filter === 'object' && Object.keys(filter).length > 0) {
        for (var i in filter) {
          sqlFilter += "`" + i + "` = " + connection.escape(filter[i]) + " AND";
        }
        var timerId = 'postgres_delete_' + table + '_' + sqlFilter.slice(0, -3);
        $timer.start(timerId);
        var sql = "DELETE FROM " + table + " WHERE " + sqlFilter.slice(0, -3) + ";";
        return connection.query(sql, (callback) ? callback() : $pgdb.__deleteDefaultCallback());
      }
      else {
        $log.warn("error deleting entry in postgres because no filter found (prevent erasing all table)");
        return false;
      }
    },
    __deleteDefaultCallback: function (timerId) {
      return function (error, results) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn("error deleting entry in postgres because " + error.message, duration);
        }
        else {
          $log.debug("deleting entry in postgres ", 4, duration);
        }
      };
    }
  };
  $pgdb.init(config);
  return $pgdb;
};