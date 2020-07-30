/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/administration/groups/settings/members', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/util',
    'io.ox/core/yell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (DisposableView, userAPI, groupAPI, util, yell, settings, gt) {

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
            this.$el.busy({ immediate: true });
            this.collection.resolve(this.model.get('members'))
                .always(function () {
                    if (this.disposed) return;
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
            .attr({ 'data-id': model.id })
            .append(
                $('<i class="fa fa-user" aria-hidden="true">'),
                $('<span class="name">').html(model.getFullNameHTML()),
                this.editable ?
                    $('<a href="#" role="button" class="close pull-right remove-member"><span aria-hidden="true">&times;</span></a>')
                    .attr('title', gt('Remove member'))
                    //#. %1$s is the user name of the group member
                    .attr('aria-label', gt('Remove %1$s', model.getFullName())) :
                    []
            );
        },

        toJSON: function () {
            return this.collection.pluck('internal_userid').sort();
        }
    });

    var Member = Backbone.Model.extend({

        idAttribute: 'internal_userid',

        constructor: function () {
            Backbone.Model.apply(this, arguments);
            // fix missing display name
            if (!this.attributes.display_name) this.attributes.display_name = this.attributes.email1;
            // typeahead needs "value"
            this.value = this.getFullName();
        },

        getSortName: function () {
            return (this.get('last_name') || this.get('first_name') || this.get('display_name') || '').toLowerCase();
        },

        getFullName: function () {
            return util.getFullName(this.attributes);
        },

        getFullNameHTML: function () {
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
            var LIMIT = settings.get('groups/limit', 1000);

            // fetch user data
            return userAPI.getList(members.slice(0, LIMIT)).done(function (list) {
                this.reset(list, { parse: true });
                if (members.length > list.length) yell('warning', gt('This dialog is limited to %1$d entries and this group exceeds this limitation. Therefore, some entries are not listed.', LIMIT));
            }.bind(this));
        }
    });

    return {
        View: View,
        Member: Member,
        MemberCollection: MemberCollection
    };
});
