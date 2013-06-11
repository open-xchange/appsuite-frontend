/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/core/extPatterns/actions",
    ['io.ox/core/extensions',
     'io.ox/core/upsell',
     'io.ox/core/collection'], function (ext, upsell, Collection) {

    "use strict";

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

    var invoke = function (ref, scope, baton) {

        // make sure we have a baton
        baton = ext.Baton.ensure(baton);

        // add a list to track which items are processed
        baton.tracker = [].concat(baton.data);

        var point = ext.point(ref),
            capabilities = point.pluck('capabilities'),
            list = point.list(), i = 0, $i = list.length, extension, tmp;

        // check capabilities upfront; if no action can be applied due to missing
        // capabilities, we try to offer upsell
        if (!upsell.any(capabilities)) {
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
            if (baton.tracker.length === 0) break;
            // apply filter
            if (_.isFunction(extension.filter)) {
                tmp = _(baton.tracker).filter(extension.filter);
                baton.tracker = _(baton.tracker).filter(without, tmp); // _.without does not work here
            } else {
                tmp = baton.tracker.slice();
            }
            if (tmp.length) {
                // call handlers
                if (_.isFunction(extension.action)) {
                    extension.action.call(scope, baton);
                }
                if (_.isFunction(extension.multiple)) {
                    // make sure to always provide an array
                    extension.multiple.call(scope, tmp, baton);
                }
            }
        }
    };

    var processActions = function (ref, collection, baton) {
        // combine actions
        return $.when.apply($,
            ext.point(ref).map(function (action) {
                // get return value
                var ret = _.isFunction(action.requires) ?
                        action.requires({ collection: collection, context: baton.data, baton: baton }) : true;
                // is not deferred?
                if (ret !== undefined && !ret.promise) {
                    ret = $.Deferred().resolve(ret);
                }
                return ret;
            })
            .value()
        );
    };

    var customClick = function (e) {
        invoke(e.data.ref, this, e.data.selection, e);
    };

    var updateCustomControls = function (container, selection) {

        var deferred = $.Deferred(),
            collection = new Collection(selection),
            controls = container.find('[data-action]');

        collection.getProperties().done(function () {
            // find nodes that refer to an action
            $.when.apply($,
                _(controls).map(function (node) {
                    node = $(node);
                    var ref = node.attr('data-action');
                    return processActions(ref, collection, selection).done(function (result) {
                        if (result === false) {
                            node.attr('disabled', 'disabled').off('click.action');
                        } else {
                            node.removeAttr('disabled').off('click.action')
                                .on('click.action', { ref: ref, selection: selection }, customClick);
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
                var links = ext.point(ref).map(function (link, index) {
                    // defer decision
                    var def = $.Deferred();
                    // store capabilities
                    var capabilities = ext.point(link.ref).pluck('capabilities');
                    // process actions
                    if (link.isEnabled && !link.isEnabled.apply(link, args)) {
                        // link is disabled
                        def.resolve({ link: link, state: false });
                    }
                    else if (!upsell.visible(capabilities)) {
                        // no capabilities match AND no upsell available
                        def.resolve({ link: link, state: false });
                    }
                    else {
                        // combine actions
                        processActions(link.ref, collection, baton).done(function () {
                            var state = _(arguments).any(function (bool) { return bool === true; });
                            def.resolve({ link: link, state: state });
                        });
                    }
                    return def;
                });
                // wait for all links
                $.when.apply($, links.value()).done(function () {
                    linksResolved.resolve(
                        _.chain(arguments).filter(function (o) { return o.state; }).pluck('link').value()
                    );
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
