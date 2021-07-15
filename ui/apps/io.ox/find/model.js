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

define('io.ox/find/model', [
    'io.ox/find/api',
    'io.ox/find/manager/facet-collection'
], function (api, FacetCollection) {

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
            }, {
                silent: true
            });
            this.manager.reset();
            if (!opt.silent) this.trigger('reset');
        }
    });

    return FindModel;
});
