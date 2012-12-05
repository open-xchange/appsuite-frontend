/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Markus Bode <markus.bode@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/pane',
      ['io.ox/core/extensions',
       'io.ox/core/manifests',
       'io.ox/settings/utils',
       'io.ox/portal/settings/plugin/model',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/portal',
       'gettext!io.ox/portal',
       'apps/io.ox/core/tk/jquery-ui.min.js',
       'less!io.ox/portal/style.css'], function (ext, manifests, utils, PluginModel, dialogs, settings, gt) {

    'use strict';

    //this is how the new settings look
    settings.detach().set({
        widgets: {
            user: {
                mail_0: {
                    plugin: 'plugins/portal/mail/register',
                    color: 'blue',
                    //enabled: false,
                    index: 1
                },
                calendar_0: {
                    plugin: 'plugins/portal/calendar/register',
                    color: 'red',
                    index: 2
                },
                tasks_0: {
                    plugin: 'plugins/portal/tasks/register',
                    color: 'green',
                    index: 3
                },
                quota_0: {
                    plugin: 'plugins/portal/quota/register',
                    color: 'gray',
                    index: 'last'
                },
                facebook_0: {
                    plugin: 'plugins/portal/facebook/register',
                    color: 'lightgreen',
                    //enabled: false,
                    index: 4
                },
                twitter_0: {
                    plugin: 'plugins/portal/twitter/register',
                    color: 'pink',
                    //enabled: false,
                    index: 5
                },
                birthdays_0: {
                    plugin: 'plugins/portal/birthdays/register',
                    color: 'lightblue',
                    index: 'first'
                },
                tumblr_0: {
                    plugin: 'plugins/portal/tumblr/register',
                    color: 'orange',
                    index: 'first',
                    props: {
                        url: 'open-xchange.tumblr.com'
                    }
                },
                tumblr_1: {
                    plugin: 'plugins/portal/tumblr/register',
                    color: 'lightblue',
                    index: 'first',
                    props: {
                        url: 'vodvon.tumblr.com'
                    }
                },
                tumblr_2: {
                    plugin: 'plugins/portal/tumblr/register',
                    color: 'gray',
                    index: 4,
                    props: {
                        url: 'staff.tumblr.com'
                    }
                },
                flickr_0: {
                    plugin: 'plugins/portal/flickr/register',
                    color: 'pink',
                    index: 6,
                    props: {
                        method: 'flickr.photos.search',
                        query: 'xjrlokix'
                    }
                },
                rss_0: {
                    plugin: 'plugins/portal/rss/register',
                    color: 'lightblue',
                    index: 'first',
                    props: {
                        url: ['http://www.spiegel.de/schlagzeilen/tops/index.rss']
                    }
                },
                linkedin_0: {
                    plugin: 'plugins/portal/linkedIn/register',
                    color: 'blue',
                    index: 3
                }
            }
        }
    });

    var pluginSettings = settings.get('pluginSettings', []),
        MAX_INDEX = 99999,
        availablePlugins = _(manifests.pluginsFor('portal')).uniq(),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    var getWidgetSettings = function () {
        return _(settings.get('widgets/user', {}))
            .chain()
            // map first since we need the object keys
            .map(function (obj, id) {
                obj.id = id;
                obj.type = id.split('_')[0];
                obj.props = obj.props || {};
                return obj;
            })
            .filter(function (obj) {
                return (obj.enabled === undefined || obj.enabled === true) && _(availablePlugins).contains(obj.plugin);
            })
            .value();
    };

    collection.reset(getWidgetSettings());

    console.log("DEBUG:", collection);

    ext.point("io.ox/portal/settings/detail").extend({
        index: 200,
        id: "portalsettings",
        draw: function (data) {
            var onEdit = function (pEvent) {
                console.log("onEdit");
            },
            onDisable = function (pEvent) {
                console.log("onDisable");
            },
            onDelete = function (pEvent) {
                console.log("onDelete");
            },
            onColorChange = function (pEvent) {
                var $elem = $(pEvent.target);
                console.log("onColorChange", $elem, $elem.data('colorValue'));
            };



            var that = this,
                $addButton = $('<div class="btn-group io-ox-portal-addAction">').append(
                    $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Add') + ' <span class="caret"></span></a>'),
                    $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">').append(
                        $('<li>').text(gt('Mail')),
                        $('<li>').text(gt('Flickr')),
                        $('<li>').text(gt('Tumblr'))
                    )
                ),
                $colorSelect = $('<div class="btn-group io-ox-portal-colorAction">').append(
                    $('<a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Color') + ' <span class="caret"></span></a>'),
                    $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">').append(
                        $('<li class="io-ox-portal-color-default" data-colorValue="default">'),
                        $('<li class="io-ox-portal-color-red" data-colorValue="red">'),
                        $('<li class="io-ox-portal-color-orange" data-colorValue="orange">'),
                        $('<li class="io-ox-portal-color-lightgreen" data-colorValue="lightgreen">'),
                        $('<li class="io-ox-portal-color-green" data-colorValue="green">'),
                        $('<li class="io-ox-portal-color-lightblue" data-colorValue="lightblue">'),
                        $('<li class="io-ox-portal-color-blue" data-colorValue="blue">'),
                        $('<li class="io-ox-portal-color-purple" data-colorValue="purple">'),
                        $('<li class="io-ox-portal-color-pink" data-colorValue="pink">'),
                        $('<li class="io-ox-portal-color-gray" data-colorValue="gray">')
                    ).on('click', 'li', onColorChange)
                ),
                $optionsButton = $('<div class="btn-group io-ox-portal-optionsAction">').append(
                    $('<a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Options') + ' <span class="caret"></span></a>'),
                    $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">').append(
                        $('<li class="io-ox-portal-action io-ox-portal-action-edit">').append(
                            $('<a>').text(gt('Edit')).on('click', onEdit)
                        ),
                        $('<li class="io-ox-portal-action io-ox-portal-action-disable">').append(
                            $('<a>').text(gt('Disable')).on('click', onDisable)
                        ),
                        $('<li class="divider">'),
                        $('<li class="io-ox-portal-action io-ox-portal-action-delete ">').append(
                            $('<a href="#">').text(gt('Delete')).on('click', onDelete)
                        )
                    )
                ),
                $extensions = $('<ul class="io-ox-portal-settings">');


            $(that).append(
                $('<h1>').text(gt('Portal Squares')),
                $addButton.clone(true),
                $extensions,
                $addButton.clone(true)
            );

            require(['io.ox/settings/accounts/settings/extpoints'], function () { //remove once Cisco's and Vic's new module stuff is implemented
                ext.point('io.ox/portal/settings/detail/tile').each(function (extension) {
                    //var $container = $('<li class="io-ox-portal-setting">').attr({id: extension.id}).addClass('tile-color' + extension.colorIndex).appendTo($extensions);
                    //extension.draw.apply($container, []);
                    $('<li class="io-ox-portal-setting">').attr({id: extension.id}).append(
                        $('<span class="io-ox-setting-title">').text(extension.id),
                        $colorSelect.clone(true),
                        $optionsButton.clone(true)
                    ).appendTo($extensions);
                });
            });
        }
    });

    return {};
});