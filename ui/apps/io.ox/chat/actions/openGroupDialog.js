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
    'io.ox/chat/util',
    'gettext!io.ox/chat',
    'less!io.ox/contacts/edit/style'
], function (ext, ModalDialog, ImageUploadView, MemberView, AddMemberView, mini, data, util, gt) {

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
            this.editPictureDialog.$title.text(gt('Change image'));
        }

    });

    function membersToObject(members) {
        var obj = {};
        members.forEach(function (email) {
            obj[email] = 'member';
        });
        return obj;
    }

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
        var originalModel = model.has('roomId') ? model.clone() : new data.ChatModel();

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
                var title = this.model.id ? gt('Edit group chat') : gt('Create group chat'),
                    url = this.model.getIconUrl ? this.model.getIconUrl() : '';
                if (this.model.get('type') === 'channel') title = this.model.id ? gt('Edit channel') : gt('Create new channel');

                var title_id = _.uniqueId('title'),
                    pictureModel = this.pictureModel || (this.pictureModel = new Backbone.Model({
                        image1_data_url: url,
                        image1_url: url,
                        file: function () {
                            if (!url) return;
                            return util.ajax({
                                url: url,
                                xhrFields: { responseType: 'blob' }
                            }).then(function (data) {
                                var blob = new Blob([data]);
                                blob.lastModified = true;
                                return blob;
                            }, function () {
                                return '';
                            });
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
                var label = this.model.get('type') === 'group' ? gt('Group name') : gt('Channel name');

                this.$body.append(
                    $('<div class="row">').append(
                        $('<div class="col-xs-12">').append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">').attr('for', guidTitle).text(label),
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
        .addButton({ action: 'save', label: model.id ? gt('Edit chat') : gt('Create chat') })
        .on('save', function () {
            var updates = this.model.has('roomId') ? { roomId: this.model.get('roomId') } : this.model.toJSON(), hiddenAttr = {};

            if (this.model.get('title') !== originalModel.get('title')) updates.title = this.model.get('title');
            if (this.model.get('description') !== originalModel.get('description')) updates.description = this.model.get('description');
            if (this.model.get('type') !== 'channel' && !_.isEqual(this.collection.pluck('email1'), Object.keys(this.model.get('members') || {}))) {
                var emails = this.collection.pluck('email1');
                if (this.model.isNew()) {
                    hiddenAttr.members = membersToObject(emails);
                } else {
                    var prevEmails = Object.keys(this.model.get('members')),
                        addedEmails = _.difference(emails, prevEmails),
                        removedEmails = _.difference(prevEmails, emails);
                    if (addedEmails.length > 0) hiddenAttr.add = membersToObject(addedEmails);
                    if (removedEmails.length > 0) hiddenAttr.remove = removedEmails;
                }
            }

            if (this.pictureModel.get('pictureFileEdited') === '') {
                hiddenAttr.icon = null;
            } else if (this.pictureModel.get('pictureFileEdited')) {
                hiddenAttr.icon = this.pictureModel.get('pictureFileEdited');
            }

            if (Object.keys(updates).length <= 1 && Object.keys(hiddenAttr).length <= 0) return def.resolve(this.model.get('roomId'));
            originalModel.save(updates, { hiddenAttr: hiddenAttr }).then(function () {
                data.chats.add(originalModel);
                def.resolve(originalModel.get('roomId'));
            });
        })
        .on('discard', def.reject)
        .open();

        return def.promise();
    }

    return open;
});
