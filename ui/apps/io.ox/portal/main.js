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

define('io.ox/portal/main',
    ['io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/manifests',
     'gettext!io.ox/portal',
     'settings!io.ox/portal',
     'less!io.ox/portal/style.css'
    ], function (ext, userAPI, date, manifests, gt, settings) {

    'use strict';

    // overwrite with fresh settings
    settings.detach().set({
        widgets: {
            mail_0: {
                plugin: 'plugins/portal/mail/register',
                color: 'blue',
                index: 1
            },
            calendar_0: {
                plugin: 'plugins/portal/calendar/register',
                color: 'red',
                index: 2
            },
            tasks_0: {
                plugin: 'plugins/portal/tasks/register',
                color: 'black',
                index: 3
            },
            quota_0: {
                plugin: 'plugins/portal/quota/register',
                color: 'orange',
                index: 'last'
            },
            facebook_0: {
                plugin: 'plugins/portal/facebook/register',
                color: 'blue',
                enabled: false,
                index: 4
            },
            birthdays_0: {
                plugin: 'plugins/portal/birthdays/register',
                color: 'blue',
                index: 'first'
            }
        }
    });

    console.warn('PORTAL SETTINGS', settings.get());

    // time-based greeting phrase
    function getGreetingPhrase(name) {
        var hour = new date.Local().getHours();
        // find proper phrase
        if (hour >= 4 && hour <= 11) {
            return gt('Good morning, %s', name);
        } else if (hour >= 18 && hour <= 23) {
            return gt('Good evening, %s', name);
        } else {
            return gt('Hello %s', name);
        }
    }

    function openSettings() {
        require(['io.ox/settings/main'], function (m) {
            m.getApp().launch().done(function () {
                this.getGrid().selection.set({ id: 'io.ox/portal' });
            });
        });
    }

    // portal header
    ext.point('io.ox/portal/sections').extend({
        id: 'header',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div>').append(
                    // button
                    $('<button class="btn btn-primary pull-right">')
                        .attr('data-action', 'personalize')
                        .text(gt('Personalize this page'))
                        .on('click', openSettings),
                    // greeting
                    $('<h1 class="greeting">').append(
                        baton.$.greeting = $('<span class="greeting-phrase">'),
                        $('<span class="signin">').append(
                            $('<i class="icon-user">'), $.txt(' '),
                            $.txt(
                                //#. Portal. Logged in as user
                                gt('Signed in as %1$s', ox.user)
                            )
                        )
                    )
                )
            );
        }
    });

    // widget container
    ext.point('io.ox/portal/sections').extend({
        id: 'widgets',
        index: 200,
        draw: function (baton) {
            this.append(
                baton.$.widgets = $('<div class="widgets">')
            );
        }
    });

    // widget scaffold
    ext.point('io.ox/portal/widget').extend({
        draw: function (baton) {
            var data = baton.data;
            this.addClass('widget widget-color-' + (data.color || 'white'))
                .attr({ 'data-widget-id': data.id, 'data-widget-plugin': data.plugin })
                .append(
                    $('<h2>').text(data.plugin)
                );
        }
    });

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/portal', title: 'Portal' }),
        // app window
        win,
        // app baton
        appBaton = ext.Baton({ app: app });

    app.updateTitle = function () {
        userAPI.getGreeting(ox.user_id).done(function (name) {
            appBaton.$.greeting.text(getGreetingPhrase(name));
        });
    };

    app.getWidgetList = function () {
        // build plugin hash
        var plugins = manifests.pluginsFor('portal');
        console.log('availablePlugins', plugins);
        return _(settings.get('widgets', {}))
            .chain()
            .filter(function (obj) {
                return (obj.enabled === undefined || obj.enabled === true) && _(plugins).contains(obj.plugin);
            })
            .map(function (obj, id) {
                obj.id = id;
                return obj;
            })
            .value()
            .sort(ext.indexSorter);
    };

    app.drawWidgets = function () {
        _(app.getWidgetList()).each(function (data, id) {
            var node = $('<div>'),
                baton = ext.Baton({ data: data, app: app });
            ext.point('io.ox/portal/widget').invoke('draw', node, baton);
            appBaton.$.widgets.append(node);
        });
    };

    app.loadPlugins = function () {

        var availablePlugins = manifests.pluginsFor('portal'),
            usedPlugins = _(app.getWidgetList()).pluck('plugin'),
            requiredPlugins = _(availablePlugins).intersection(usedPlugins);
        console.log('YEAH', requiredPlugins);
    };

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/portal',
            chromeless: true
        }));

        ext.point('io.ox/portal/sections').invoke('draw', win.nodes.main.addClass('io-ox-portal'), appBaton);

        app.updateTitle();
        _.tick(1, 'hour', app.updateTitle);

        win.show(function () {
            app.drawWidgets();
            app.loadPlugins();
        });
    });

    return {
        getApp: app.getInstance
    };

