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
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 */

define('io.ox/chat/views/groupAvatar', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/data'
],
function (DisposableView, data) {

    'use strict';

    var GroupAvatarView = DisposableView.extend({

        className: 'group avatar image',

        initialize: function () {
            this.listenTo(this.model, 'change:fileId', this.update);
        },

        render: function () {
            this.update();
            return this;
        },

        update: function () {
            this.$el.css('background-image', '').empty();

            if (this.model.has('fileId')) {
                this.$el.css('background-image', 'url(' + data.API_ROOT + '/files/' + this.model.get('fileId') + '/thumbnail)');
            } else {
                this.$el.append('<i class="fa fa-group">');
            }
        }
    });

    return GroupAvatarView;
});
