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

    ext.point("io.ox/portal/settings/detail").extend({
        index: 200,
        id: "portalsettings",
        draw: function (data) {
            var onEdit = function (pEvent) {
                var $elem = $(pEvent.target).parents('.io-ox-portal-setting').find('.io-ox-setting-details').toggle('hidden');
            },
            onDisable = function (pEvent) {
                var $elem = $(pEvent.target).parents('.io-ox-portal-setting');
                console.log("onDisable", $elem.id);
            },
            onDelete = function (pEvent) {
                var $elem = $(pEvent.target).parents('.io-ox-portal-setting');
                console.log("onDelete", $elem.id);
            },
            onColorChange = function (pEvent) {
                var $elem = $(pEvent.target);
                console.log("onColorChange", $elem, $elem.data('color'));
            };

            var that = this,
                $addDropdown = $('<ul class="dropdown-menu" role="menu">'),
                $addButton = $('<div class="btn-group io-ox-portal-addAction">').append(
                    $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Add') + ' <span class="caret"></span></a>'),
                    $addDropdown
                ),

                $colorSelect = $('<div class="btn-group io-ox-portal-colorAction">').append(
                    $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Color') + ' <span class="caret"></span></a>'),
                    $('<ul class="dropdown-menu" role="menu">').append(
                        _(['default', 'red', 'orange', 'lightgreen', 'green', 'lightblue', 'blue', 'purple', 'pink', 'gray']).map(function (color) {
                            return $('<li class="io-ox-portal-color-' + color + '" data-color="' + color + '">');
                        })
                    ).on('click', 'li', onColorChange)
                ),

                $optionsButton = $('<div class="btn-group io-ox-portal-optionsAction">').append(
                    $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Options') + ' <span class="caret"></span></a>'),
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

            var widgets = _(settings.get('widgets/user')).sortBy(function (widget) {
                if (!widget.index) {
                    return 512;
                }
                if (widget.index === 'last') {
                    return 1024;
                }
                if (widget.index === 'first') {
                    return 1;
                }
                return widget.index;
            });


            require(['io.ox/settings/accounts/settings/extpoints'], function () { //TODO remove once Cisco's and Vic's new module stuff is implemented
                ext.point('io.ox/portal/settings/add').each(function (extension) { //add option to "add" button
                    $('<li>').append(
                        $('<a>').text(extension.description)
                    ).on('click', extension.action)
                    .appendTo($addDropdown);
                });

                _(widgets).each(function (widget) { //now draw the setting box for every plugin
                    var $additionalContent = $('<div class="io-ox-setting-details">'),
                        id = widget.plugin.replace(/[^A-Za-z0-9]/g, '-'),
                        name = widget.plugin.split(/\//)[2]; //TODO fragile

                    $('<li class="io-ox-portal-setting">').attr({id: id}).append( //basics
                        $('<span class="io-ox-setting-title io-ox-portal-settings-title">').text(name),
                        $colorSelect.clone(true),
                        $optionsButton.clone(true),
                        $additionalContent.hide()
                    ).appendTo($extensions);

                    if (widget.color) { //color
                        $additionalContent.parent().css('color', widget.color);
                    }

                    ext.point('io.ox/portal/settings/detail/' + name).each(function (extension) { //add advanced settings to extensions
                        console.log("DEBUG", extension.id);
                        extension.draw.apply($additionalContent, []);
                    });
                }); //end: widget.each


                $(that).append( //building the actual settings page from its components
                    $('<h1>').text(gt('Portal Squares')),
                    $addButton.clone(true),
                    $extensions,
                    $addButton.clone(true)
                );
            }); //end: require


        } //end: draw
    }); //end: extpoint

    return {};
}); //end: define

/*
            require(['io.ox/settings/accounts/settings/extpoints'], function () { //TODO remove once Cisco's and Vic's new module stuff is implemented
                ext.point('io.ox/portal/settings/add').each(function (extension) { //add option to "add" button
                    $('<li>').append(
                        $('<a>').text(extension.description)
                    ).on('click', extension.action)
                    .appendTo($addDropdown);
                });

                ext.point('io.ox/portal/settings/detail/tile').each(function (extension) { //add advanced settings to extensions
                    var $additionalContent = $('<div class="io-ox-setting-details">');
                    extension.draw.apply($additionalContent, []);
                    $('<li class="io-ox-portal-setting">').attr({id: extension.id}).append(
                        $('<span class="io-ox-setting-title io-ox-portal-settings-title">').text(extension.id),
                        $colorSelect.clone(true),
                        $optionsButton.clone(true),
                        $additionalContent.hide()
                    ).appendTo($extensions);
                    if (extension.color) {
                        $additionalContent.find('io-ox-portal-settings-title').css('color', extension.color);
                    }
                });

                $(that).append( //building the actual settings page from its components
                    $('<h1>').text(gt('Portal Squares')),
                    $addButton.clone(true),
                    $extensions,
                    $addButton.clone(true)
                );
            });
*/
