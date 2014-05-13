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

define('io.ox/files/main',
    ['io.ox/core/commons',
     'gettext!io.ox/files',
     'settings!io.ox/files',
     'io.ox/core/extensions',
     'io.ox/core/api/folder',
     'io.ox/core/extPatterns/actions',
     'io.ox/files/actions',
     'io.ox/files/folderview-extensions',
     'less!io.ox/files/style',
     'io.ox/files/toolbar'
    ], function (commons, gt, settings, ext, folderAPI, actions) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Drive' }),
        // app window
        win;

    app.mediator({

        /*
         * Folder view support
         */
        'folder-view': function (app) {
            // folder tree
            commons.addFolderView(app, { type: 'infostore', rootFolderId: settings.get('rootFolderId', 9) });
            app.getWindow().nodes.sidepanel.addClass('border-right');
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': settings.get('view', 'fluid:list')
            });
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('small') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                var data = app.props.toJSON();
                app.settings
                    .set('view', data.layout)
                    .save();
            }, 500));
        },

        /*
         * Respond to folder view changes
         */
        'change:folderview': function (app) {
            if (_.device('small')) return;
            app.props.on('change:folderview', function (model, value) {
                app.toggleFolderView(value);
            });
            app.on('folderview:close', function () {
                app.props.set('folderview', false);
            });
            app.on('folderview:open', function () {
                app.props.set('folderview', true);
            });
        },

        /*
         * Respond to layout change
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                ox.ui.Perspective.show(app, value);
            });

            window.app = app;
        },

        /*
         * Folerview toolbar
         */
        'folderview-toolbar': function (app) {

            if (_.device('small')) return;

            function toggleFolderView(e) {
                e.preventDefault();
                e.data.app.toggleFolderView(e.data.state);
            }

            var side = app.getWindow().nodes.sidepanel;
            side.find('.foldertree-container').addClass('bottom-toolbar');
            side.find('.foldertree-sidepanel').append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" class="toolbar-item" tabindex="1">')
                    .attr('title', gt('Close folder view'))
                    .append($('<i class="fa fa-angle-double-left">'))
                    .on('click', { app: app, state: false }, toggleFolderView)
                )
            );
        }
    });

    //map old settings/links
    function map(pers) {
        var mapping;
        if (/^(icons)$/.test(pers)) {
            //support old setting value
            mapping = 'fluid:icon';
        } else if (!/^(fluid:list|fluid:icon|fluid:tile)$/.test(pers)) {
            mapping = 'fluid:list';
        }
        return mapping || pers;
    }

    // launcher
    app.setLauncher(function (options) {
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: 'Drive',
            chromeless: _.device('!small')
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        // doesn't work anymore
        // might be better to revoke 'create' right on trash folder
        // ------------------------------------------------------------
        // app.on('folder:change', function (id, data) {
        //     if (folderAPI.is('trash', data)) {//no new files in trash folders
        //         ext.point('io.ox/files/links/toolbar').disable('default');//that's the plus sign
        //     } else {
        //         ext.point('io.ox/files/links/toolbar').enable('default');//that's the plus sign
        //     }
        //     win.updateToolbar();
        // });

        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/files/actions/move', null, baton);
        });

        // fix missing default folder
        options.folder = options.folder || folderAPI.getDefaultFolder('infostore') || 9;

        //use last manually choosen perspective (mode) as default
        win.on('change:perspective', function (e, name, id) {
            app.props.set('layout', id);
        });

        // go!
        return commons.addFolderSupport(app, null, 'infostore', options.folder)
            .always(function () {
                app.mediate();
                win.show();
            })
            .done(function () {
                var pers = map(options.perspective || _.url.hash('perspective') || app.props.get('layout'));
                ox.ui.Perspective.show(app, pers);
            });
    });

    return {
        getApp: app.getInstance
    };
});
