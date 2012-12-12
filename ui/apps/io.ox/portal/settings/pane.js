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

    var MAX_INDEX = 99999,
        availablePlugins = _(manifests.pluginsFor('portal')).uniq(),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    var draw = function (data, that) {
        var redraw = function () {
            that.empty();
            draw(data, that);
        },
        onEdit = function (pEvent, $node) {
            var $node = $(pEvent.target),
                $editLink = $node.find('.io-ox-portal-action-edit');
            $node.parents('.io-ox-portal-setting').find('.io-ox-setting-details').toggle('hidden');
        },
        onDisable = function (pEvent) {
            var $elem = $(pEvent.target).parents('.io-ox-portal-setting');
            settings.set('widgets/user/' + $elem.data('key') + '/enabled', false);
            settings.save();
        },
        onEnable = function (pEvent) {
            var $elem = $(pEvent.target).parents('.io-ox-portal-setting');
            settings.set('widgets/user/' + $elem.data('key') + '/enabled', true);
            settings.save();
        },
        onDelete = function (pEvent) {
            var $elem = $(pEvent.target).parents('.io-ox-portal-setting'),
                dialog = new dialogs.ModalDialog({ easyOut: true }),
                name = $elem.data('name'),
                key = $elem.data('key');

            dialog.header($("<h4>").text(gt('Delete a setting')))
            .append($('<span>').text(gt('Do you really want to delete the following setting and lose all data you entered or would you just disable it to stop it from showing on the portal page?')))
            .append($('<ul>').append($('<li>').text(name)))
            .addButton('cancel', gt('Cancel'))
            .addButton('disable', gt('Disable'))
            .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
            .show()
            .done(function (action) {
                if (action === 'delete') {
                    settings.remove('widgets/user/' + key);
                    settings.save();
                    $elem.remove(); //no need to refresh

                    ext.point('io.ox/portal/settings/portal/selfdestruct/' + $elem.data('type')).each(function (extension) {
                        extension.selfdestruct($elem);
                    });
                }
                if (action === 'disable') {
                    settings.set('widgets/user/' + key + '/enabled', false);
                    settings.save();
                }
                return false;
            });
        },
        onColorChange = function (pEvent) {
            var $elem = $(pEvent.target),
                color = $elem.data('color'),
                key = $elem.parents('.io-ox-portal-setting').data('key');
            settings.set('widgets/user/' + key + '/color', color);
            settings.save();
        };

        var $addDropdown = $('<ul class="dropdown-menu" role="menu">'),
            $addButton = $('<div class="btn-group io-ox-portal-addAction">').append(
                $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Add') + ' <span class="caret"></span></a>'),
                $addDropdown
            ),

            $colorSelect = $('<div class="btn-group io-ox-portal-colorAction">').append(
                $('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' + gt('Color') + ' <span class="caret"></span></a>'),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(['default', 'red', 'orange', 'lightgreen', 'green', 'lightblue', 'blue', 'purple', 'pink', 'gray']).map(function (color) {
                        return $('<li class="io-ox-portal-color-' + color + '">').data("color", color);
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
                        $('<a>')
                    ),
                    $('<li class="divider">'),
                    $('<li class="io-ox-portal-action io-ox-portal-action-delete ">').append(
                        $('<a href="#">').text(gt('Delete')).on('click', onDelete)
                    )
                )
            ),
            $extensions = $('<ul class="io-ox-portal-settings">');


        if (!that.data('save-listener-is-registered')) {
            settings.on('save', redraw);
            that.on('dispose', function () {settings.off('save', redraw); });
            that.data('save-listener-is-registered', true);
        }

        var widgets = settings.get('widgets/user'); //load settings
        _(_(widgets).keys()).each(function (key) { //store the key in the object to identify it later
            widgets[key].key = key;
        });
        widgets = _(widgets).sortBy(function (widget) { //sort by index, transform to array
            return !widget.index ? 512 : (widget.index === 'last' ? 1024 : (widget.index === 'first' ? 1 : widget.index));
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
                    type = widget.key.substring(0, widget.key.lastIndexOf('_')),
                    name = widget.description,
                    key = widget.key;
                console.log("DEBUG", id, type, name, key, widget);

                var $thisSetting = $('<li class="io-ox-portal-setting">').attr({id: id }).data({name: name, type: type, key: key}).append( //basics
                    $('<span class="io-ox-setting-title io-ox-portal-settings-title">').text(name || key),
                    $colorSelect.clone(true),
                    $optionsButton.clone(true),
                    $additionalContent.hide()
                ).appendTo($extensions);

                if (!widget.enabled) {
                    $thisSetting.addClass('disabled');
                }

                if (!name) {
                    require([widget.plugin], function () {
                        var list = ext.point('io.ox/portal/widget/' + type).list();
                        if (list.length) {
                            name = list[0].title;
                            $thisSetting.find('.io-ox-portal-settings-title').text(name).data('name', name);
                        }
                    });
                }

                if (widget.color) { //color
                    $thisSetting.css('color', widget.color);
                    $thisSetting.find('.io-ox-portal-colorAction li').removeClass("selected");
                    $thisSetting.find('.io-ox-portal-colorAction [data-color="' + widget.color + '"]').addClass("selected");
                }

                if (widget.enabled) { //toggle enabled/disabled
                    $thisSetting.find('.io-ox-portal-action-disable a').text(gt('Disable')).on('click', onDisable);
                } else {
                    $thisSetting.find('.io-ox-portal-action-disable a').text(gt('Enable')).on('click', onEnable);
                }

                ext.point('io.ox/portal/settings/detail/' + type).each(function (extension) { //add advanced settings to extensions
                    extension.draw.apply($additionalContent, [widget]);
                });


            }); //end: widget.each


            $(that).append( //building the actual settings page from its components
                $('<h1>').text(gt('Portal Squares')),
                $addButton.clone(true),
                $extensions,
                $addButton.clone(true)
            );
        }); //end: require
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
            draw(data, this);
        }
    }); //end: extpoint

    return {};
}); //end: define
