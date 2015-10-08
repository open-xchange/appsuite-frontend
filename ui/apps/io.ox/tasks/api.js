/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/api', [
    'io.ox/core/http',
    'io.ox/core/api/factory',
    'io.ox/core/folder/api'
], function (http, apiFactory, folderAPI) {

    'use strict';

    var api,
        // object to store tasks, that have attachments uploading atm
        uploadInProgress = {},
        //variables so portal is only required once
        portalModel,
        portalApp,

        /**
         * notificate
         * @private
         * @param  {object} currentvalues (object with current task data from backend(after update/create))
         * @param  {object} modifications
         * qparam  {boolean} create (if this was called after a create action, default = false)
         * @fires  api#mark:task:confirmed (ids)
         * @fires  api#mark:overdue (ids)
         * @fires  api#unmark:overdue (ids)
         * @return { undefined }
         */
        checkForNotifications = function (currentValues, modifications, create) {
            //check move
            if (modifications.folder_id && modifications.folder_id !== currentValues.folder_id) {
                api.getTasks();
                require(['io.ox/core/api/reminder'], function (reminderAPI) {
                    reminderAPI.getReminders();
                });
            } else {
                //check alarm
                if ((modifications.alarm !== undefined) || (create && modifications.alarm)) {
                    require(['io.ox/core/api/reminder'], function (reminderAPI) {
                        reminderAPI.getReminders();
                    });
                }
                //check participants
                if (modifications.participants) {
                    var myId = ox.user_id,
                        triggered = false;
                    //user is added to a task
                    _(modifications.participants).each(function (obj) {
                        if (obj.id === myId) {
                            triggered = true;
                            api.trigger('mark:task:to-be-confirmed', [currentValues]);
                        }
                    });
                    //user is not in the current participants
                    if (!triggered) {
                        api.trigger('mark:task:confirmed', [currentValues]);
                    }
                }
                //check overdue
                if (modifications.status || (modifications.end_time !== undefined)) {
                    if (currentValues.status !== 3 && currentValues.end_time < _.utc()) {
                        api.trigger('mark:overdue', [currentValues]);
                    } else {
                        api.trigger('unmark:overdue', [currentValues]);
                    }
                }
            }
        },

        /**
         * applies task modifications to all cache
         * @private
         * @param  {array} tasks (objects with id and folder_id)
         * @param  {string} folder (folder id of the current folder)
         * @param  {object} modfications (modifications of the cachevalues)
         * @return { deferred }
         */
        updateAllCache = function (tasks, folder, modifications) {

            var list = _.copy(tasks, true),
            //make sure we have an array
            list = list || [];
            list = _.isArray(list) ? list : [list];

            //is's empty. nothing to do
            if (list.length === 0) {
                return $.when();
            }
            //make sure ids are strings
            folder = folder.toString();
            _(list).each(function (task) {
                task.id = task.id.toString();
                task.folder_id = task.folder_id.toString();
            });

            //move operation
            if (list[0].folder_id && list[0].folder_id !== folder) {
                return api.caches.all.clear();
            }
            var found = false,
                cacheKey = api.cid({
                    folder: folder,
                    sort: api.options.requests.all.sort,
                    order: api.options.requests.all.order
                });
            //look for items and copy modifications to the cache to make it valid again
            return api.caches.all.get(cacheKey).then(function (cachevalue) {
                if (cachevalue) {
                    _(cachevalue).each(function (singlevalue) {
                        _(list).each(function (item) {
                            if (singlevalue.id.toString() === item.id && singlevalue.folder_id.toString() === folder) {
                                //apply modified values
                                _.extend(singlevalue, modifications);
                                found = true;
                            }
                        });

                    });
                    if (found) {
                        return api.caches.all.add(cacheKey, cachevalue);
                    } else {
                        return $.when();
                    }
                } else {
                    //just leave it to the next all request, no need to do it here
                    return $.when();
                }
            });
        },

        /**
         * gets every task in users private folders. Used in Portal tile
         * @private
         * @return { deferred }
         */
        getAllFromAllFolders = function () {
            return api.search({ pattern: '', end: _.now() });
        },

        /**
         * refreshs the task portal tile
         * @private
         * @return { undefined }
         */
        refreshPortal = function () {
            if (portalModel && portalApp) {
                portalApp.refreshWidget(portalModel, 0);
            } else {
                //refresh portal
                require(['io.ox/portal/main'], function (portal) {
                    portalApp = portal.getApp();
                    portalModel = portalApp.getWidgetCollection()._byId.tasks_0;
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });
            }
        },

        /**
         * return array of participants with normalized properties
         * @param  {array} participants (objects)
         * @return { array }
         */
        repairParticipants = function (participants) {
            //current participantsmodel is heavily overloaded but does not
            //contain the needed information ... maybe include this in the
            //standard participants model if calendar etc need the same
            var list = [];
            if (participants && participants.length > 0) {
                _(participants).each(function (participant) {
                    var tmp = {};
                    tmp.type = participant.type;
                    switch (participant.type) {
                    case 1://internal user
                        tmp.type = participant.type;
                        tmp.mail = participant.email1;
                        tmp.display_name = participant.display_name;
                        tmp.id = participant.id;
                        break;
                    case 5://external user
                        tmp.type = participant.type;
                        tmp.mail = participant.mail;
                        tmp.display_name = participant.display_name;
                        tmp.id = 0;
                        break;
                    default://all the rest
                        tmp = participant;
                        break;
                    }
                    list.push(tmp);
                });
                return list;
            } else {
                return participants;
            }
        };

    // generate basic API
    api = apiFactory({
        module: 'tasks',
        keyGenerator: function (obj) {
            var folder = null;
            if (obj) {
                if (obj.folder) {
                    folder = obj.folder;
                } else if (obj.folder_id) {
                    folder = obj.folder_id;
                } else {
                    //no folderAttribute for cache Keygen found, using default
                    folder = folderAPI.getDefaultFolder('tasks');
                }
            }

            return obj ? folder + '.' + obj.id : '';
        },
        requests: {
            all: {
                folder: folderAPI.getDefaultFolder('tasks'),
                columns: '1,20,101,200,203,220,300,301,317',
                extendColumns: 'io.ox/tasks/api/all',
                sort: '317',
                order: 'asc',
                // allow DB cache
                cache: true,
                timezone: 'UTC'
            },
            list: {
                action: 'list',
                columns: '1,2,20,101,200,203,220,221,300,301,309,317,401',
                extendColumns: 'io.ox/tasks/api/list',
                timezone: 'UTC'
            },
            get: {
                action: 'get',
                timezone: 'UTC'
            },
            search: {
                action: 'search',
                columns: '1,2,20,101,200,203,220,221,300,301,309,317',
                extendColumns: 'io.ox/tasks/api/all',
                sort: '317',
                order: 'asc',
                timezone: 'UTC',
                getData: function (query) {
                    return { pattern: query.pattern, end: query.end, start: query.start };
                }
            }
        }
    });

    /**
     * remove from get/list cache
     * @param  {string|array} key
     * @fires  api#create (task)
     * @return { promise }
     */
    api.removeFromCache = function (key) {
        return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
    };

    /**
     * create a task
     * @param  {object} task
     * @return { deferred} done returns object with id property
     */
    api.create = function (task) {
        task.participants = repairParticipants(task.participants);
        var attachmentHandlingNeeded = task.tempAttachmentIndicator,
            response;
        delete task.tempAttachmentIndicator;
        //task.alarm must not be null on creation, it's only used to delete an alarm on update actions
        if (task.alarm === null) {
            //leaving it in would throw a backend error
            delete task.alarm;
        }
        if (task.priority === 'null' || !task.priority) {
            delete task.priority;
        }
        //make sure we have an integer here
        if (task.status) {
            task.status = parseInt(task.status, 10);
        }
        if (task.status === 3) {
            //make sure we have date_completed
            task.date_completed = task.date_completed || _.now();
        } else {
            //remove invalid date_completed
            delete task.date_completed;
        }
        return http.PUT({
            module: 'tasks',
            params: { action: 'new', timezone: 'UTC' },
            data: task,
            appendColumns: false
        }).then(function (obj) {
            task.id = obj.id;
            response = obj;

            return $.when(
                api.caches.all.grepRemove(task.folder_id + api.DELIM),
                api.caches.get.add(task),
                api.caches.list.merge(task)
           );
        }).then(function () {
            if (attachmentHandlingNeeded) {
                //to make the detailview show the busy animation
                api.addToUploadList(_.ecid(task));
            }
            checkForNotifications(task, task, true);
            api.trigger('create', task);
            api.trigger('refresh.all');
            return response;
        });
    };

    /**
     * update single task
     * @param  {object} task (id, folder_id, 'changed attributes')
     * @param  {string} newFolder (optional; target folder id)
     * @fires  api#refresh.all
     * @fires  api#update:ecid
     * @return {[type]}
     */
    api.update = function (task, newFolder) {

        var obj,
            attachmentHandlingNeeded = task.tempAttachmentIndicator,
            useFolder = task.folder_id,
            move = false;

        //delete temp attributes
        delete task.tempAttachmentIndicator;
        delete task.timezone;

        //repair broken folder attribute
        if (task.folder) {
            useFolder = task.folder_id = task.folder;
            delete task.folder;
        }

        // recurrence attribute key present but undefined means it must be removed so set to null
        // this is different from calendar implementation, where recurrence attributes that are not in the request are set to null automatically by the backend
        if ( _(task).has('days') && task.days === undefined) {
            task.days = null;
        }
        if ( _(task).has('day_in_month ') && task.day_in_month  === undefined) {
            task.day_in_month = null;
        }
        if ( _(task).has('month') && task.month === undefined) {
            task.month = null;
        }

        //folder is only used by move operation, because here we need 2 folder attributes
        if (newFolder && arguments.length === 2) {
            task.folder_id = newFolder;
            move = true;
        }
        //set always (OX6 does this too)
        task.notification = true;

        //if no folder is given use default
        if (useFolder === undefined) {
            useFolder = api.getDefaultFolder();
        }

        if (task.status !== undefined) {

            // status might be undefined during an update
            // we only touch the completion date if we know the status (see bug 38587)

            // make sure we have an integer here
            task.status = parseInt(task.status, 10);

            // update/keep date_completed when status is 3 (done)
            task.date_completed = task.status === 3 ? (task.date_completed || _.now()) : null;
        }

        if (task.priority === 0) {
            task.priority = null;
        }

        var key = useFolder + '.' + task.id;

        return http.PUT({
            module: 'tasks',
            params: { action: 'update',
                folder: useFolder,
                id: task.id,
                timestamp: task.last_modified || _.then(),
                timezone: 'UTC'
            },
            data: _(task).omit('last_modified'),
            appendColumns: false
        })
        .then(function () {
            // update cache
            var sortChanged = false;
            //data that is important for sorting changed, so clear the all cache
            if (task.title || task.end_time || task.status) {
                sortChanged = true;
            }
            return $.when(
                    //api.get updates list and get caches
                    api.removeFromCache(key)
                        //api.get updates list and get caches
                        .then(function () { return api.get({ id: task.id, folder_id: newFolder || useFolder }); }),
                        sortChanged ? api.caches.all.clear() : updateAllCache([task], useFolder, task));
        })
        .then(function (data) {
            //return object with id and folder id needed to save the attachments correctly
            obj = { folder_id: useFolder, id: task.id };
            //notification check
            checkForNotifications(data, task, true);
            if (attachmentHandlingNeeded) {
                //to make the detailview show the busy animation
                api.addToUploadList(_.ecid(task));
            }
            return obj;
        })
        .done(function () {
            //trigger refresh, for vGrid etc
            api.trigger('refresh.all');
            if (move) {
                api.trigger('move', { id: task.id, folder_id: useFolder, newFolder: task.folder_id });
                api.trigger('move:' + _.ecid({ id: task.id, folder_id: useFolder }), task.folder_id);
            } else {
                api.trigger('update', { id: task.id, folder_id: useFolder });
                api.trigger('update:' + _.ecid({ id: task.id, folder_id: useFolder }));
            }
            refreshPortal();
        });

    };

    /**
     * update list of tasks used by done/undone and move actions when used with multiple selection
     * @param  {array}    list of task objects (id, folder_id)
     * @param  {object}   modifications
     * @fires  api#refresh.all
     * @return { deferred }
     */
    api.updateMultiple = function (list, modifications) {
        var keys  = [];
        //set always (OX6 does this too)
        modifications.notification = true;
        http.pause();

        _(list).map(function (obj) {
            //repair broken folder attribute
            if (obj.folder) {
                obj.folder_id = obj.folder;
                delete obj.folder;
            }
            keys.push(obj.folder_id + '.' + obj.id);
            return http.PUT({
                module: 'tasks',
                params: {
                    action: 'update',
                    id: obj.id,
                    folder: obj.folder_id,
                    timestamp: _.then(),
                    timezone: 'UTC'
                },
                data: modifications,
                appendColumns: false
            });
        });
        return http.resume().then(function () {
            // update cache
            return $.when(api.removeFromCache(keys), updateAllCache(list, modifications.folder_id || list[0].folder_id, modifications));
        }).done(function () {
            //update notifications
            //no exact checks here because multiple may contain a very large number of items
            api.getTasks();
            require(['io.ox/core/api/reminder'], function (reminderAPI) {
                reminderAPI.getReminders();
            });
            api.trigger('refresh.all');
            refreshPortal();
        });
    };

    /**
     * move task to folder
     * @param  {object|array} task (or array of tasks)
     * @param  {string} newFolder (target folder id)
     * @fires  api#refresh.all
     * @return { deferred} done returns object with properties folder_id and task id
     */
    api.move = function (task, newFolder) {

        // api.caches.all.grepRemove(targetFolderId + api.DELIM),
        // api.caches.all.grepRemove(o.folder_id + api.DELIM),
        // api.caches.list.remove({ id: o.id, folder: o.folder_id })

        // call updateCaches (part of remove process) to be responsive
        return api.updateCaches(task).then(function () {
            // trigger visual refresh
            api.trigger('refresh.all');

            if (!task.length) {
                return api.update(task, newFolder);
            } else if (task.length === 1) {
                return api.update(task[0], newFolder);
            } else {
                return api.updateMultiple(task, { folder_id: newFolder });
            }
        });
    };

    /**
     * change confirmation status
     * @param  {object} options (properties: data, folder_id, id)
     * @return { promise }
     */
    api.confirm =  function (options) {
        //options.id is the id of the task not userId
        var key = (options.folder_id || options.folder) + '.' + options.id;
        return http.PUT({
            module: 'tasks',
            params: {
                action: 'confirm',
                folder: options.folder_id || options.folder,
                id: options.id,
                timezone: 'UTC'
            },
            // object with confirmation attribute
            data: options.data,
            appendColumns: false
        }).then(function () {
            api.trigger('mark:task:confirmed', [{ id: options.id, data: options.data }]);
            // update cache
            return api.removeFromCache(key);
        });
    };

    /**
     * @return { string} default folder for tasks
     */
    api.getDefaultFolder = function () {
        return folderAPI.getDefaultFolder('tasks');
    };

    /**
     * used for portal plugin
     * @return { deferred} done returns list of tasks
     */
    api.getAllMyTasks = (function () {

        function delegatedToMe(participants) {
            return _(participants).any(function (user) {
                var isMe = user.type === 1 && user.id === ox.user_id,
                    isDeclined = user.confirmation === 2;
                return isMe && !isDeclined;
            });
        }

        function filter(task) {
            return (task.created_by === ox.user_id && (!task.participants || task.participants.length === 0)) || delegatedToMe(task.participants);
        }

        return function () {
            return getAllFromAllFolders().then(function (list) {
                return _(list).filter(filter);
            });
        };

    }());

    /**
     * get tasks for notification view
     * @fires api#new-tasks (dueTasks)
     * @fires api#set:tasks:to-be-confirmed (confirmTasks)
     * @return { deferred} done returns list of tasks
     */
    api.getTasks = function () {

        // no default folder returns an empty list
        // happens with guestmode
        if (!api.getDefaultFolder()) {
            return $.Deferred().resolve([]);
        }

        //could be done to use all folders, see portal widget but not sure if this is needed
        return http.GET({
            module: 'tasks',
            params: { action: 'all',
                folder: api.getDefaultFolder(),
                columns: '1,20,200,203,221,300,309,317',
                sort: '317',
                order: 'asc',
                timezone: 'UTC'
            }
        }).then(function (list) {
            // sorted by end_time filter over due Tasks
            var now = new Date(),
                userId = ox.user_id,
                dueTasks = [],
                confirmTasks = [];
            for (var i = 0; i < list.length; i++) {
                var filterOverdue = (list[i].end_time < now.getTime() && list[i].status !== 3 && list[i].end_time !== null);
                if (filterOverdue) {
                    dueTasks.push(list[i]);
                }

                //use users array here because participants array contains external participants and unresolved groups(members of this groups are in the users array)
                for (var a = 0; a < list[i].users.length; a++) {
                    if (list[i].users[a].id === userId && list[i].users[a].confirmation === 0) {
                        confirmTasks.push(list[i]);
                    }
                }
            }
            //even if empty array is given it needs to be triggered to remove
            //notifications that does not exist anymore (already handled in ox6 etc)
            api.trigger('new-tasks', dueTasks);
            //same here
            api.trigger('set:tasks:to-be-confirmed', confirmTasks);
            return list;
        });
    };

    /**
     * add task to the list
     * @param {string} key (task id)
     * @return { undefined }
     */
    api.addToUploadList = function (key) {
        uploadInProgress[key] = true;
    };

    /**
     * remove task from the list
     * @param  {string} key (task id)
     * @fires  api#update: + key
     * @return { undefined }
     */
    api.removeFromUploadList = function (key) {
        delete uploadInProgress[key];
        //trigger refresh
        api.trigger('update:' + key);
    };

    /**
     * ask if this task has attachments uploading at the moment (busy animation in detail View)
     * @param  {string} key (task id)
     * @return { boolean }
     */
    api.uploadInProgress = function (key) {
        return uploadInProgress[key] || false;
    };

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return { promise }
     */
    api.refresh = function () {
        if (ox.online) {
            // clear all caches
            $.when(
                api.caches.all.clear(),
                api.caches.list.clear(),
                api.caches.get.clear(),
                api.getTasks()
            ).done(function () {
                // trigger local refresh
                api.trigger('refresh.all');
            });
        }

    };

    api.on('create update', function (e, obj) {
        api.get(obj).then(function (obj) {
            // has participants?
            if (obj && _.isArray(obj.participants) && obj.participants.length > 0) {
                // check for external participants
                var hasExternalParticipants = _(obj.participants).some(function (participant) {
                    return participant.type === 5;
                });
                if (hasExternalParticipants) {
                    require(['io.ox/contacts/api'], function (contactsApi) {
                        contactsApi.trigger('maybyNewContact');
                    });
                }
            }
        });
    });

    return api;
});
