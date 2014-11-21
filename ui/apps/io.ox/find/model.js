/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/model', [
    'io.ox/find/api',
    'io.ox/backbone/modelFactory',
    'io.ox/find/manager/facet-collection'
], function (api, ModelFactory, FacetCollection) {

    'use strict';

    /*
     *  facet      ->  values         ->  options or filter
     *  'contacts' -> 'contacts/1/15' -> 'sender'
     */

    var FindModel = Backbone.Model.extend({

        defaults: function () {
            return {
                // search term
                query: '',
                // pagingg params
                start: 0,
                size: 100,
                extra: 1
            };
        },

        initialize: function (options) {
            this.manager = new FacetCollection();
            this.app = options.app;
            // build up folder cache
            _.defer(_.bind(this.update, this));
        },

        // TODO: remove this workaround thats adds standard folders to folder cache
        update: function () {
            var self = this;
            require(['io.ox/core/folder/api', 'io.ox/core/api/account'], function (folderAPI, accountAPI) {
                if (self.app.getModuleParam() !== 'mail') return;
                var list = _.filter(folderAPI.getStandardMailFolders(), function (id) {
                    if (accountAPI.is('inbox', id) || accountAPI.is('sent', id)) return true;
                });
                // add to cache
                folderAPI.multiple(list);
            });
        },

        reset: function (options) {
            var opt = options || {};
            //items.empty();
            this.set({
                query: '',
                start: 0
            },
            {
                silent: true
            });
            this.manager.reset();
            if (!opt.silent) this.trigger('reset');
        }
    });

    return FindModel;
});
