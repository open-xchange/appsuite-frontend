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
     'gettext!io.ox/portal/portal',
     'apps/io.ox/portal/jquery.masonry.min.js',
     'less!io.ox/portal/style.css'],
function (ext, config, userAPI, date, tasks, gt) {

    'use strict';

    // wait for plugin dependencies
    var plugins = ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal' });
    return require(plugins).pipe(function () {
        
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/portal' }),
            // app window
            win,
            leftSide = $('<div class="io-ox-portal-left">'),
            rightSide = $('<div class="io-ox-portal-right">'),
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
                        $node = $("<div/>");
                    
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
                            rightSide.idle();
                            def.reject(e);
                        });
                    
                    return def;
                }
            };
        }
        
        function drawContent(extension) {
            contentQueue.fasttrack(extension.id).done(function (node) {
                rightSide.append(node);
                rightSide.idle();
            });
        }
        
        function makeClickHandler(extension) {
            return function (event) {
                rightSide.empty();
                rightSide.busy();
                app.active = extension;
                
                return drawContent(extension);
            };
        }
        
        function initExtensions() {
            ext.point('io.ox/portal/widget')
                .each(function (extension) {
                    
                    contentQueue.enqueue(createContentTask(extension));
                    
                    var $node = $('<div>')
                        .addClass('io-ox-portal-widget-tile')
                        .attr('widget-id', extension.id)
                        .css({
                            width: "180px",
                            height: "180px",
                            margin: "5px"
                        })
                        .appendTo(leftSide)
                        .busy();

                    $node.on('click', makeClickHandler(extension));

                    if (!extension.loadTile) {
                        extension.loadTile = function () {
                            return $.Deferred().resolve();
                        };
                    }

                    if (!extension.drawTile) {
                        extension.drawTile = function () {
                            this.append($("<div>").text(extension.id));
                            return $.Deferred().resolve();
                        };
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
                toolbar: true,
                titleWidth: '100%'
            }));

            updateTitle();
            _.every(1, 'hour', updateTitle);


            initExtensions();


            app.active = _(ext.point('io.ox/portal/widget').all()).first();
            if (app.active) {
                rightSide.busy();
                drawContent(app.active);
            }
            
            win.nodes.main
                .addClass('io-ox-portal')
                .append(leftSide, rightSide);
            
            ox.on('refresh^', function () {
                leftSide.empty();
                contentQueue = new tasks.Queue();
                contentQueue.start();
                initExtensions();
                if (app.active) {
                    rightSide.empty();
                    rightSide.busy();
                    drawContent(app.active);
                }
            });
            
            win.show();
        });

        return {
            getApp: app.getInstance
        };
    });
});