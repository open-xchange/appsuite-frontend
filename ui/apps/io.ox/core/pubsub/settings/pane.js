/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/pubsub/settings/pane',
        ['io.ox/core/extensions',
         'io.ox/core/pubsub/model',
         'io.ox/backbone/views',
         'settings!io.ox/core/pubsub',
         'gettext!io.ox/core/pubsub',
         'less!io.ox/core/pubsub/style.less'
        ],
         function (ext, model, views, settings, gt) {

    'use strict';

    var point = views.point('io.ox/core/pubsub/settings/list'),
        SettingView = point.createView({className: 'pubsub settings'}),
        items = new model.PubSubItems();

    ext.point('io.ox/core/pubsub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (point) {
            this.append(
                $('<div class="clear-title">').text(point.title),
                $('<div class="settings sectiondelimiter">')
            );
            new SettingView({model: items.fetch()}).render().$el.appendTo(this);
        }
    });

    point.extend({
        id: 'content',
        render: function () {
            var listNode = $('<ul>');

            this.model.done(function (res) {
                res.each(function (obj) {
                    $('<li>').append(
                        obj.get('displayName')
                    ).appendTo(listNode);
                });
            });
            listNode.appendTo(this.$el);
        }
    });
});