//     // wait for plugin dependencies
//     var plugins = manifests.pluginsFor('portal');
//     var pluginSettings = _.sortBy(settings.get('pluginSettings') || {}, function (obj) { return obj.index; });

//     var allActivePluginIds = {};
//     _.each(pluginSettings, function (obj) {
//         if (obj.active) {
//             allActivePluginIds[obj.id] = obj;
//         }
//     });

//     var allActivePlugins = _.map(allActivePluginIds, function (obj) {
//         return 'plugins/portal/' + obj.id + '/register';
//     });

//     var reqPlugins = _.intersection(allActivePlugins, plugins);

//     var setOrder = function (extensions) {
//         var index = 100;

//         // Load plugin with given index (for sub-tiles)
//         _.each(extensions, function (obj) {
//             if (obj && _.isFunction(obj.reload)) {
//                 obj.reload(index);
//             }
//             index += 100;
//         });

//         var indices = {};

//         // Apply index to normal portal-plugins
//         ext.point('io.ox/portal/widget').each(function (extension) {
//             if (allActivePluginIds[extension.id]) {
//                 extension.index = allActivePluginIds[extension.id].index;
//             } else {
//                 var i = extension.id.indexOf('-');
//                 if (i !== -1) {
//                     var extensionName = extension.id.substring(0, i);
//                     if (!indices[extensionName]) {
//                         indices[extensionName] = allActivePluginIds[extensionName].index;
//                     }
//                     extension.index = indices[extensionName]++;
//                 }
//             }
//         });
//         ext.point('io.ox/portal/widget').sort();
//     };

//     return require(reqPlugins).pipe(function () {

//         setOrder(arguments);




//         var contentQueue = new tasks.Queue();


//         function createContentTask(extension) {
//             return {
//                 id: extension.id,
//                 perform: function () {
//                     var def = $.Deferred(),
//                         $node = $('<div/>');

//                     extension.invoke('load')
//                         .pipe(function () {
//                             return (extension.invoke.apply(extension, ['draw', $node].concat($.makeArray(arguments))) || $.Deferred())
//                                 .done(function () {
//                                     extension.invoke('post', $node, extension);
//                                     def.resolve($node);
//                                 });
//                         })
//                         .fail(function (e) {
//                             $node.remove();
//                             contentSide.idle();
//                             def.reject(e);
//                         });

//                     return def;
//                 }
//             };
//         }

//         function drawContent(extension, e) {

//             new dialogs.SidePopup({ modal: true }).show(e, function (popup) {

//                 var self = this;
//                 popup.busy();

//                 contentQueue.fasttrack(extension.id).done(function (node) {

//                     contentSide.children().trigger('onPause').detach();
//                     $(node).trigger('onResume');
//                     popup.idle();
//                     popup.append(node);
//                     $(node).trigger('onAppended');

//                     self.on('close', function () {
//                         $(node).trigger('onPause');
//                     });

//                     if (extension.loadMoreResults) {
//                         var $o = $('div.io-ox-sidepopup-pane');
//                         $o.bind('scroll', function (event) {
//                             // TODO tidy enough? (loadingMoreResults + active tile)
//                             if (!extension.isLoadingMoreResults && $('div[widget-id="' + extension.id + '"]').hasClass('io-ox-portal-tile-active') && !extension.timer) {
//                                 extension.timer = setTimeout(function () {
//                                     // Position + Height + Tolerance
//                                     var distance = $o.scrollTop() + $o.height() + 50;

//                                     if ($('div.scrollable-pane').height() <= distance) {
//                                         extension.isLoadingMoreResults = true;
//                                         extension.loadMoreResults(extension.finishLoadingMoreResults);
//                                     }
//                                     extension.timer = 0;
//                                 }, 250);
//                             }
//                         });
//                     }

//                     $('div[widget-id]').removeClass('io-ox-portal-tile-active');
//                     $('div[widget-id="' + extension.id + '"]').addClass('io-ox-portal-tile-active');
//                     contentSide.idle();
//                 });
//             });
//         }

