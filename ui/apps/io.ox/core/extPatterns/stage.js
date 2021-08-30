/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/extPatterns/stage', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var global_counter = 1;

    var Stage = function (id, options) {
        // options should have a 'run' function
        ext.point(id).extend(options);
    };

    // Keeps batons for running extension points
    Stage.pending = {};

    // Determines whether an extension point is currently being run
    Stage.isRunning = function (id) {
        return !_.isEmpty(Stage.pending[id]);
    };

    // Aborts a specific run of an extension
    // You can also call baton.stopPropagation() to
    // skip other stages
    Stage.abort = function (id, run_id) {
        if (Stage.pending[id] && Stage.pending[id][run_id]) {
            Stage.pending[id][run_id].baton.stopPropagation();
        }
    };

    // Stops propagation on all running instances of an
    // extension point
    Stage.abortAll = function (id) {
        _(Stage.pending[id]).each(function (baton) {
            baton.stopPropagation();
        });
    };

    // Run an extension point extensions serially.
    // Extension points 'run' method can return a promise
    // and the subsequent steps will only run after the
    // promise has resolved successfully. Set's the run_id and deferred on the baton.
    // You can skip extensions by calling baton.disable(id) or baton.preventDefault() to skip the
    // extension with the 'default' id. You can abort a run by calling baton.stopPropagation()
    // id: The id of the extension point
    // baton: ext.Baton instance to pass between extensions
    // options:
    //    methodName: The method to invoke on the extensions. Default: run
    //    softFail: continue invocation even if an extension rejected
    //    beginWith: Pick an extension id in the extensions to start the run with. All extensions before this
    //                      before this are skipped. Mutually exclusive with beginAfter
    //    beginAfter: Skip all extensions up to and including the one with the id given in 'beginAfter'
    Stage.run = function (id, baton, options) {
        options = options || {};
        // Method name defaults to 'run'
        options.methodName = options.methodName || 'run';
        baton = ext.Baton.ensure(baton);
        var list = ext.point(id).list(),
            def = $.Deferred(),
            // Give this run through a unique ID
            run_id = global_counter++;
        // Set the ID on the baton
        if (!baton.run_id) {
            baton.run_id = id;
        }
        // Also remember the deferred
        if (!baton.deferred) {
            baton.deferred = def;
        }
        // Mark this extension point as running
        if (!Stage.pending[id]) {
            Stage.pending[id] = {};
        }
        Stage.pending[id][run_id] = baton;
        def.always(function () {
            // Clean up
            delete Stage.pending[id][run_id];
        });

        if (options.beginWith || options.beginAfter) {
            // skip ahead
            list = list.reduce(function (acc, p) {
                if (_.isArray(acc)) return acc.concat(p);
                if (options.beginAfter === p.id) return [];
                if (options.beginWith === p.id) return [p];
            }, null);
        }

        list.reduce(function (def, p) {
            if (!def || !def.then) def = $.when(def);
            return def.then(_.identity, function softFail(err) {
                if (options.softFail === true) {
                    return $.when();
                }
                return $.Deferred().reject(err);
            }).then(function () {
                if (baton.isPropagationStopped() ||
                    p.id === 'default' && baton.isDefaultPrevented() ||
                    baton.isDisabled(id, p.id)
                ) return;

                return (p[options.methodName] || $.noop)(baton);
            });
        }, $.when()).then(def.resolve, def.reject);
        return def;
    };

    return Stage;
});
