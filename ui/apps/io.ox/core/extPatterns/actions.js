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
    ["io.ox/core/extensions",
     "io.ox/core/collection"], function (ext, Collection) {

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
        var o = _.extend({ requires: requiresOne }, options);
        // fix missing id
        o.id = o.id || _(id.split(/\//)).last();
        // string?
        if (_.isString(o.requires)) {
            o.requires = requires(o.requires);
        }
        // extend point
        ext.point(id).extend(o);
    };

    var invoke = function (ref, self, baton) {
        var p = ext.point(ref);
        // general handler
        p.invoke('action', self, baton);
        // handler for multi selection - always provides an array
        p.invoke('multiple', self, _.isArray(baton.data) ? baton.data : [baton.data], baton);
    };

    var processActions = function (ref, collection, context) {
        // combine actions
        return $.when.apply($,
            ext.point(ref).map(function (action) {
                // get return value
                var ret = _.isFunction(action.requires) ?
                        action.requires({ collection: collection, context: context || {} }) : true;
                // is not deferred?
                if (!ret.promise) {
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

    var applyCollection = function (ref, collection, context, args) {

        if (!ref) return $.when();

        // resolve collection's properties
        var linksResolved = new $.Deferred();
        collection.getProperties()
            .done(function () {
                // get links (check for requirements)
                var links = ext.point(ref).map(function (link) {
                    // defer decision
                    var def = $.Deferred();
                    // process actions
                    if (link.isEnabled && !link.isEnabled.apply(link, args)) {
                        def.resolve({ link: link, state: false });
                    } else {
                        // combine actions
                        processActions(link.ref, collection, context)
                        .done(function () {
                            var state = _(arguments).reduce(function (memo, action) {
                                return memo && action === true;
                            }, true);
                            def.resolve({ link: link, state: state });
                        });
                    }
                    return def;
                });
                // wait for all links
                $.when.apply($, links.value())
                .done(function () {
                    linksResolved.resolve(
                        _.chain(arguments).filter(function (o) { return o.state; }).pluck('link').value()
                    );
                    links = null;
                });
            });

        return linksResolved;
    };

    return {
        Action: Action,
        invoke: invoke,
        applyCollection: applyCollection,
        updateCustomControls: updateCustomControls
    };

});