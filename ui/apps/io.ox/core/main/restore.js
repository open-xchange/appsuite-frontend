/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/restore', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/main/debug',
    'gettext!io.ox/core'
], function (ext, Stage, debug, gt) {
    'use strict';

    var topbar = $('#io-ox-appcontrol');

    var drawDesktop = function () {
        ext.point('io.ox/core/desktop').invoke('draw', $('#io-ox-desktop'), {});
        drawDesktop = $.noop;
    };

    new Stage('io.ox/core/stages', {
        id: 'restore-check',
        index: 300,
        run: function (baton) {

            debug('Stage "restore-check"');

            return ox.ui.App.canRestore().done(function (canRestore) {
                baton.canRestore = canRestore;
            });
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'restore-confirm',
        index: 400,
        run: function (baton) {

            debug('Stage "restore-confirm"');

            if (baton.canRestore) {

                baton.restoreHash = _.url.hash();

                var dialog,
                    def = $.Deferred().done(function () {
                        $('#background-loader').busy().fadeIn();
                        topbar.show();
                        dialog.remove();
                        dialog = null;
                    }),
                    btn1, btn2;

                $('#io-ox-core').append(
                    dialog = $('<div class="io-ox-restore-dialog" tabindex="-1" role="dialog" aria-labelledby="restore-heading" aria-describedby="restore-description">').append(
                        $('<div role="document">').append(
                            $('<div class="header">').append(
                                $('<h1 id="restore-heading">').text(gt('Restore applications')),
                                $('<div id="restore-description">').text(
                                    gt('The following applications can be restored. Just remove the restore point if you don\'t want it to be restored.')
                                )
                            ),
                            $('<ul class="list-unstyled content">'),
                            $('<div class="footer">').append(
                                btn1 = $('<button type="button" class="cancel btn btn-default">').text(gt('Cancel')),
                                btn2 = $('<button type="button" class="continue btn btn-primary">').text(gt('Continue'))
                            )
                        )
                    )
                );

                if (_.device('smartphone')) {
                    btn1.addClass('btn-block btn-lg');
                    btn2.addClass('btn-block btn-lg');
                }

                // draw savepoints to allow the user removing them
                ox.ui.App.getSavePoints().done(function (list) {

                    // check if we restore only floating windows => if yes we need to load the default app too
                    baton.onlyFloating = true;

                    _(list).each(function (item) {
                        if (baton.onlyFloating && !item.floating) baton.onlyFloating = false;

                        var info = item.description || item.module,
                            versionInfo = $();
                        if (item.version !== ox.version) {
                            var version = item.version || '';
                            version = version.split('.').slice(0, -2).join('.');
                            if (version) {
                                versionInfo = $('<span class="oldversion">').text('(' + version + ')');
                            }
                        }
                        this.append(
                            $('<li class="restore-item">').append(
                                $('<a href="#" role="button" class="remove">').attr('title', gt('Remove restore point: "%1$s"', info)).data(item).append(
                                    $('<i class="fa fa-trash-o" aria-hidden="true">')
                                ),
                                item.icon ? $('<i aria-hidden="true">').addClass(item.icon) : $(),
                                $('<span>').text(info),
                                versionInfo
                            )
                        );
                    }, dialog.find('.content'));
                });

                dialog.on('click', '.footer .btn.continue', def.resolve);
                dialog.on('click', '.footer .btn.cancel', function (e) {
                    e.preventDefault();
                    ox.ui.App.removeAllRestorePoints().done(function () {
                        _.url.hash(baton.restoreHash);
                        baton.canRestore = false;
                        baton.onlyFloating = false;
                        def.resolve();
                    });
                });
                dialog.on('click', '.content .remove', function (e) {
                    e.preventDefault();
                    var node = $(this),
                        id = node.data('id');
                    // remove visually first
                    node.closest('li').remove();
                    // remove restore point
                    ox.ui.App.removeRestorePoint(id).done(function (list) {
                        baton.onlyFloating = _(list).filter(function (item) {
                            return !item.floating;
                        }).length > 0;
                        // continue if list is empty
                        if (list.length === 0) {
                            _.url.hash(baton.restoreHash);
                            baton.canRestore = false;
                            def.resolve();
                        }
                    });
                });

                topbar.hide();
                $('#background-loader').idle().fadeOut(function () {
                    dialog.find('.btn-primary').focus();
                });

                return def;
            }
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'restore',
        index: 500,
        run: function (baton) {

            debug('Stage "restore"');

            // check if we restore only floating windows => if yes we need to load the default app too
            if (baton.canRestore && !baton.isDeepLink && !baton.onlyFloating) {
                // clear auto start stuff (just conflicts)
                baton.autoLaunch = [];
                baton.autoLaunchApps = [];
            }

            if (baton.autoLaunch.length === 0 && !baton.canRestore) {
                drawDesktop();
                return baton.block.resolve(true);
            }

            return baton.block.resolve(baton.autoLaunch.length > 0 || baton.canRestore || location.hash === '#!');
        }
    });

});
