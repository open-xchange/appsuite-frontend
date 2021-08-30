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

define('io.ox/core/extPatterns/actions', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'io.ox/core/collection',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/actions/util'
], function (ext, upsell, Collection, capabilities, util) {

    'use strict';

    var requires = function (str) {
        return function (e) {
            return e.collection.has.apply(e.collection, str.split(/ /));
        };
    };

    var requiresOne = function (e) {
        return e.collection.has('one');
    };

    var Action = function (id, options) {
        if (ox.debug) console.warn('Action is DEPRECATED with 7.10.2 (io.ox/core/extPatterns/actions.js)', options);
        // get options - use 'requires one' as default
        var o = _.extend({ id: 'default', index: 100, requires: requiresOne }, options);
        // string?
        if (_.isString(o.requires)) {
            o.requires = requires(o.requires);
        }
        // extend point
        ext.point(id).extend(o);
    };

    var without = function (a) {
        return !_(this).any(function (b) {
            return _.isEqual(a, b);
        });
    };

    // check if an action can be called based on a given list of items
    // arg is array or baton
    var check = function (ref, arg) {
        var collection = new Collection(_.isArray(arg) ? arg : []);
        return collection.getProperties().pipe(function () {
            return processActions(ref, collection, ext.Baton.ensure(arg)).pipe(function () {
                return _(arguments).any(function (bool) { return bool === true; }) ?
                    $.Deferred().resolve(true) :
                    $.Deferred().reject(false);
            });
        });
    };

    var invoke = function (ref, context, baton) {

        // make sure we have a baton
        baton = ext.Baton.ensure(baton);

        // add a list to track which items are processed
        baton.tracker = [].concat(baton.data);

        var point = ext.point(ref),
            // get all sets of capabilities including empty sets
            sets = point.pluck('capabilities'),
            ignoreEmptyTracker = baton.tracker.length === 0,
            list = point.list(), i = 0, $i = list.length, extension, tmp;

        // check capabilities upfront; if no action can be applied due to missing
        // capabilities, we try to offer upsell
        // if an action has an empty set we must not run into upsell (see bug 39009)
        if (sets.length && !upsell.any(sets)) {
            if (upsell.enabled(sets)) {
                upsell.trigger({
                    type: 'inline-action',
                    id: ref,
                    missing: upsell.missing(sets)
                });
            }
            return;
        }

        // loop over all actions; skip 'default' extension if preventDefault was called
        for (; i < $i && !baton.isPropagationStopped(); i++) {
            extension = list[i];
            // avoid default behaviour?
            if (extension.id === 'default' && baton.isDefaultPrevented()) continue;
            // check for disabled extensions
            if (baton.isDisabled(point.id, extension.id)) continue;
            // has all capabilities?
            if (extension.capabilities && !capabilities.has(extension.capabilities)) continue;
            // empty tracker?
            if (!ignoreEmptyTracker && baton.tracker.length === 0) break;
            // apply filter
            if (_.isFunction(extension.filter)) {
                tmp = _(baton.tracker).filter(extension.filter);
                // _.without does not work here
                baton.tracker = _(baton.tracker).filter(without, tmp);
            } else {
                tmp = baton.tracker.slice();
            }
            if (tmp.length || ignoreEmptyTracker) {
                // call handlers
                try {
                    if (_.isFunction(extension.action)) {
                        extension.action.call(context, baton);
                    }
                    if (_.isFunction(extension.multiple)) {
                        // make sure to always provide an array
                        extension.multiple.call(context, tmp, baton);
                    }
                } catch (e) {
                    console.error('point("' + ref + '") > invoke()', e.message, {
                        baton: baton,
                        context: context,
                        extension: extension,
                        exception: e
                    });
                }
            }
        }
    };

    var processActions = function (ref, collection, baton) {
        // allow extensions to cancel actions
        var stopped = false,
            stopPropagation = function () {
                stopped = true;
            };

        // combine actions
        var defs = ext.point(ref).map(function (action) {

            var retRequires, retStatic, retMatches, actionBaton, params = {};

            if (stopped) return $.when(false);

            try {
                if (action.matches || action.collection || action.device || action.folder || ('toogle' in action)) {
                    // new school
                    actionBaton = ext.Baton({
                        app: baton.app,
                        collection: collection,
                        data: [].concat(baton.data),
                        folder_id: baton.app && baton.app.folder.get(),
                        stopPropagation: stopPropagation
                    });
                    if (!util.checkActionAvailability(action)) {
                        retStatic = false;
                    } else if (!util.checkActionEnabled(actionBaton, action)) {
                        retStatic = false;
                    } else {
                        retStatic = true;
                        if (_.isFunction(action.matches)) {
                            retMatches = action.matches(actionBaton);
                        }
                    }
                } else if (_.isFunction(action.requires)) {
                    // old school
                    params = {
                        baton: baton,
                        collection: collection,
                        context: baton.data,
                        extension: action,
                        point: ref,
                        stopPropagation: stopPropagation
                    };
                    retRequires = action.requires(params);
                }
            } catch (e) {
                params.exception = e;
                console.error(
                    'point("' + ref + '") > "' + action.id + '" > processActions() > requires()', e.message, e.stack, params
                );
            }

            if (retRequires) return $.when(retRequires);
            if (retStatic === false) return $.when(false);
            if (retMatches) return $.when(retMatches);
            return $.when(true);
        })
        .value();

        return $.when.apply($, defs);
    };

    var customClick = function (e) {
        invoke(e.data.ref, this, e.data.selection, e);
    };

    var updateCustomControls = function (container, selection, options) {
        var deferred = $.Deferred(),
            collection = new Collection(selection),
            controls = container.find('[data-action]');

        options = $.extend({
            cssDisable: false,
            eventType: 'click'
        }, options);

        collection.getProperties().done(function () {
            // find nodes that refer to an action
            $.when.apply($,
                _(controls).map(function (node) {
                    node = $(node);
                    var ref = node.attr('data-action');
                    return processActions(ref, collection, selection).done(function (result) {
                        if (result === false) {
                            node.prop('disabled', true).off(options.eventType + '.action');
                            if (options.cssDisable) {
                                node.addClass('disabled');
                            }
                        } else {
                            node.prop('disabled', false)
                                .removeClass('disabled')
                                .off(options.eventType + '.action')
                                .on(options.eventType + '.action', { ref: ref, selection: selection }, customClick);
                        }
                    });
                })
            )
            .done(deferred.resolve);
        });

        return deferred.done(function () {
            collection = selection = controls = null;
        });
    };

    var applyCollection = function (ref, collection, baton, args) {

        if (!ref) return $.when();

        baton = ext.Baton.ensure(baton);

        // resolve collection's properties
        var linksResolved = new $.Deferred();

        collection.getProperties().pipe(
            function () {
                // get links (check for requirements)
                var links = ext.point(ref).map(function (link) {
                    // defer decision
                    var def = $.Deferred();
                    // plain link without action?
                    if (!link.ref) {
                        return def.resolve({ link: link, state: true });
                    }
                    // process actions
                    if (link.isEnabled && !link.isEnabled.apply(link, args)) {
                        // link is disabled
                        return def.resolve({ link: link, state: false });
                    }
                    // concat all extensions valid capability properties
                    var capabilities = ext.point(link.ref).pluck('capabilities');
                    if (!upsell.visible(capabilities)) {
                        // no capabilities match AND no upsell available
                        return def.resolve({ link: link, state: false });
                    }
                    // combine actions
                    return processActions(link.ref, collection, baton).pipe(function () {
                        var state = _(arguments).any(function (bool) { return bool === true; });
                        return { link: link, state: state };
                    });
                });
                // wait for all links
                $.when.apply($, links.value()).done(function () {
                    linksResolved.resolve(_(arguments).toArray());
                    links = null;
                });
            },
            function () {
                linksResolved.resolve([]);
            }
        );

        return linksResolved;
    };

    return {
        Action: Action,
        check: check,
        invoke: invoke,
        applyCollection: applyCollection,
        updateCustomControls: updateCustomControls
    };

});