//         function makeClickHandler(extension) {
//             return function (event) {
//                 contentSide.find(":first").trigger('onPause').detach();
//                 contentSide.busy();
//                 app.active = extension;
//                 app.activeEvent = event;
//                 return drawContent(extension, event);
//             };
//         }

//         var getKulerIndex = (function () {

//             var list = '0123456789'.split(''), tmp = [];

//             function randomSort() { return Math.round(Math.random()) - 0.5; }

//             return function () {
//                 if (tmp.length === 0) {
//                     tmp = list.slice(0, 10).sort(randomSort);
//                 }
//                 return tmp.shift();
//             };
//         }());

//         function addFillers(num, start, minIndex, maxIndex) {
//             var load = function () {
//                     return $.Deferred().resolve($('<div>'));
//                 },
//                 i = 0;
//             for (; i < num; i++) {
//                 var index = Math.round(Math.random() * (maxIndex - minIndex) + minIndex);
//                 ext.point('io.ox/portal/widget').extend({
//                     id: 'filler' + (start + i),
//                     index: index,
//                     title: '',
//                     colorIndex: 'X',
//                     load: load
//                 });
//             }
//         }

//         function getColorIndex(extension) {
//             if (extension.colorIndex) {
//                 return extension.colorIndex;
//             }
//             var haystack = settings.get('pluginSettings');
//             var needle = _(haystack).find(function (prop) {return prop.id === extension.id; });
//             if (!needle) {
//                 needle = {id: extension.id};
//                 haystack.push(needle);
//             }
//             if (!needle.colorIndex) {
//                 needle.colorIndex = getKulerIndex();
//                 settings.set('pluginProperties', haystack);
//                 settings.save();
//             }
//             return needle.colorIndex;
//         }

//         function initExtensions() {
//             // add dummy widgets
//             var point = ext.point('io.ox/portal/widget'),
//                 count = point.count(),
//                 fillers = 12 - count,
//                 minIndex, maxIndex;
//             point.each(function (extension) { //underscore does not work on this enum...
//                 if (!minIndex && extension.index || minIndex > extension.index) { minIndex = extension.index; }
//                 if (!maxIndex && extension.index || maxIndex < extension.index) { maxIndex = extension.index; }
//             });

//             addFillers(fillers, count, minIndex, maxIndex);
//             point.sort();
//             addFillers(fillers, count, maxIndex, maxIndex + 100);

//             point.each(function (extension) {
//                 var $actionbar = $('<div class="io-ox-portal-actions">').append(
//                     $('<span class="action-text io-ox-portal-action-view">').text(gt("View %s", extension.title || extension.id)),
//                     $('<i class="icon-remove io-ox-portal-action">'));

//                 if (!extension.isEnabled) {
//                     extension.isEnabled = function () { return true; };
//                 }
//                 if (!extension.isEnabled()) {
//                     return;
//                 }
//                 if (!extension.requiresSetUp) {
//                     extension.requiresSetUp = function () { return false; };
//                 }

//                 contentQueue.enqueue(createContentTask(extension));

//                 var $tile = $('<div class="io-ox-portal-widget-tile io-ox-portal-typeA">')
//                     // experimental
//                     .addClass('tile-color' + getColorIndex(extension))
//                     .attr('widget-id', extension.id)
//                     .appendTo(tileSide)
//                     .busy();

//                 if (extension.tileClass) {
//                     $tile.addClass(extension.tileClass);
//                 }

//                 if (extension.requiresSetUp()) {
//                     if (extension.performSetUp) {
//                         $tile.on('click', extension.performSetUp);
//                     } else {
//                         $tile.on('click', function () { return keychain.createInteractively(extension.id); });
//                     }
//                 } else if (!extension.hideSidePopup) {
//                     $actionbar.find('.io-ox-portal-action-view').on('click', makeClickHandler(extension));
//                 }

//                 if (!extension.loadTile) {
//                     extension.loadTile = function () {
//                         return $.Deferred().resolve();
//                     };
//                 }
//                 if (extension.tileType) {
//                     $tile.removeClass('io-ox-portal-typeA').addClass('io-ox-portal-type' + extension.tileType);
//                 }

//                 if (!extension.drawTile) {
//                     extension.drawTile = function () {
//                         var $node = $(this);

