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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define.async('io.ox/portal/main',
    ['io.ox/core/extensions',
     'io.ox/core/config',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/taskQueue',
     'io.ox/core/flowControl',
     'gettext!io.ox/portal/portal',
     'io.ox/core/tk/dialogs',
     'io.ox/keychain/api',
     'settings!io.ox/portal',
     'less!io.ox/portal/style.css'],
function (ext, config, userAPI, date, tasks, control, gt, dialogs, keychain, settings) {

    'use strict';

    // wait for plugin dependencies
    var plugins = ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal' });
    var activePlugins = _.map(settings.get('activePlugins') || [], function (value) { return 'plugins/portal/' + value + '/register'; });
    plugins = _.intersection(plugins, activePlugins);

    return require(plugins).pipe(function () {
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/portal' }),
            // app window
            win,
            tileSide = $('<div class="io-ox-portal-tiles">'),
            contentSide = $('<div class="io-ox-portal-content">'),
            // update window title
            updateTitle = function () {
                win.setTitle(
                    $($.txt(getGreetingPhrase()))
                    .add($.txt(', '))
                    .add(userAPI.getTextNode(config.get('identifier')))
                    .add($.txt(' '))
                    .add($('<small>').addClass('subtitle').text('(' + ox.user + ')'))
                );
            };

        // time-based greeting phrase
        function getGreetingPhrase() {
            var hour = new date.Local().getHours();

            // find proper phrase
            if (hour >= 4 && hour <= 11) {
                return gt('Good morning');
            } else if (hour >= 18 && hour <= 23) {
                return gt('Good evening');
            } else {
                return gt('Hello');
            }
        }

        var contentQueue = new tasks.Queue();


        function createContentTask(extension) {
            return {
                id: extension.id,
                perform: function () {
                    var def = $.Deferred(),
                        $node = $('<div/>');

                    extension.invoke('load')
                        .pipe(function () {
                            return (extension.invoke.apply(extension, ['draw', $node].concat($.makeArray(arguments))) || $.Deferred())
                                .done(function () {
                                    extension.invoke('post', $node, extension);
                                    def.resolve($node);
                                });
                        })
                        .fail(function (e) {
                            $node.remove();
                            contentSide.idle();
                            def.reject(e);
                        });

                    return def;
                }
            };
        }

        function drawContent(extension, e) {
            var sidepopup;
            var dialog = new dialogs.SidePopup({modal: true}).show(e, function (popup) {
                sidepopup = popup.busy();
            });
            contentQueue.fasttrack(extension.id).done(function (node) {
                contentSide.children().trigger('onPause').detach();
                
                $(node).trigger('onResume');
                sidepopup.idle();
                sidepopup.append(node);
                $(node).trigger('onAppended');

                dialog.on('close', function () {
                    $(node).trigger('onPause');
                });

                if (extension.loadMoreResults) {
                    var $o = $('div.io-ox-sidepopup-pane');

                    $o.bind('scroll', function (event) {
                        // TODO tidy enough? (loadingMoreResults + active tile)
                        if (!extension.isLoadingMoreResults && $('div[widget-id="' + extension.id + '"]').hasClass('io-ox-portal-tile-active') && !extension.timer) {
                            extension.timer = setTimeout(function () {
                                // Position + Height + Tolerance
                                var distance = $o.scrollTop() + $o.height() + 50;

                                if ($('div.scrollable-pane').height() <= distance) {
                                    extension.isLoadingMoreResults = true;
                                    extension.loadMoreResults(extension.finishLoadingMoreResults);
                                }
                                extension.timer = 0;
                            }, 250);
                        }
                    });
                }

                $('div[widget-id]').removeClass('io-ox-portal-tile-active');
                $('div[widget-id="' + extension.id + '"]').addClass('io-ox-portal-tile-active');
                contentSide.idle();
            });
        }

        function makeClickHandler(extension) {
            return function (event) {
                contentSide.find(":first").trigger('onPause').detach();
                contentSide.busy();
                app.active = extension;
                app.activeEvent = event;
                return drawContent(extension, event);
            };
        }

        function makeCreationDialog(extension) {
            return function () {
                return keychain.createInteractively(extension.id);
            };
        }

        var getKulerIndex = (function () {

            var list = '0123456789'.split(''), pos = 0, tmp = [];

            function randomSort() { return Math.round(Math.random()) - 0.5; }

            return function () {
                if (tmp.length === 0) {
                    tmp = list.slice(pos, pos + 5).sort(randomSort);
                    pos = pos === 0 ? 5 : 0;
                }
                return tmp.shift();
            };
        }());

        function addFillers(num, start) {
            var load = function () {
                    return $.Deferred().resolve($('<div>'));
                },
                i = 0;
            for (; i < num; i++) {
                ext.point('io.ox/portal/widget').extend({
                    id: 'filler' + (start + i),
                    index: 100 * (start + i + 1),
                    title: '',
                    tileColor: 'X',
                    load: load
                });
            }
        }

        function initExtensions() {
            // add dummy widgets
            var point = ext.point('io.ox/portal/widget'),
                count = point.count(),
                fillers = 15 - count;

            addFillers(fillers, count);
            point.shuffle();

            point.each(function (extension) {
                if (!extension.isEnabled) {
                    extension.isEnabled = function () { return true; };
                }
                if (!extension.isEnabled()) {
                    return;
                }
                if (!extension.requiresSetUp) {
                    extension.requiresSetUp = function () { return false; };
                }

                contentQueue.enqueue(createContentTask(extension));
                var $borderBox = $('<div class="io-ox-portal-widget-tile-border">').appendTo(tileSide);
                var $node = $('<div class="io-ox-portal-widget-tile">')
                    // experimental
                    .addClass('tile-color' + ('tileColor' in extension ? extension.tileColor : getKulerIndex())) //(count++ % 10))
                    .attr('widget-id', extension.id)
                    .appendTo($borderBox)
                    .busy();

                if (extension.tileClass) {
                    $node.addClass(extension.tileClass);
                }

                if (extension.requiresSetUp()) {
                    $node.on('click', makeCreationDialog(extension));
                } else {
                    $node.on('click', makeClickHandler(extension));
                }

                if (!extension.loadTile) {
                    extension.loadTile = function () {
                        return $.Deferred().resolve();
                    };
                }

                if (!extension.drawTile) {
                    extension.drawTile = function () {
                        var $node = $(this);
                        $(this).append('<img class="tile-image"/><h1 class="tile-heading"/>');

                        extension.asyncMetadata("title").done(function (title) {
                            if (title === control.CANCEL) {
                                $borderBox.remove();
                                return;
                            }
                            $node.find(".tile-heading").text(title);
                        });
                        extension.asyncMetadata("icon").done(function (icon) {
                            if (icon === control.CANCEL) {
                                $borderBox.remove();
                                return;
                            }
                            if (icon) {
                                $node.find(".tile-image").attr("src", icon);
                            } else {
                                $node.find(".tile-image").remove();
                            }
                        });
                        extension.asyncMetadata("preview").done(function (preview) {
                            if (preview === control.CANCEL) {
                                $borderBox.remove();
                                return;
                            }
                            if (preview) {
                                $node.append(preview);
                            }
                        });
                        extension.asyncMetadata("tileColor").done(function (color) {
                            if (color === control.CANCEL) {
                                $borderBox.remove();
                                return;
                            }
                            if (color !== undefined) {
//                                    $node[0].className = $node[0].className.replace(/tile-color\d/g, '');
//                                    $node.addClass('tile-color' + color);
                            }
                        });
                        extension.asyncMetadata("color").done(function (color) {
                            if (color === control.CANCEL) {
                                $borderBox.remove();
                                return;
                            }
                            if (color !== undefined) {
                                $node.addClass("tile-" + color);
                            }
                        });
                    };
                } //END of if missing draw workaround bullshit

                if (extension.requiresSetUp()) {
                    $node.addClass("io-ox-portal-createMe");
                    return (extension.invoke.apply(extension, ['drawCreationDialog', $node].concat($.makeArray(arguments))) || $.Deferred())
                        .done(function () {
                            $node.idle();
                            extension.invoke('postTile', $node, extension);
                        })
                        .fail(function (e) {
                            $node.idle().remove();
                        });
                }

                return extension.invoke('loadTile')
                .pipe(function (a1, a2) {
                    return (extension.invoke.apply(extension, ['drawTile', $node].concat($.makeArray(arguments))) || $.Deferred())
                        .done(function () {
                            $node.idle();
                            extension.invoke('postTile', $node, extension);
                        });
                })
                .fail(function (e) {
                    $node.idle().remove();
                });
            });
        }

        // launcher
        app.setLauncher(function () {
            contentQueue.start();
            // get window
            app.setWindow(win = ox.ui.createWindow({
                chromeless: true,
                toolbar: true,
                titleWidth: '100%'
            }));

            updateTitle();
            _.tick(1, 'hour', updateTitle);

            initExtensions();

            app.active = _(ext.point('io.ox/portal/widget').all()).first();

            win.nodes.main
                .addClass('io-ox-portal')
                .append(tileSide);

            ox.on('refresh^', function () {
                //console.log("Refreshing:", app.active, app.activeEvent);
                tileSide.empty();
                contentQueue = new tasks.Queue();
                contentQueue.start();
                initExtensions();
                if (app.activeEvent) {
                    drawContent(app.active, app.activeEvent);
                }
            });

            win.show();
        });

        return {
            getApp: app.getInstance
        };
    });
});
