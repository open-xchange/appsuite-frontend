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
 */

define('io.ox/calendar/main',
    ['io.ox/core/date',
     'settings!io.ox/core',
     'io.ox/core/commons',
     'io.ox/core/extensions',
     'settings!io.ox/calendar',
     'gettext!io.ox/calendar',
     'io.ox/calendar/actions',
     'less!io.ox/calendar/style.less'
    ], function (date, coreConfig, commons, ext, settings, gt) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/calendar', title: 'Calendar' }),
        // app window
        win,
        lastPerspective = settings.get('viewView', 'week:workweek');

    // corrupt data fix
    if (lastPerspective === 'calendar') lastPerspective = 'week:workweek';


    // force listview on small devices
    lastPerspective = _.device('small') ? 'list': lastPerspective;

    // launcher
    app.setLauncher(function (options) {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            toolbar: true,
            search: true
        }));

        app.settings = settings;
        app.refDate = new date.Local();

        win.addClass('io-ox-calendar-main');

        // "show all" extension for folder view

        function changeShowAll() {
            settings.set('showAllPrivateAppointments', $(this).prop('checked')).save();
            win.getPerspective().refresh();
        }

        ext.point('io.ox/foldertree/section/links').extend({
            index: 100,
            id: 'show-all',
            draw: function (baton) {

                if (baton.id !== 'private') return;
                if (!baton.data || !baton.options) return;
                if (baton.options.type !== 'calendar') return;

                // hide "show all" checkbox when only one calendar is available
                var count =
                    (_.isArray(baton.data['private']) ? baton.data['private'].length : 0) +
                    (_.isArray(baton.data['public']) ? baton.data['public'].length : 0);

                if (count <= 1) return;

                this.append(
                    $('<div class="show-all-checkbox">').append(
                        $('<label class="checkbox">').append(
                            $('<input type="checkbox" tabindex="1">')
                                .prop('checked', settings.get('showAllPrivateAppointments', false))
                                .on('change', changeShowAll),
                            $.txt(gt('Show all my appointments from all calendars'))
                        )
                    )
                );
            }
        });

        // folder tree
        commons.addFolderView(app, { type: 'calendar', view: 'FolderList' });

        // go!
        commons.addFolderSupport(app, null, 'calendar', options.folder || coreConfig.get('folder/calendar'))
            .pipe(commons.showWindow(win))
            .done(function () {
                ox.ui.Perspective.show(app, options.perspective || _.url.hash('perspective') || lastPerspective);
            });

        win.on('search:open', function () {
                lastPerspective = win.currentPerspective;
                if (lastPerspective && lastPerspective !== 'list') {
                    ox.ui.Perspective.show(app, 'list');
                }
            })
            .on('search:close', function () {
                if (lastPerspective && lastPerspective !== 'list') {
                    ox.ui.Perspective.show(app, lastPerspective);
                }
            })
            .on('change:perspective', function (e, name, long) {
                // save current perspective to settings
                settings.set('viewView', long).save();
                if (name !== 'list') {
                    win.search.close();
                }
            });

    });

    return {
        getApp: app.getInstance
    };
});
