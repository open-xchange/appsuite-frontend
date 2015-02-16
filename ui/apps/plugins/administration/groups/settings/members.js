/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/administration/groups/settings/members', [
    'io.ox/backbone/disposable',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/util',
    'gettext!io.ox/core'
], function (DisposableView, userAPI, groupAPI, util, gt) {

    'use strict';

    //
    // Members list
    //

    var View = DisposableView.extend({

        tagName: 'ul',
        className: 'administration-group-members',

        events: {
            'click .remove-member': 'onRemove'
        },

        onRemove: function (e) {
            e.preventDefault();
            var id = $(e.target).closest('.group-member').attr('data-id'),
                model = this.collection.get(id);
            this.collection.remove(model);
        },

        initialize: function (options) {

            this.editable = !!options.editable;
            this.collection = new MemberCollection();
            this.listenTo(this.collection, 'reset add remove', this.renderMemberList);

            if (this.editable) this.$el.addClass('editable');

            this.resolveMembers();

            // respond to API change
            this.listenTo(groupAPI.collection, 'change:members', this.resolveMembers);
        },

        resolveMembers: function () {
            this.$el.busy();
            this.collection.resolve(this.model.get('members'))
                .always(function () {
                    this.$el.idle();
                }.bind(this));
        },

        renderMemberList: function () {
            this.$el.empty().append(
                this.collection.map(this.renderMember, this)
            );
        },

        renderMember: function (model) {
            return $('<li class="group-member">')
            .attr('data-id', model.id)
            .append(
                $('<i class="fa fa-user">'),
                $('<span class="name">').html(model.getFullName()),
                this.editable ?
                    $('<a href="#" class="close pull-right remove-member">&times;</a>').attr('title', gt('Remove user')) :
                    []
            );
        },

        toJSON: function () {
            return this.collection.pluck('internal_userid').sort();
        }
    });

    var Member = Backbone.Model.extend({

        idAttribute: 'internal_userid',

        getSortName: function () {
            return (this.get('last_name') || this.get('first_name') || this.get('display_name') || '').toLowerCase();
        },

        getFullName: function () {
            return util.getFullName(this.attributes, true);
        }
    });

    var MemberCollection = Backbone.Collection.extend({

        comparator: function (model) {
            return model.getSortName();
        },

        model: Member,

        resolve: function (members) {
            if (!members.length) return $.when();
            return userAPI.getList(members).done(function (list) {
                this.reset(list, { parse: true });
            }.bind(this));
        }
    });

    return {
        View: View,
        Member: Member,
        MemberCollection: MemberCollection
    };
});
