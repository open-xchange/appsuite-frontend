/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 * Provides a simple implementation for chaining tasks back to back.
 *
 */
/*global
define: true
*/

define('io.ox/core/taskQueue', function () {

    'use strict';

    /**
    * A task is a unit of work. A task is constructed form a task definition. The task definition must contain a method #perform which returns a deferred object.
    * A task is in one of four states 'initial', 'running', 'done' and 'invalidated'. Another task can be chained back to back to this task by calling the #chainTask method
    * with another task definition. It will be performed once this task has been completed. Use #when to get hold of a deferred object that is resolved once the task is done.
    * #start begins the task execution and returns the deferred for this task object. #start can be called multiple times, only the first call will trigger the taskDefs perform method
    * subsequent calls return the already resolved deferred object instead.
    */
    function Task(taskDef) {
        var deferred = $.Deferred(),
            self = this;

        _.extend(this, taskDef);

        this.state = 'initial';

        this.start = function (runNext) {
            if (this.state === 'invalidated') {
                return;
            }
            if (this.state === 'done' && this.nextTask) {
                if (runNext) {
                    this.nextTask.start(true);
                }
                return deferred;
            }
            if (this.state !== 'initial') {
                return deferred;
            }
            this.state = 'running';
            taskDef.perform().always(function () {
                self.state = 'done';
                self.result = $.makeArray(arguments);
                deferred.resolve.apply(deferred, self.result);
                if (runNext && self.nextTask) {
                    self.nextTask.start(true);
                }
            });

            return deferred;
        };

        this.invalidate = function () {
            this.state = 'invalidated';
        };

        this.when = function () {
            return deferred;
        };

        this.chainTask = function (taskDef) {
            return (this.nextTask = new Task(taskDef));
        };

        this.destroy = function () {
            this.invalidate();
            this.next = null;
            this.result = null;
        };
    }

    /**
    * A Queue can be used to manage a queue of tasks that are supposed to be executed back to back. Use #enqueue with
    * a task definition to add to the queue. Once the queue has been started via #start every task that is enqueued will be started
    * eventually (and in the order they have been added to the queue). #fasttrack can be used to immediately execute a given task, essentially in parallel with
    * the remaining tasks in the queue. #when obtains the deferred associated with a given task. #get retrieves the task. If a taskDef doesn't contain an id value, one will be provided for it.
    */
    function Queue() {
        var tasks = {};
        var nextId = 1;
        var firstTask = null;
        var lastTask = null;
        var state = 'stopped';

        this.enqueue = function (taskDef) {
            var triggerStart = state === 'running';

            if (!taskDef.id) {
                taskDef.id = nextId;
                nextId = nextId + 1;
            }
            if (!firstTask) {
                firstTask = new Task(taskDef);
                lastTask = firstTask;
            } else {
                triggerStart = state === 'running' && lastTask.state === 'done';
                lastTask = lastTask.chainTask(taskDef);
            }

            tasks[taskDef.id] = lastTask;
            if (triggerStart) {
                lastTask.start(true);
            }
        };

        this.fasttrack = function (taskId) {
            if (tasks[taskId]) {
                return tasks[taskId].start();
            }
            throw new Error('Unknown TaskId ' + taskId);
        };

        this.get = function (taskId) {
            return tasks[taskId];
        };

        this.when = function (taskId) {
            if (tasks[taskId]) {
                return tasks[taskId].when();
            }
            throw new Error('Unknown TaskId ' + taskId);
        };

        this.start = function () {
            state = 'running';
            if (firstTask) {
                firstTask.start(true);
            }
        };

        this.destroy = function () {
            _(tasks).invoke('destroy');
        };

        this.tasks = function () {
            return _(tasks);
        };
    }

    return {
        Task: Task,
        Queue: Queue
    };
});
