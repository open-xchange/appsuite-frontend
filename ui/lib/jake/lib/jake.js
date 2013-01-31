/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var jake
  , fs = require('fs')
  , path = require('path')
  , task = require('./task')
  , Task = task.Task
  , FileTask = task.FileTask
  , DirectoryTask = task.DirectoryTask;

var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
};

var Invocation = function (taskName, args) {
  this.taskName = taskName;
  this.args = args;
};

/**
 * @namespace
 * The main namespace for Jake
 */
jake = new function () {

  this._invocationChain = [];

  // Private variables
  // =================
  // Local reference for scopage
  var self = this;

  // Public properties
  // =================
  this.errorCode = undefined;
  // Name/value map of all the various tasks defined in a Jakefile.
  // Non-namespaced tasks are placed into 'default.'
  this.defaultNamespace = new Namespace('default', null);
  // For namespaced tasks -- tasks with no namespace are put into the
  // 'default' namespace so lookup code can work the same for both
  // namespaced and non-namespaced.
  this.currentNamespace = this.defaultNamespace;
  // Saves the description created by a 'desc' call that prefaces a
  // 'task' call that defines a task.
  this.currentTaskDescription = null;

  /**
   * Displays the list of descriptions avaliable for tasks defined in
   * a Jakefile
   */
  this.showAllTaskDescriptions = function (f) {
    var maxTaskNameLength = 0
      , task
      , str = ''
      , padding
      , name
      , descr
      , filter = typeof f == 'string' ? f : null;

    for (var p in jake.Task) {
      task = jake.Task[p];
      // Record the length of the longest task name -- used for
      // pretty alignment of the task descriptions
      maxTaskNameLength = p.length > maxTaskNameLength ?
        p.length : maxTaskNameLength;
    }
    // Print out each entry with descriptions neatly aligned
    for (var p in jake.Task) {
      if (filter && p.indexOf(filter) == -1) {
        continue;
      }
      task = jake.Task[p];

      name = '\033[32m' + p + '\033[39m ';

      // Create padding-string with calculated length
      padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');

      descr = task.description
      if (descr) {
        descr = '\033[90m # ' + descr + '\033[39m \033[37m \033[39m';
        console.log('jake ' + name + padding + descr);
      }
    }
  };

  this.createTask = function () {
    var args = Array.prototype.slice.call(arguments)
      , constructor
      , task
      , type
      , name
      , action
      , opts
      , prereqs = [];

      type = args.shift()

    // name, [deps], [action]
    // Name (string) + deps (array) format
    if (typeof args[0] == 'string') {
      name = args.shift();
      if (Array.isArray(args[0])) {
        prereqs = args.shift();
      }
      if (typeof args[0] == 'function') {
        action = args.shift();
        opts =  args.shift() || {};
      }
    }
    // name:deps, [action]
    // Legacy object-literal syntax, e.g.: {'name': ['depA', 'depB']}
    else {
      obj = args.shift()
      for (var p in obj) {
        prereqs = prereqs.concat(obj[p]);
        name = p;
      }
      action = args.shift();
      opts =  args.shift() || {};
    }

    switch (type) {
      case 'directory':
        action = function () {
          
          // Recursive mkdir from https://gist.github.com/319051
          // mkdirsSync(path, [mode=(0777^umask)]) -> pathsCreated
          function mkdirsSync(dirname, mode) {
            if (mode === undefined) mode = 0x1ff ^ process.umask();
            var pathsCreated = [], pathsFound = [];
            var fn = dirname;
            while (true) {
              try {
                var stats = fs.statSync(fn);
                if (stats.isDirectory())
                  break;
                throw new Error('Unable to create directory at '+fn);
              }
              catch (e) {
                if (e.code === 'ENOENT') {
                  pathsFound.push(fn);
                  fn = path.dirname(fn);
                }
                else {
                  throw e;
                }
              }
            }
            for (var i=pathsFound.length-1; i>-1; i--) {
              var fn = pathsFound[i];
              fs.mkdirSync(fn, mode);
              pathsCreated.push(fn);
            }
            return pathsCreated;
          };
          
          if (!path.existsSync(name)) {
            mkdirsSync(name, 0755);
          }
        };
        constructor = DirectoryTask;
        break;
      case 'file':
        constructor = FileTask;
        break;
      default:
        constructor = Task;
    }
    
    var fullName = name;
    for (var ns = jake.currentNamespace; ns; ns = ns.parentNamespace) {
        if (ns !== jake.defaultNamespace) fullName = ns.name + ':' + fullName;
    }
    task = jake.Task[fullName];
    if (task) {
      if (task.type != type && type != "task") {
        throw new Error('Cannot change type of task ' + fullName + ' from ' +
                        task.type + ' to ' + type);
      }
      task.prereqs.push.apply(task.prereqs, prereqs);
      if (action) task.action = action;
    } else {
      task = new constructor(name, prereqs, action, opts);
      task.type = type;
      jake.currentNamespace.tasks[name] = task;
      task.fullName = fullName;
      jake.Task[fullName] = task;
    }
    
    if (jake.currentTaskDescription) {
      task.description = jake.currentTaskDescription;
      jake.currentTaskDescription = null;
    }
  };

}();

jake.Task = Task;
jake.FileTask = FileTask;
jake.DirectoryTask = DirectoryTask;
jake.Namespace = Namespace;

module.exports = jake;
