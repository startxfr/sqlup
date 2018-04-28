/* global module, require, process, $log, $timer, $app */
//'use strict';

/**
 * aws_dynamodb resource handler
 * @module resource/aws_dynamodb
 * @constructor
 * @param {string} id
 * @param {object} config
 * @type resource
 */
module.exports = function (id, config) {
  var $ddb = {
    id: id,
    config: {},
    /**
     * Initiate the DynamoDB table resource and check resource config
     * @param {object} config the resource config object
     * @returns {$table.dynamodb}
     */
    init: function (config) {
      var timerId = 'resource_aws.dynamodb_init_' + $ddb.id;
      $timer.start(timerId);
      if (config) {
        $ddb.config = config;
      }
      if (!$ddb.config.ACCESS_ID) {
        throw new Error("no 'ACCESS_ID' key found in resource '" + $ddb.id + "' config");
      }
      if (!$ddb.config.ACCESS_KEY) {
        throw new Error("no 'ACCESS_KEY' key found in resource '" + $ddb.id + "' config");
      }
      if (!$ddb.config.TableName) {
        throw new Error("no 'TableName' key found in resource '" + $ddb.id + "' config");
      }
      if (!$ddb.config.partitionKey) {
        throw new Error("no 'partitionKey' key found in resource '" + $ddb.id + "' config");
      }
      $ddb.AWS = require('aws-sdk');
      return this;
    },
    /**
     * Start the DynamoDB table resource as defined in the config
     * @param {function} callback to call when startup is done
     * @returns {$table.dynamodb}
     */
    start: function (callback) {
      var timerId = 'resource_aws.dynamodb_start_' + $ddb.id;
      $log.debug("Starting resource", 3);
      var cb = function () {
        $log.debug("started ", 1, $timer.timeStop(timerId));
        if (typeof callback === "function") {
          callback();
        }
      };
      $ddb.open(cb);
      return this;
    },
    /**
     * Stop the DynamoDB table resource
     * @param {function} callback to call when stopped
     * @returns {$table.dynamodb}
     */
    stop: function (callback) {
      $log.debug("Stopping resource", 2);
      if (typeof callback === "function") {
        callback(null, this);
      }
      return this;
    },
    /**
     * Open a connection the DynamoDB table defined in the resource config
     * @param {function} callback to call when AWS answer
     * @returns {$table.dynamodb}
     */
    open: function (callback) {
      var timerId = 'resource_aws.dynamodb_open_' + $ddb.id;
      $timer.start(timerId);
      var config = {};
      if ($ddb.config.ACCESS_ID) {
        config.accessKeyId = $ddb.config.ACCESS_ID;
      }
      if ($ddb.config.ACCESS_KEY) {
        config.secretAccessKey = $ddb.config.ACCESS_KEY;
      }
      if ($ddb.config.SESSION_TOKEN) {
        config.sessionToken = $ddb.config.SESSION_TOKEN;
      }
      config.region = $ddb.config.region || "us-west-1";
      $ddb.AWS.config.update(config);
      $ddb.client = new $ddb.AWS.DynamoDB.DocumentClient();
      $log.debug("connected with '" + $ddb.config.ACCESS_ID + "'", 4, $timer.timeStop(timerId));
      if (typeof callback === "function") {
        callback(null, this);
      }
      return this;
    },
    /**
     * Read the DynamoDB table defined in the config.table section of sqlup.json
     * @param {string} id object ID
     * @param {string} table table name
     * @param {object} options object with options to pass to the AWS receiveObject method
     * @param {function} callback to call when AWS answer
     * @returns {$table.dynamodb}
     */
    getObject: function (id, table, options, callback) {
      var timerId = 'resource_aws.dynamodb_getObject_' + $ddb.id;
      $timer.start(timerId);
      var config = $ddb.config.getObject_options || {Key: {}};
      if (typeof options === 'object') {
        require('merge').recursive(config, options);
      }
      config.TableName = table || config.TableName || $ddb.config.TableName;
      config.Key[$ddb.config.partitionKey] = id;
      $log.info("Get object " + id + " in table " + config.TableName);
      var defaultCallback = function (error, response) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn('could not get object ' + id + ' in table ' + config.TableName + ' because ' + error.message, duration);
        }
        else {
          $log.debug("object " + id + " found in table " + config.TableName, 4, duration);
        }
      };
      var cb = (typeof callback === "function") ? callback : defaultCallback;
      $ddb.client.get(config, function (error, response) {
        cb(error, response, cb, timerId);
      });
      return this;
    },
    /**
     * get the list of availables objects in a table
     * @param {string} table table name
     * @param {object} options object with options to pass to the AWS listObjectsV2 method
     * @param {function} callback to call when AWS answer
     * @returns {$table.dynamodb}
     */
    listObjects: function (table, options, callback) {
      var timerId = 'resource_aws.dynamodb_listObjects_' + $ddb.id;
      $log.info("list objects in table '" + config.TableName + "'");
      $timer.start(timerId);
      var config = $ddb.config.listObjects_options || {};
      if (typeof options === 'object') {
        require('merge').recursive(config, options);
      }
      config.TableName = table || config.TableName || $ddb.config.TableName;
      var defaultCallback = function (error, response) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn('could not list objects in table ' + config.TableName + ' because ' + error.message, duration);
        }
        else {
          $log.debug("listed " + response.Contents.length + "objects in table " + config.TableName, 4, duration);
        }
      };
      $ddb.client.query(config, (callback) ? callback : defaultCallback);
      return this;
    },
    /**
     * Add an object into an AWS DynamoDB table
     * @param {string} id object ID
     * @param {string} object body of the object whe want to send
     * @param {string} table table name
     * @param {object} options object with options to pass to the AWS putObject method
     * @param {function} callback to call when AWS answer
     * @returns {$table.dynamodb}
     */
    addObject: function (id, object, table, options, callback) {
      var messId = object.id;
      var timerId = 'resource_aws.dynamodb_addObject_' + $ddb.id + '::' + messId;
      $timer.start(timerId);
      var config = $ddb.config.addObject_options || {};
      if (typeof options === 'object') {
        require('merge').recursive(config, options);
      }
      config.TableName = table || config.TableName || $ddb.config.TableName;
      config.Item = (JSON.isSerializable(object)) ? JSON.serialize(object) : object;
      config.Item[$ddb.config.partitionKey] = id;
      $log.info("add DynamoDB object " + id + " in table " + config.TableName);
      var defaultCallback = function (error, response) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn('object ' + id + ' could not be send because ' + error.message, duration, true);
        }
        else {
          $log.debug("Adding AWS DynamoDB object " + id, 4, duration, true);
        }
      };
      $ddb.client.put(config, callback ? callback : defaultCallback);
      return this;
    },
    updateObject: this.addObject,
    /**
     * Delete an object from an AWS DynamoDB table
     * @param {string} id object ID
     * @param {string} table table name
     * @param {object} options object with options to pass to the AWS deleteObject method
     * @param {function} callback to call when AWS answer
     * @returns {$table.dynamodb}
     */
    deleteObject: function (id, table, options, callback) {
      var timerId = 'resource_aws.dynamodb_deleteObject_' + $ddb.id + '::' + id;
      $timer.start(timerId);
      var config = $ddb.config.deleteObject_options || {Key: {}};
      if (typeof options === 'object') {
        require('merge').recursive(config, options);
      }
      config.TableName = table || config.TableName || $ddb.config.TableName;
      config.Key[$ddb.config.partitionKey] = id;
      $log.info("delete DynamoDB object " + id + " in table " + config.TableName);
      var defaultCallback = function (error, response) {
        var duration = $timer.timeStop(timerId);
        if (error) {
          $log.warn('object ' + id + ' could not be deleted because ' + error.message, duration, true);
        }
        else {
          $log.debug("Deleting AWS DynamoDB object " + id, 4, duration, true);
        }
      };
      $ddb.client.delete(config, config, callback ? callback : defaultCallback);
      return this;
    }
  };
  $ddb.init(config);
  return $ddb;
};