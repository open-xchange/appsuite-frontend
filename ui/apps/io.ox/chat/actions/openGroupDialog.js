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


define('io.ox/chat/actions/openGroupDialog', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/contacts/widgets/pictureUpload',
    'io.ox/chat/views/members',
    'io.ox/chat/views/addMember',
    'io.ox/backbone/mini-views',
    'io.ox/chat/data',
    'less!io.ox/contacts/edit/style'
], function (ext, ModalDialog, ImageUploadView, MemberView, AddMemberView, mini, data) {

    'use strict';

    var PictureUpload = ImageUploadView.extend({

        render: function () {
            var result = ImageUploadView.prototype.render.call(this);

            var icon = this.model.get('type') === 'channel' ? 'fa-hashtag' : 'fa-group';
            this.$('.contact-photo').append($('<i class="fa fallback-icon">').addClass(icon));
            this.$('input').attr('data-state', 'manual');

            return result;
        },

        openEditDialog: function () {
            this.model.set('pictureFile', this.model.get('pictureFile') || this.model.get('file'));
            ImageUploadView.prototype.openEditDialog.apply(this, arguments);
            this.editPictureDialog.on('reset', function () {
                this.model.set('image1_data_url', '');
            }.bind(this));
        }

    });

    function open(obj) {
        var def = new $.Deferred();
        var model = data.chats.get(obj.id) || new Backbone.Model(obj);
        var members = [data.users.getByMail(data.user.email)];
        if (obj.members) {
            obj.members.forEach(function (email) {
                var model = data.users.getByMail(email);
                if (model) members.push(model);
            });
        }
        var participants = (model.members || new Backbone.Collection(members)).clone();
        var originalModel = model.has('roomId') ? model.clone() : new Backbone.Model();

        model.set('type', model.get('type') || obj.type || 'group');

        new ModalDialog({
            point: 'io.ox/chat/actions/openGroupDialog',
            model: model,
            collection: participants,
            backdrop: true,
            width: model.get('type') === 'group' ? 420 : 380
        })
        .extend({
            header: function () {
                var title = this.model.id ? 'Edit group chat' : 'Create group chat',
                    url = this.model.getIconUrl ? this.model.getIconUrl() : '';
                if (this.model.get('type') === 'channel') title = this.model.id ? 'Edit channel' : 'Create new channel';

                var title_id = _.uniqueId('title'),
                    pictureModel = this.pictureModel || (this.pictureModel = new Backbone.Model({
                        image1_data_url: url,
                        image1_url: url,
                        file: function () {
                            if (!url) return;
                            var def = $.ajax({
                                url: url,
                                xhrFields: { withCredentials: true, responseType: 'blob' }
                            }).then(function (data) {
                                return new Blob([data]);
                            }, function () {
                                return '';
                            });
                            def.lastModified = true;
                            return def;
                        }
                    }));

                this.$('.modal-header').empty().append(
                    $('<h1 class="modal-title">').attr('id', title_id).text(title),
                    new PictureUpload({ model: pictureModel }).render().$el
                );
            },
            details: function () {
                var guidDescription = _.uniqueId('form-control-label-');
                var guidTitle = _.uniqueId('form-control-label-');
                var type = this.model.get('type') === 'group' ? 'Group' : 'Channel';

                this.$body.append(
                    $('<div class="row">').append(
                        $('<div class="col-xs-12">').append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">').attr('for', guidTitle).text(type + ' name'),
                                new mini.InputView({ id: guidTitle, model: this.model, name: 'title' }).render().$el
                            ),
                            $('<div class="form-group hidden">').append(
                                $('<label class="control-label">').attr('for', guidDescription).text('Description'),
                                new mini.TextView({ id: guidDescription, model: this.model, name: 'description' }).render().$el
                            )
                        )
                    )
                );
            },
            participants: function () {
                if (this.model.get('type') === 'channel') return;

                this.$body.append(
                    new MemberView({
                        collection: this.collection
                    }).render().$el,
                    new AddMemberView({
                        collection: this.collection
                    }).render().$el
                );
            }
        })
        .build(function () {
            this.$el.addClass('ox-chat-popup ox-chat');
        })
        .addCancelButton()
        .addButton({ action: 'save', label: model.id ? 'Edit chat' : 'Create chat' })
        .on('save', function () {
            var updates = this.model.has('roomId') ? { roomId: this.model.get('roomId') } : this.model.toJSON();

            if (this.model.get('title') !== originalModel.get('title')) updates.title = this.model.get('title');
            if (this.model.get('description') !== originalModel.get('description')) updates.description = this.model.get('description');
            if (this.model.get('type') !== 'channel' && !_.isEqual(this.collection.pluck('email1'), Object.keys(this.model.get('members') || {}))) {
                updates.members = this.collection.pluck('email1');
            }

            if (this.pictureModel.get('pictureFileEdited') === '') {
                updates.icon = null;
            } else if (this.pictureModel.get('pictureFileEdited')) {
                updates.icon = this.pictureModel.get('pictureFileEdited');
            }

            if (Object.keys(updates).length <= 1) return def.resolve(this.model.get('roomId'));
            data.chats.addAsync(updates).done(function (model) {
                def.resolve(model.get('roomId'));
            });
        })
        .on('discard', def.reject)
        .open();

        return def.promise();
    }

    return open;
});
