/* global module, require, process, __dirname */

// import low level tools
require('./tools');

// declaring global variable $timer 
$timer = require('./timer');
$timer.start('app');

// declaring global variable $log
$log = require('./log');
$log.init(true);

//'use strict';
$app = {
  timer: $timer,
  log: $log,
  package: {},
  config: {
    ip: require("ip").address(),
    log: {},
    waitStartup: 20,
    path: "{{{DATA_PATH}}}",
    server: {
      type: "mysql",
      host: "localhost",
      port: "3306"
    },
    dbversion: {
      table: "sqlup",
      idKey: "id",
      valKey: "value",
      id: "latest"
    }
  },
  /**
   * Main init function who start the application
   * @param {function} callback
   * @returns {$app}
   */
  init: function (callback) {
    $log.info("Initialize sqlup", $timer.time('app'));
    this._initProcessSignals();
    this._initCheckEnv();
    this._initLoadConfigFiles();
    $log.debug("App path     : " + this.config.app_path);
    $log.debug("Lib path     : " + this.config.lib_path);
    $log.debug("Data path    : " + ((this.config.data_path) ? this.config.data_path : "NONE"));
    $log.debug("Log path     : " + ((this.config.log_path) ? $log.config.log_path : "NONE"));
    $log.debug("node engine  : node v" + process.env.NODE_VERSION);
    $log.debug("npm engine   : " + process.env.NPM_VERSION);
    $log.debug("sqlup        : " + $app.package.name + ' v' + $app.package.version);
    $log.debug("Hostname     : " + this.config.hostname);
    $log.debug("container ip : " + $app.config.ip);
    $log.debug("application  : " + $app.config.name + ' v' + $app.config.version);
    $log.debug("service name : " + $app.config.name);
    $log.debug("service vers : " + $app.config.version);
    $log.info($app.tmpMsgCfgload, $timer.time('app'));
    delete $app.tmpMsgCfgload;
    if ($app.config.server) {
      switch ($app.config.server.type) {
        case "mysql" :
          $app.db = require("./resource/mysql")("mysql", $app.config);
          break;
        case "posgresql" :
          $app.db = require("./resource/posgresql")("posgresql", $app.config);
          break;
        case "dynamodb" :
          $app.db = require("./resource/aws_dynamodb")("dynamodb", $app.config);
          break;
        default:
          this.fatalError("'server.type' must be one of mysql,posgresql or dynamodb");
      }
    }
    else {
      this.fatalError("'server' key is missing in configuration");
    }
    if (typeof callback !== "function") {
      callback = function () {
      };
    }
    $log.debug("End application warmup", $timer.time('app'));
    if ($app.config.waitStartup !== undefined && $app.config.waitStartup > 0) {
      $log.info("Waiting " + $app.config.waitStartup + "sec for database startup", $timer.time('app'));
      setTimeout(callback, $app.config.waitStartup * 1000);
    }
    else {
      callback();
    }
    return this;
  },
  /**
   * Check and load required env variable
   * @returns {$app}⋅
   */
  _initCheckEnv: function () {
    $log.debug("start checking env variable as part of the init process", $timer.time('app'));
    if (process.env.HOSTNAME) {
      this.config.hostname = process.env.HOSTNAME;
    }
    else {
      this.fatalError('environment variable HOSTNAME must be set');
    }
    if (!process.env.APP_PATH) {
      process.env.APP_PATH = require('path').dirname(__dirname);
    }
    this.config.app_path = process.env.APP_PATH;
    process.chdir(this.config.app_path);
    if (!process.env.CONF_PATH) {
      process.env.CONF_PATH = process.env.APP_PATH;
    }
    this.config.conf_path = process.env.CONF_PATH;
    if (process.env.DATA_PATH) {
      this.config.data_path = process.env.DATA_PATH;
    }
    if (process.env.LOG_PATH) {
      $log.config.log_path = process.env.LOG_PATH;
    }
    if (!process.env.NODE_VERSION) {
      process.env.NODE_VERSION = 'unknown';
    }
    if (process.env.npm_config_user_agent) {
      process.env.NPM_VERSION = process.env.npm_config_user_agent;
    }
    else if (!process.env.NPM_VERSION) {
      process.env.NPM_VERSION = 'unknown';
    }
    try {
      var pathToFile = require.resolve('sqlup');
      this.config.lib_path = require('path').dirname(pathToFile);
    }
    catch (e) {
      this.config.lib_path = process.env.APP_PATH;
    }
    return this;
  },
  /**
   * Check and load required package and config file
   * @returns {$app}
   */
  _initLoadConfigFiles: function () {
    $log.debug("start checking config files as part of the init process", $timer.time('app'));
    var fs = require('fs');
    var mg = require('merge');
    var pkg_file = this.config.app_path + '/package.json';
    var cfg_file = this.config.conf_path + '/sqlup.json';
    try {
      mg.recursive($app.package, JSON.parse(fs.readFileSync(pkg_file, 'utf-8')));
      $log.debug("Pkg source   : " + this.config.app_path + '/package.json');
    }
    catch (e) {
      this.fatalError("package file " + pkg_file + " is missing");
    }
    if (process.env.SQLUP_CONF) {
      $app.tmpMsgCfgload = "Configuration loaded from SQLUP_CONF environment variable";
      $log.debug("Cfg source   : SQLUP_CONF environment variable");
      mg.recursive($app.config, JSON.parse(process.env.SQLUP_CONF));
    }
    else {
      try {
        $app.tmpMsgCfgload = "Configuration loaded from " + this.config.conf_path + '/sqlup.json';
        mg.recursive($app.config, JSON.parse(fs.readFileSync(cfg_file, 'utf-8')));
        $log.debug("Cfg source   : " + this.config.conf_path + '/sqlup.json');
      }
      catch (e) {
        $log.error("Cfg source   : is missing");
        $log.debug("sqlup configuration could not be found");
        $log.debug("add environment variable SQLUP_CONF or create " + this.config.conf_path + "/sqlup.json config file");
        this.fatalError('configuration file or variable is missing');
      }
    }
    if ($app.config && $app.config.disableSmartConf === true) {
      if ($app.config && $app.config.name) {
        $app.config.name = $log.format($app.config.name, process.env);
      }
      if ($app.config && $app.config.version) {
        $app.config.version = $log.format($app.config.version, process.env);
      }
    }
    else {
      $log.formatRecursive($app.config, process.env, {bot: null, server: null});
    }
    if (!$app.config.name) {
      this.fatalError('sqlup configuration must have a "name" property');
    }
    if (!$app.config.name) {
      this.fatalError('sqlup configuration must have a "name" property');
    }
    if (!$app.config.version) {
      this.fatalError('sqlup configuration must have a "version" property');
    }
    $app.config.appsign = $app.config.log.appsign = $app.config.name + '::' + $app.config.version + '::' + $app.config.ip;
    $app.config.log.apptype = $app.config.name + '-v' + $app.config.version;
    process.env.npm_config_user_agent += " (" + $app.package.name + ' v' + $app.package.version + ")";
    return this;
  },
  /**
   * Check and load required package and config file
   * @returns {$app}
   */
  _initProcessSignals: function () {
    $log.debug("start registering system signals as part of the init process", $timer.time('app'));
    process.stdin.resume();
    process.__exitHandler = function (code) {
      $log.info("sqlup " + $app.config.name + ' v' + $app.config.version + " exited " + code, $timer.time('app'));
    };
    process.__quitHandler = function (a, b, c, d) {
      $app.stop(function () {
        process.exit(a);
      });
    };
    process.__exceptionHandler = function (error) {
      $log.error("exception " + error.message);
      $log.debug(error.stack);
      process.exit(1);
    };
    process.quit = process.__quitHandler;
    //do something when app is closing
    process.on('exit', process.__exitHandler);
    //docker kill --signal=SIGINT container
    process.on('SIGINT', process.__quitHandler);
    process.on('SIGHUP', process.__quitHandler);
    process.on('SIGQUIT', process.__quitHandler);
    // docker stop container
    process.on('SIGTERM', process.__quitHandler);
    //catches uncaught exceptions
    process.on('uncaughtException', process.__exceptionHandler);
    return this;
  },
  /**
   * Log an error and stop process
   * @param {string} message
   * @returns exit
   */
  fatalError: function (message) {
    $log.error("== FATAL ERROR ==");
    $log.error(message);
    process.exit(1);
  },
  /**
   * Return a simple and filtered view of the config object
   * @param {boolean} full set to true if you whant the full nativ config object
   * @returns {$app.config}
   */
  getConfig: function (full) {
    if (full === true) {
      return $app.config;
    }
    return {
      name: $app.config.name,
      version: $app.config.version,
      appsign: $app.config.appsign,
      ip: $app.config.ip,
      hostname: $app.config.hostname,
      package: {
        name: $app.package.name,
        version: $app.package.version,
        description: $app.package.description,
        author: $app.package.author
      }
    };
  },
  /**
   * Start the application
   * @param {function} callback
   * @returns {$app}
   */
  start: function (callback) {
    $log.info("Start job " + $app.config.name + ' v' + $app.config.version, $timer.time('app'));
    $app.db.start(function () {
      $app.checkDbVersion(function () {
        $log.info("database is currently in version " + $app.currentDBVersion);
        $app.checkTargetVersion(function () {
          $log.info("target version is " + $app.targetDBVersion);
          $app.checkPlanToTarget(function (count) {
            $log.info("Applying " + count + " patch from " + $app.currentDBVersion + " to " + $app.targetDBVersion);
            $app.execPlanToTarget();
          });
        });
      });
    });
    return this;
  },
  /**
   * Stop the application
   * @param {function} callback
   * @returns {$app}
   */
  stop: function (callback) {
    $log.info("Stopping application " + $app.config.name + ' v' + $app.config.version, $timer.time('app'));
    if (typeof callback === "function") {
      callback();
    }
  },
  /**
   * init and start the application
   * @param {mixed} config
   * @param {function} callback
   * @returns {$app}
   */
  launch: function (config, callback) {
    $log.debug("Launching sqlup", $timer.time('app'));
    if (typeof config === "function" && callback === undefined) {
      callback = config;
    }
    if (typeof config === "string") {
      $app.config.conf_path = config;
    }
    if (typeof config === "object") {
      process.env.SQLUP_CONF = JSON.stringify(config);
    }
    $log.debug("Warming-up sqlup", $timer.time('app'));
    $app.init(function () {
      $app.start(callback);
    });
    return this;
  },
  applyPatch: function (file, id, callback) {
    $log.debug("applying version " + id + " patch " + file);
    try {
      $app.db.load($app.config.path + "/" + file, function (timerId) {
        return function (err, results, fields) {
          var duration = $timer.timeStop(timerId);
          if (err) {
            $log.error("error executing patch " + file);
            callback(err, id);
          }
          else {
            $app.updateVersionTable(id, function () {
              $log.info("Successfully loaded version " + id, duration);
              callback(null, id);
            });
          }
        };
      });
    }
    catch (err) {
      callback(err, id);
    }
    return this;
  },
  checkTargetVersion: function (callback) {
    $log.debug("Checking latest version to apply");
    var latest = $app.config.sequence;
    $app.targetDBVersion = "0.0.0";
    for (var prop in $app.config.sequence) {
      $app.targetDBVersion = prop;
    }
    if (typeof callback === "function") {
      callback();
    }
    return this;
  },
  execPlanToTarget: function (callback) {
    require("async").eachOfSeries($app.execSeq, $app.applyPatch, function (err) {
      if (err) {
        $app.fatalError("error when executing patch because " + err.message);
      }
      else {
        $log.info("Successfully updated database to version " + $app.targetDBVersion);
        if (typeof callback === "function") {
          callback();
        }
        else {
          $log.info("Database upgrade to " + $app.targetDBVersion + " is completed");
          process.exit(0);
        }
      }
    });
    return this;
  },
  checkPlanToTarget: function (callback) {
    var count = 0;
    var startCount = ($app.currentDBVersion === "none") ? true : false;
    $app.execSeq = {};
    for (var prop in $app.config.sequence) {
      if (startCount) {
        count++;
        $app.execSeq[prop] = $app.config.sequence[prop];
      }
      if (prop === $app.targetDBVersion) {
        startCount = false;
      }
      if (prop === $app.currentDBVersion) {
        startCount = true;
      }
    }
    if (typeof callback === "function") {
      callback(count);
    }
    return count;
  },
  checkDbVersion: function (callback) {
    $log.debug("Checking Database current version");
    var cf = $app.config.dbversion;
    var sql = "SELECT `" + cf.valKey + "` as val FROM `" + cf.table + "` WHERE `" + cf.idKey + "` = '" + cf.id + "'";
    $app.db.query(sql, function (timerId) {
      return function (err, results, fields) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          if (err.code === "ER_NO_SUCH_TABLE") {
            $log.warn("version table '" + cf.table + "' doesn't exist in " + $app.db.config._sign, duration);
            $log.info("trying to create table '" + cf.table + "' in " + $app.db.config._sign, duration);
            $app.createVersionTable(callback);
            $app.currentDBVersion = "none";
          }
          else {
            throw new Error("error connecting resource '" + $app.db.id + "' to " + $app.db.config._sign + ' : ' + (err.sqlMessage || err.message));
          }
        }
        else if (results[0] === undefined) {
          $log.warn("version key '" + cf.id + "' doesn't exist in version table '" + cf.table);
          $app.initVersionTable(callback);
          $app.currentDBVersion = "none";
        }
        else {
          $app.currentDBVersion = results[0].val;
          if (typeof callback === "function") {
            callback();
          }
        }
      };
    });
    return this;
  },
  createVersionTable: function (callback) {
    $log.debug("Create version table " + $app.config.dbversion.table);
    var cf = $app.config.dbversion;
    var sql = "CREATE TABLE  `" + cf.table + "` (" +
    "`" + cf.idKey + "` VARCHAR( 16 ) NOT NULL ," +
    "`" + cf.valKey + "` VARCHAR( 32 ) NOT NULL ," +
    "PRIMARY KEY (  `" + cf.idKey + "` ) , UNIQUE ( `" + cf.valKey + "` )" +
    ") ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_general_ci;";
    $app.db.query(sql, function (timerId) {
      return function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          throw new Error("error creating table '" + $app.config.dbversion.table + "' in " + $app.db.config._sign + ' : ' + (err.sqlMessage || err.message));
        }
        else {
          $log.info("table '" + cf.table + "' created in " + $app.db.config._sign, duration);
          $app.initVersionTable(callback);
        }
      };
    });
    return this;
  },
  initVersionTable: function (callback) {
    $log.debug("Init version table " + $app.config.dbversion.table);
    var cf = $app.config.dbversion;
    var sql = "INSERT INTO `" + cf.table + "` (`" + cf.idKey + "` ,`" + cf.valKey + "`) VALUES ('" + cf.id + "',  'none');";
    $app.db.query(sql, function (timerId) {
      return function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          throw new Error("error initializing table '" + $app.config.dbversion.table + "' in " + $app.db.config._sign + ' : ' + (err.sqlMessage || err.message));
        }
        else {
          $log.info("table '" + cf.table + "' initialized in " + $app.db.config._sign, duration);
          if (typeof callback === "function") {
            callback();
          }
        }
      };
    });
    return this;
  },
  updateVersionTable: function (version, callback) {
    $log.debug("Update version table " + $app.config.dbversion.table + " to " + version);
    var cf = $app.config.dbversion;
    var sql = "UPDATE  `" + cf.table + "` SET  `" + cf.valKey + "` =  '" + version + "' WHERE  `" + cf.idKey + "` ='" + cf.id + "';";
    $app.db.query(sql, function (timerId) {
      return function (err) {
        var duration = $timer.timeStop(timerId);
        if (err) {
          throw new Error("error updating table '" + $app.config.dbversion.table + "' in " + $app.db.config._sign + ' : ' + (err.sqlMessage || err.message));
        }
        else {
          $log.debug("table '" + cf.table + "' updated to " + version, duration);
          if (typeof callback === "function") {
            callback();
          }
        }
      };
    });
    return this;
  }
};

module.exports = $app;