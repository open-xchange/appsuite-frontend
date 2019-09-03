/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/views/reference-preview', [
    'io.ox/backbone/views/disposable',
    'io.ox/mail/sanitizer'
], function (DisposableView, sanitizer) {

    'use strict';

    return DisposableView.extend({

        className: 'reference-preview',

        initialize: function (opt) {
            this.reference = opt.reference;
            var match = this.reference.match(/^([^/]*)\/\/(.*)$/);
            this.module = match[1];
            this.cid = match[2];
        },

        getReferenceApi: function () {
            switch (this.module) {
                case 'mail': return require(['io.ox/mail/api']);
                // no default
            }

            throw new Error('Unknown reference module: ' + this.module);
        },

        getTitle: function (data) {
            switch (this.module) {
                case 'mail': return data.subject;
                // no default
            }
        },

        getBody: function (data) {
            switch (this.module) {
                case 'mail': return data.attachments[0].content;
                // no default
            }
        },

        render: function () {
            this.$el.busy().append(
                $('<div>').append(
                    this.$title = $('<div class="title">').append('&nbsp;'),
                    this.$body = $('<div class="body">').append('&nbsp;')
                ),
                $('<div class="close">').append(
                    $('<button class="btn btn-link" data-cmd="remove-reference">').append($('<i class="fa fa-times">'))
                )
            );

            this.getReferenceApi().then(function (api) {
                return api.get(_.cid(this.cid));
            }.bind(this)).then(function (data) {
                this.$el.idle();
                this.$title.text(this.getTitle(data));
                var body = sanitizer.simpleSanitize(this.getBody(data));
                this.$body.text($(body).prop('innerText'));
            }.bind(this));
            return this;
        }
    });
});
