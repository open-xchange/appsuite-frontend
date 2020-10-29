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

define('io.ox/chat/views/chatMember', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/badge'
    //'gettext!io.ox/chat'
], function (DisposableView, BadgeView) {

    'use strict';

    var ChatMemberView = DisposableView.extend({

        tagName: 'div',
        className: 'chat-members-container',

        events: {
            'click .expand-members': 'toggleList'
        },

        initialize: function () {
            this.listenTo(this.collection, {
                add: this.onAdd,
                remove: this.onRemove
            });
        },

        render: function () {
            this.$el.append(
                $('<ul class="members">').append(this.collection.map(this.renderMember, this))
                //$('<button class="expand-members btn btn-link">').attr('title', gt('Show all members')).append($('<i class="fa fa-caret-down">'))
            );
            //this.updateToggleButton();
            return this;
        },

        updateToggleButton: function () {
            // cannot calculate length if invisible
            if (!this.$el.is(':visible')) return;

            var members = this.$el.find('li'),
                overflow = false;
            // check if we have started a second row
            for (var i = 0; i < members.length - 1 && overflow === false; i++) {
                if (members[i].offsetTop < members[i + 1].offsetTop) overflow = true;
            }
            if (overflow) return this.showButton();

            this.hideButton();
        },

        hideButton: function () {
            this.toggleList(false);
            this.$el.removeClass('show-button');
        },

        showButton: function () {
            this.$el.addClass('show-button');
        },

        toggleList: function (expand) {
            var isExpanded = _.isBoolean(expand) ? !expand : this.$el.closest('.header').hasClass('expanded');

            this.$el.closest('.header').toggleClass('expanded', !isExpanded)
                .find('.expand-members i')
                .toggleClass('fa-caret-up', !isExpanded)
                .toggleClass('fa-caret-down', isExpanded);
        },

        renderMember: function (model) {
            if (model.isMyself()) return $();
            return $('<li>').append(new BadgeView({ model: model }).render().$el);
        },

        onAdd: function (model) {
            this.$el.find('.members').append(
                $('<li>').append(new BadgeView({ model: model }).render().$el)
            );
            //this.updateToggleButton();
        },

        onRemove: function (model) {
            this.$el.find('[data-email="' + model.get('email1') + '"]').parent().remove();
            //this.updateToggleButton();
        }
    });

    return ChatMemberView;
});