//                         if (! (/^filler/.test(extension.id) || (extension.type && extension.type !== 'A'))) {
//                             $(this).append(
//                                 $('<div class="io-ox-portal-title">').append(
//                                     $('<img class="tile-image">'),
//                                     $('<h1 class="tile-heading"/>')
//                                 )
//                             );
//                         }
//                         extension.asyncMetadata("title").done(function (title) {
//                             if (title === control.CANCEL) {
//                                 $tile.remove();
//                                 return;
//                             }
//                             $node.find(".tile-heading").text(title);
//                         });
//                         extension.asyncMetadata("icon").done(function (icon) {
//                             if (icon === control.CANCEL) {
//                                 $tile.remove();
//                                 return;
//                             }
//                             if (icon) {
//                                 $node.find(".tile-image").attr("src", icon);
//                             } else {
//                                 $node.find(".tile-image").remove();
//                             }
//                         });
//                         extension.asyncMetadata("preview").done(function (preview) {
//                             if (preview === control.CANCEL) {
//                                 $tile.remove();
//                                 return;
//                             }
//                             if (preview) {
//                                 $node.append(preview);
//                             }
//                         });
//                         extension.asyncMetadata("tileColor").done(function (color) {
//                             if (color === control.CANCEL) {
//                                 $tile.remove();
//                                 return;
//                             }
//                             if (color !== undefined) {
// //                                    $node[0].className = $node[0].className.replace(/tile-color\d/g, '');
// //                                    $node.addClass('tile-color' + color);
//                             }
//                         });
//                     };
//                 } //END of "is draw method missing?"

//                 if (/^filler/.test(extension.id)) {
//                     $tile.off('click');
//                 }

//                 if (extension.requiresSetUp()) {
//                     $tile.addClass("io-ox-portal-createMe");
//                     return (extension.invoke.apply(extension, ['drawCreationDialog', $tile].concat($.makeArray(arguments))) || $.Deferred())
//                         .done(function () {
//                             $tile.idle();
//                             extension.invoke('postTile', $tile, extension);
//                         })
//                         .fail(function (e) {
//                             $tile.idle().remove();
//                         });
//                 }
//                 return extension.invoke('loadTile')
//                 .pipe(function (a1, a2) {
//                     var $content = $('<div>').appendTo($tile);
//                     return (extension.invoke.apply(extension, ['drawTile', $content].concat($.makeArray(arguments))) || $.Deferred().resolve())
//                         .done(function () {
//                             $tile.idle();
//                             extension.invoke('postTile', $content, extension);
//                             if (!/^filler/.test(extension.id)) {
//                                 $actionbar.appendTo($tile);
//                             }
//                         });
//                 }).fail(function (e) {
//                     $tile.idle().remove();
//                 });
//             });
//         }

//         // launcher
//         app.setLauncher(function () {

//             var formerlyActivePluginIds = {};

//             contentQueue.start();
//             // get window
//             app.setWindow(win = ox.ui.createWindow({
//                 name: 'io.ox/portal',
//                 chromeless: true,
//                 toolbar: true,
//                 titleWidth: '100%'
//             }));

//             updateTitle();
//             _.tick(1, 'hour', updateTitle);

//             initExtensions();

//             app.active = null;

//             win.nodes.main
//                 .addClass('io-ox-portal')
//                 .append(intro)
//                 .append(tileSide);
//             ox.on('refresh^ refresh-portal', function (event, completeReload) {
//                 if (completeReload) {
//                     pluginSettings = _.sortBy(settings.get('pluginSettings', []), function (obj) { return obj.index; });
//                     formerlyActivePluginIds = allActivePluginIds;
//                     allActivePluginIds = {};
//                     _.each(pluginSettings, function (obj) {
//                         if (obj.active) {
//                             allActivePluginIds[obj.id] = obj;
//                         }
//                     });

//                     allActivePlugins = _.map(allActivePluginIds, function (obj) {
//                         return 'plugins/portal/' + obj.id + '/register';
//                     });
//                     var formerlyActivePlugins = _.map(formerlyActivePluginIds, function (obj) {
//                         return 'plugins/portal/' + obj.id + '/register';
//                     });

//                     reqPlugins = _.intersection(allActivePlugins, plugins);
//                     reqPlugins = _(reqPlugins).without(formerlyActivePlugins);

//                     require(reqPlugins).pipe(function () {
//                         setOrder(arguments);
//                     });

//                     app.active = null;
//                     app.activeEvent = null;
//                 }
//                 tileSide.empty();
//                 contentQueue = new tasks.Queue();
//                 contentQueue.start();
//                 initExtensions();
//                 if (app.activeEvent) {
//                     drawContent(app.active, app.activeEvent);
//                 }
//             });

//             win.show();
//         });

//         return {
//             getApp: app.getInstance
//         };
//     });
});
