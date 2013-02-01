/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/api', ['io.ox/core/http',
                           'io.ox/core/config',
                           'io.ox/core/api/factory',
                           'io.ox/core/api/folder'], function (http, configApi, apiFactory, folderApi) {

    'use strict';


 // generate basic API
    var api = apiFactory({
        module: 'tasks',
        keyGenerator: function (obj) {
            var folder = null;
            if (obj.folder) {
                folder = obj.folder;
            } else if (obj.folder_id) {
                folder = obj.folder_id;
            } else {
                console.log('no folderAttribute for cache Keygen found, using default');
                folder = folderApi.getDefaultFolder('tasks');
            }

            return obj ? folder + '.' + obj.id : '';
        },
        requests: {
            all: {
                folder: folderApi.getDefaultFolder('tasks'),
                columns: '1,20,101,200,202,203,220,300,301',
                sort: '202',
                order: 'asc',
                cache: true, // allow DB cache
                timezone: 'UTC'
            },
            list: {
                action: 'list',
                columns: '1,20,101,200,202,203,220,300,301,309',
                timezone: 'UTC'
            },
            get: {
                action: 'get',
                timezone: 'UTC'
            },
            search: {
                action: 'search',
                columns: '1,20,200,202,220,300,301',
                sort: '202',
                order: 'asc',
                timezone: 'UTC',
                getData: function (query) {
                    return { folder: query.folder, pattern: query.pattern };
                }
            }
        }
    });

    //current participantsmodel is heavily overloaded but does not contain the needed information ... maybe include this in the standard participants model if calendar etc need the same
    function repairParticipants(participants) {
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
    }
    
    api.create = function (task) {
        task.participants = repairParticipants(task.participants);
        return http.PUT({
            module: 'tasks',
            params: {action: 'new',
                     timezone: 'UTC'},
            data: task,
            appendColumns: false
        });
    };
    
    api.checkForNotifications = function (ids, modifications) {
        var addArray = [],
            removeArray = [];
        if (modifications.status) {//status parameter can be string or integer. Force it to be an integer
            modifications.status = parseInt(modifications.status, 10);
        }
        //check overdue
        if (modifications.status === 3 || modifications.end_date === null) {
            api.trigger('remove-overdue-tasks', ids);
        } else if (modifications.status || modifications.end_date) {
            //current values are needed for further checks
            api.getList(ids, false).done(function (list) {
                _(list).each(function (task) {
                    if (task.status !== 3 && task.end_date) {
                        if (task.end_date < _.now()) {
                            addArray.push(task);
                        } else {
                            removeArray.push(task);
                        }
                    }
                });
                if (addArray.length > 0) {
                    api.trigger('add-overdue-tasks', addArray);
                }
                if (removeArray.length > 0) {
                    api.trigger('remove-overdue-tasks', removeArray);
                }
            });
        }
    };

    api.update = function (task, newFolder) {
                //check if oldschool argument list was used (timestamp, taskId, modifications, folder) convert and give notice
                if (arguments.length > 2) {
                    console.log("Using old api signature.");
                    task = arguments[2];
                    task.folder_id = arguments[3];
                    task.id = arguments[1];
                }
                
                var useFolder = task.folder_id || task.folder,
                    timestamp = task.last_modified || _.now();
                
                if (newFolder && arguments.length === 2) { //folder is only used by move operation, because here we need 2 folder attributes
                    task.folder_id = newFolder;
                }
                task.notification = true;//set allways (OX6 does this too)
                
                if (useFolder === undefined) {//if no folder is given use default
                    useFolder = api.getDefaultFolder();
                }
                var key = useFolder + '.' + task.id;
                return http.PUT({
                    module: 'tasks',
                    params: {action: 'update',
                        folder: useFolder,
                        id: task.id,
                        timestamp: timestamp,
                        timezone: 'UTC'
                    },
                    data: task,
                    appendColumns: false
                }).pipe(function () {
                    // update cache
                    return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
                }).pipe(function () {
                    //return object with id and folder id needed to save the attachments correctly
                    var obj = {folder_id: useFolder, id: task.id};
                    //notification check
                    api.checkForNotifications([obj], task);
                    return obj;
                }).done(function () {
                    //trigger refresh, for vGrid etc
                    api.trigger('refresh.all');
                });

            };
            
    //used by done/undone actions when used with multiple selection
    api.updateMultiple = function (list, modifications) {
        http.pause();
        modifications.notification = true;//set allways (OX6 does this too)
        var keys  = [];
        
        _(list).map(function (obj) {
            keys.push((obj.folder || obj.folder_id) + '.' + obj.id);
            return http.PUT({
                module: 'tasks',
                params: {
                    action: 'update',
                    id: obj.id,
                    folder: obj.folder || obj.folder_id,
                    timestamp: _.now(),
                    timezone: 'UTC'
                },
                data: modifications,
                appendColumns: false
            });
        });
        return http.resume().pipe(function () {
            // update cache
            return $.when(api.caches.get.remove(keys), api.caches.list.remove(keys));
        }).done(function () {
            //notification check
            api.checkForNotifications(list, modifications);
            //trigger refresh, for vGrid etc
            api.trigger('refresh.all');
        });
    };
    
    api.move = function (task, newFolder) {
        var folder;
        if (!task.length) {
            folder = task.folder_id;
            if (!folder) {
                folder = task.folder;
            }
        }
        
        // call updateCaches (part of remove process) to be responsive
        return api.updateCaches(task).pipe(function () {
            // trigger visual refresh
            api.trigger('refresh.all');
            function refreshPortal() {
                api.trigger("removePopup");
                require(['io.ox/portal/main'], function (portal) {//refresh portal
                    var app = portal.getApp(),
                        model = app.getWidgetCollection()._byId.tasks_0;
                    if (model) {
                        app.refreshWidget(model, 0);
                    }
                });
            }
            if (!task.length) {
                return api.update(task, newFolder).done(refreshPortal);
            } else {
                return api.updateMultiple(task, {folder_id: newFolder}).done(refreshPortal);
            }
        });
    };
    
    api.confirm =  function (options) { //options.id is the id of the task not userId
        var key = (options.folder_id || options.folder) + '.' + options.id;
        return http.PUT({
            module: 'tasks',
            params: {
                action: 'confirm',
                folder: options.folder_id || options.folder,
                id: options.id,
                timezone: 'UTC'
            },
            data: options.data, // object with confirmation attribute
            appendColumns: false
        }).pipe(function (response) {
            // update cache
            return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
        });
    };

    api.getDefaultFolder = function () {
        return folderApi.getDefaultFolder('tasks');
    };
    
    //gets every task in users private folders. Used in Portal tile
    api.getAllFromAllFolders = function () {
        return http.PUT({
            module: 'folders',
            params: {
                action: 'allVisible',
                content_type: 'tasks',
                columns: "1"
            }
        }).pipe(function (response) {
            //get the data
            return $.when.apply($,
                _(response['private']).map(function (value) {
                    return api.getAll({folder: value[0]}, false);//no caching here otherwise refresh uses old cache when moving a task
                })
            ).pipe(function () {
                return _.flatten(_.toArray(arguments), true);
            });
        });
    };

    //for notification view
    api.getTasks = function () {

        return http.GET({
            module: 'tasks',
            params: {action: 'all',
                folder: api.getDefaultFolder(),
                columns: '1,20,200,202,220,203,300,309',
                sort: '202',
                order: 'asc',
                timezone: 'UTC'
            }
        }).pipe(function (list) {
            // sorted by end_date filter over due Tasks
            var now = new Date(),
                userId = configApi.get('identifier'),
                dueTasks = [],
                confirmTasks = [];
            for (var i = 1; i < list.length; i++) {
                var filterOverdue = (list[i].end_date < now.getTime() && list[i].status !== 3 && list[i].end_date !== null);
                if (filterOverdue) {
                    dueTasks.push(list[i]);
                }
                for (var a = 0; a < list[i].participants.length; a++) {
                    if (list[i].participants[a].id === userId && list[i].participants[a].confirmation === 0) {
                        confirmTasks.push(list[i]);
                        
                    }
                }
            }
            api.trigger('new-tasks', dueTasks);//even if empty array is given it needs to be triggered to remove notifications that does not exist anymore(already handled in ox6 etc)
            api.trigger('confirm-tasks', confirmTasks);//same here
            return list;
        });
    };

    // global refresh
    api.refresh = function () {
        if (ox.online) {
            // clear 'all & list' caches
            api.caches.all.clear();
            api.caches.list.clear();
            api.getTasks().done(function () {
                // trigger local refresh
                api.trigger('refresh.all');
            });
        }

    };

    return api;
});
