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

define('io.ox/chat/views/state', ['io.ox/backbone/views/disposable'], function (DisposableView) {

    'use strict';

    var states = ['online', 'absent', 'busy', 'offline'];

    var StateView = DisposableView.extend({

        tagName: 'span',
        className: 'fa state',

        initialize: function () {
            this.listenTo(this.model, 'change:state', this.onChangeState);
        },

        render: function () {
            this.$el.addClass('offline');
            return this;
        },

        onChangeState: function () {
            var state = 'offline';
            this.$el.addClass(state).removeClass(_(states).without(state).join(' '));
        }
    });

    return StateView;
});
