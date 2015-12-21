/**
* @author Richard Petersen
*/

define('io.ox/files/guidance/main', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/core',
    'io.ox/core/folder/api',
    'io.ox/core/extPatterns/links',
    'io.ox/core/capabilities',
    'gettext!io.ox/files'
], function (ext, dialogs, settings, folderAPI, links, capabilities, gt) {

    'use strict';

    var INDEX = 100,
        lastPopup,
        lastBaton;

    //opens side popup with info charts
    function sidePopup(app, e) {
        var id = app.get('name'),
            //folderID = settings.get('folder/infostore'),
            folderID = app.folder.get(),
            quota = settings.get('properties'),
            folder;

        // DEBUGGING: this is only for testing, due to unlimited disc space.
        // quota.quota = 1000000000000;
        // ext.point('io.ox/files/guidance').enable('guidance-files-reload');

        folderAPI.get(folderID).done(function (folderObj) {
            folder = folderObj;

            var dialog = new dialogs.SidePopup({ closely: true, tabTrap: true });

            dialog.show(e, function (popup) {
                app.folder.getData().done(function (data) {
                    var baton = new ext.Baton({ id: id, dialog: dialog, folder: folder, app: app, data: data, quota: quota, options: { type: 'files' } });

                    ext.point('io.ox/files/guidance').invoke('draw', popup.addClass('guidance'), baton);

                    lastBaton = baton;
                });

                lastPopup = popup;
            });
        });
    }

    //this function reloads the popup. It clears the old one and draws again.
    function reloadPopup(app) {
        var id = app.get('name'),
            folder = lastBaton.folder;

        //force reload of settings to get updated quota
        settings.load().done(function () {
            var quota = settings.get('properties');
            lastPopup.empty();

            require(['io.ox/files/guidance/statistics'], function (statistics) {
                statistics.clearCache();

                app.folder.getData().done(function (data) {
                    var baton = new ext.Baton({ id: id, dialog: lastBaton.dialog, folder: folder, app: app, data: data, quota: quota, options: { type: 'files' } });

                    ext.point('io.ox/files/guidance').invoke('draw', lastPopup, baton);
                });
            });
        });
    }

    //set title
    ext.point('io.ox/files/guidance').extend({
        id: 'guidance_files_title',
        index: INDEX += 100,
        draw: function (baton) {
            this.append($('<h1 class="folder-name">').text(baton.folder.title));
        }
    });

    //help
    if (capabilities.has('help')) {
        ext.point('io.ox/files/guidance').extend({
            id: 'files-statistic-help',
            index: INDEX += 100,
            draw: function () {

                var helpDir = 'help/l10n/' + ox.language + '/',
                    topics = [
                        [gt.pgettext('help', 'The Drive App'), 'ox.appsuite.user.sect.files.gui.html'],
                        [gt.pgettext('help', 'Creating Files'), 'ox.appsuite.user.sect.files.add.html'],
                        [gt.pgettext('help', 'Managing Files'), 'ox.appsuite.user.sect.files.manage.html'],
                        [gt.pgettext('help', 'Accessing Files with WebDAV'), 'ox.appsuite.user.sect.files.webdav.html'],
                        [gt.pgettext('help', 'Drive Settings'), 'ox.appsuite.user.sect.files.settings.html']
                    ];

                this.append(
                    $('<h2>').text(gt('Related articles')),
                    $('<section>').append(
                        _(topics).map(function (pair) {
                            return $('<div>').append(
                                $('<a>', { href: helpDir + pair[1], target: 'help' }).text(pair[0])
                            );
                        })
                    )
                );
            }
        });
    }

    //upsell
    // ext.point('io.ox/files/guidance').extend({
    //     id: 'upsell',
    //     index: INDEX += 100,
    //     draw: function () {

    //         $('head').append(
    //             $('<link href="http://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css">')
    //         );

    //         var node = $('<section>')
    //             .css({
    //                 fontFamily: '"Nunito", Arial, sans-serif',
    //                 fontSize: '24px',
    //                 lineHeight: '28px',
    //                 padding: '14px',
    //                 color: '#fff',
    //                 backgroundColor: '#FF5F13', // kind of nato orange
    //                 borderRadius: '5px',
    //                 textShadow: '1px 1px 3px #000',
    //                 maxWidth: '450px',
    //                 whiteSpace: 'pre'
    //             })
    //             .text('Upgrade to premium.\nGet a 90-day free trial ...');

    //         this.append(node);
    //     }
    // });

    //quota
    ext.point('io.ox/files/guidance').extend({
        id: 'guidance_files_quota',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section>').busy();
            this.append(node);

            require(['io.ox/files/guidance/statistics'], function (statistics) {
                statistics.storageQuota(node, baton);
            });
        }
    });

    //sizes of the folders
    ext.point('io.ox/files/guidance').extend({
        id: 'guidance_files_sizes',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section class="files-sizes">').busy();
            this.append(node);

            require(['io.ox/files/guidance/statistics'], function (statistics) {
                statistics.folderSize(node, baton);
            });
        }
    });

    //the types of the different files
    ext.point('io.ox/files/guidance').extend({
        id: 'guidance_files_types',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section>').busy();
            this.append(node);

            require(['io.ox/files/guidance/statistics'], function (statistics) {
                statistics.fileType(node, baton);
            });
        }
    });

    ext.point('io.ox/files/guidance').extend(new links.Link({
        id: 'guidance-files-reload',
        index: INDEX += 100,
        prio: 'hi',
        label: gt('Reload statistics'),
        ref: 'io.ox/files/actions/guidance-reload',
        cssClasses: 'io-ox-action-link btn btn-primary'
        // draw: function (baton) {
        //     var node = $('<section>');
        //     this.append(node);

        //     require(['io.ox/files/guidance/statistics'], function (statistics) {
        //         statistics.reloadButton(node, baton);
        //     });
        // }
    }));

    return { sidePopup: sidePopup, reloadPopup: reloadPopup };
});
