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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/extPatterns/actions', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'io.ox/core/collection'
], function (ext, upsell, Collection) {

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

    var invoke = function (ref, context, baton) {

        // make sure we have a baton
        baton = ext.Baton.ensure(baton);

        // add a list to track which items are processed
        baton.tracker = [].concat(baton.data);

        var point = ext.point(ref),
            capabilities = _(point.pluck('capabilities')).filter(function (cap) {return !_(cap).isEmpty(); }),
            ignoreEmptyTracker = baton.tracker.length === 0,
            list = point.list(), i = 0, $i = list.length, extension, tmp;

        // check capabilities upfront; if no action can be applied due to missing
        // capabilities, we try to offer upsell
        if (capabilities.length && !upsell.any(capabilities)) {
            if (upsell.enabled(capabilities)) {
                upsell.trigger({
                    type: 'inline-action',
                    id: ref,
                    missing: upsell.missing(capabilities)
                });
            }
            return;
        }

        // loop over all actions; skip 'default' extension if preventDefault was called
        for (; i < $i && !baton.isPropagationStopped(); i++) {
            extension = list[i];
            // avoid default behaviour?
            if (extension.id === 'default' && baton.isDefaultPrevented()) continue;
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
        var stopped = false, stopPropagation = function () {
            stopped = true;
        };

        // combine actions
        var defs = ext.point(ref).map(function (action) {

            var ret = true, params;

            if (stopped) {
                return $.Deferred().resolve(false);
            }

            if (_.isFunction(action.requires)) {
                params = {
                    baton: baton,
                    collection: collection,
                    context: baton.data,
                    extension: action,
                    point: ref,
                    stopPropagation: stopPropagation
                };
                try {
                    ret = action.requires(params);
                } catch (e) {
                    params.exception = e;
                    console.error(
                        'point("' + ref + '") > "' + action.id + '" > processActions() > requires()', e.message, params
                    );
                }
            }

            // is not deferred?
            if (ret !== undefined && !ret.promise) {
                ret = $.Deferred().resolve(ret);
            }
            return ret;
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
            controls = container.find('[data-action]'),
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

        collection.getProperties().then(
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
                    // store capabilities
                    var capabilities = ext.point(link.ref).pluck('capabilities');
                    if (!upsell.visible(capabilities)) {
                        // no capabilities match AND no upsell available
                        return def.resolve({ link: link, state: false });
                    }
                    // combine actions
                    return processActions(link.ref, collection, baton).then(function () {
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
        invoke: invoke,
        applyCollection: applyCollection,
        updateCustomControls: updateCustomControls
    };

});
