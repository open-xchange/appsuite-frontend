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

define('io.ox/chat/views/fileList', ['io.ox/chat/data'], function (data) {

    'use strict';

    var FileList = Backbone.View.extend({

        className: 'files abs',

        initialize: function () {
            this.collection = new Backbone.Collection(data.files);
        },

        render: function () {
            this.$el.append(
                $('<div class="header abs">').append(
                    $('<h2>').append('All files')
                ),
                $('<div class="scrollpane abs">').append(
                    $('<ul>').append(
                        this.getItems().map(this.renderItem, this)
                    )
                )
            );
            return this;
        },

        getItems: function () {
            return this.collection;
        },

        renderItem: function (model, index) {
            return $('<li>').append(
                $('<button type="button" data-cmd="show-file">').attr('data-index', index)
                .css('backgroundImage', 'url(' + model.get('url') + ')')
            );
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        }
    });

    return FileList;
});
