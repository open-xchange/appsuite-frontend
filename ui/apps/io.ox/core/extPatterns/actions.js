define("io.ox/core/extPatterns/actions", ["io.ox/core/extensions", "io.ox/core/collection"], function (ext, Collection) {
    
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
        // string?
        if (_.isString(o.requires)) {
            o.requires = requires(o.requires);
        }
        // extend point
        ext.point(id).extend(o);
    };
    
    var applyCollection = function (self, collection, context, args) {
        // resolve collection's properties
        var linksResolved = new $.Deferred();
        collection.getProperties()
            .done(function () {
                // get links (check for requirements)
                var links = ext.point(self.ref).map(function (link) {
                    // defer decision
                    var def = $.Deferred();
                    // process actions
                    if (link.isEnabled && !link.isEnabled.apply(link, args)) {
                        return def.reject();
                    }
                    // combine actions
                    $.when.apply($,
                        ext.point(link.ref).map(function (action) {
                            // get return value
                            var ret = _.isFunction(action.requires) ?
                                    action.requires({ collection: collection, context: context }) : true;
                            // is not deferred?
                            if (!ret.promise) {
                                ret = $.Deferred().resolve(ret);
                            }
                            return ret;
                        })
                        .value()
                    )
                    .done(function () {
                        var reduced = _(arguments).reduce(function (memo, action) {
                            return memo && action === true;
                        }, true);
                        if (reduced) {
                            def.resolve(link);
                        } else {
                            def.reject(link);
                        }
                    });
                    return def;
                });
                // wait for all links
                $.when.apply($, links.value()).always(function () {
                    linksResolved.resolve(links.value());
                });
            });
            
        return linksResolved;
    };
    
    var performAction = function (ref, self, context) {
        var p = ext.point(ref),
            data = context.data || context;
        // general handler
        p.invoke('action', self, data, context);
        // handler for multi selection - always provides an array
        p.invoke('multiple', self, _.isArray(data) ? data : [data], context);
    };
   
    return {
        Action: Action,
        invoke: performAction,
        extPatterns: { /* our 'protected' namespace, so to speak */
            applyCollection: applyCollection
        }
    };
    
});