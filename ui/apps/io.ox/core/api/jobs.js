/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/api/jobs', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var longRunningJobs = {}, jobTimer;

    // A failsafe iterator that doesn't break the iteration when one callback throws an error.
    // This is important, because callbacks after a thrown error would not be invoked anymore.
    // This can lead to unresolved deferreds.
    function iterateCallbacksFailsafe(array, result) {
        _(array).each(function (cb) {
            try {
                cb(result);
            } catch (e) {
                // just catch errors to prevent that later callbacks are not invoked
                // IMPORTANT: this is normal behavior for the 'throw error' hack in files/api.js/'update()'
                if (ox.debug) { console.warn('Catched error inside callback, probably normal for quota error', e); }
            }
        });
    }

    var api = {

        updateJobTimer: function () {
            // timer is running although there are no jobs, stop it
            if (_(longRunningJobs).size() === 0 && jobTimer) {
                clearInterval(jobTimer);
                jobTimer = null;
                return;
            }
            // there is already a jobtimer running, nothing to be done here
            if (jobTimer) return;

            jobTimer = setInterval(function () {
                api.getInfo(_(longRunningJobs).keys()).done(function (data) {
                    var doneJobs = {};
                    _(data).each(function (job) {
                        if (job.error) {
                            // invalid id or no such job. Remove those broken jobs, to avoid creating useless requests and bloating logs.
                            if (job.error.code === 'SVL-0010') delete longRunningJobs[job.error.error_params[1]];
                            if (job.error.code === 'JOB-0002') delete longRunningJobs[job.error.error_params[0]];
                            return;
                        }
                        if (job.data && job.data.done) {
                            doneJobs[job.data.id] = longRunningJobs[job.data.id];
                            delete longRunningJobs[job.data.id];
                        }
                    });
                    api.updateJobTimer();

                    if (_(doneJobs).size === 0) return;

                    _(_(doneJobs).keys()).each(function (key) {
                        var job = doneJobs[key];
                        api.get(job.id).done(function (result) {
                            if (result.error && doneJobs[job.id].failCallback.length) {
                                iterateCallbacksFailsafe(doneJobs[job.id].failCallback, result);

                            } else if (doneJobs[job.id].successCallback.length) {
                                iterateCallbacksFailsafe(doneJobs[job.id].successCallback, result);
                            }

                            api.trigger('finished:' + job.id, result);
                            // used to trigger redraw of folderview
                            api.trigger('finished:' + job.showIn, result);
                        }).fail(function (result) {
                            iterateCallbacksFailsafe(doneJobs[job.id].failCallback, result);
                        });
                    });
                });
            }, 2000);
        },
        get: function (id) {
            if (!id) {
                return $.when();
            }

            return http.GET({
                module: 'jobs',
                params: {
                    action: 'get',
                    id: id
                }
            });
        },
        getInfo: function (ids) {
            ids = [].concat(ids);
            if (_.isEmpty(ids)) {
                return $.when();
            }
            http.pause();

            _(ids).each(function (id) {
                http.GET({
                    module: 'jobs',
                    params: {
                        action: 'info',
                        id: id
                    }
                });
            });
            return http.resume();
        },
        getAll: function () {
            return http.GET({
                module: 'jobs',
                params: {
                    action: 'all'
                }
            }).done(function (jobs) {
                _(jobs).each(function (job) {
                    api.addJob(_.extend({
                        // only infostore for now
                        showIn: 'infostore',
                        // use generic fallback
                        successCallback: [function () { ox.trigger('refresh.all'); }],
                        failCallback: [function () { ox.trigger('refresh.all'); }]
                    }, job));
                });
            });
        },
        cancelJob: function (ids) {
            ids = [].concat(ids);
            if (_.isEmpty(ids)) {
                return $.when();
            }

            return http.PUT({
                module: 'jobs',
                params: {
                    action: 'cancel'
                },
                data: ids
            }).then(function () {
                _(ids).each(function (id) {
                    delete longRunningJobs[id];
                });

                api.updateJobTimer();
            });
        },
        addJob: function (job) {
            if (!job) return;

            // make sure we have arrays
            job.failCallback = [].concat(job.failCallback);
            job.successCallback = [].concat(job.successCallback);

            // if it already exists we just add the callbacks
            if (longRunningJobs[job.id]) {
                longRunningJobs[job.id].failCallback = longRunningJobs[job.id].failCallback.concat(job.failCallback);
                longRunningJobs[job.id].successCallback = longRunningJobs[job.id].successCallback.concat(job.successCallback);
                return;
            }

            longRunningJobs[job.id] = job;

            api.trigger('added:' + job.id, { job: longRunningJobs[job.id] });
            api.trigger('added:' + job.showIn, { job: longRunningJobs[job.id] });
            // start the timer
            api.updateJobTimer();
        },
        getCurrentList: function (showIn) {
            if (showIn) {
                return _(longRunningJobs).where({ 'showIn': showIn });
            }

            return longRunningJobs;
        }
    };

    _.extend(api, Backbone.Events);

    return api;
});
