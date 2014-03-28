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

define('io.ox/search/util',
    ['io.ox/core/http',
     'io.ox/core/api/folder',
     'io.ox/core/api/account',
    ], function (http, folderAPI, accountAPI) {

    'use strict';

    return {

        getFolders: function (model) {
            var hash = {},
                req = [],
                mapping = {},
                app,
                id;

            //standard folders for mail
            if (model.getModule() === 'mail') {
                _.each(accountAPI.getStandardFolders(), function (id) {
                    mapping[id] = 'standard';
                });
            }

            //default folder
            id = folderAPI.getDefaultFolder(model.getModule());
            mapping[id] = 'default';

            //current folder
            app = model.getApp() + '/main';
            if (require.defined(app)) {
                id = require(app).getApp().folder.get() || undefined;
                mapping[id] = 'current';
            }

            //request
            _.each(Object.keys(mapping), function (id) {
                if (id && !hash[id]) {
                    hash[id] = true;
                    req.push(folderAPI.get({folder: id}));
                }
            });

            return $.when.apply($, req)
                    .then(function () {
                        return _.map(arguments, function (folder) {
                            return {
                                id: folder.id,
                                title: folder.title, //folderAPI.getFolderTitle(folder.title, 15),
                                type: mapping[folder.id],
                                data: folder
                            };
                        });
                    });

        },
        getFirstChoice: function (model) {
            var id = model.getFolder() || folderAPI.getDefaultFolder(model.getModule());
            return  folderAPI.get({folder: id})
                    .then(function (folder) {
                        return {
                            custom: folder.id,
                            display_name: folder.title //folderAPI.getFolderTitle(folder.title, 15)
                        };
                    });
        }

    };
});
