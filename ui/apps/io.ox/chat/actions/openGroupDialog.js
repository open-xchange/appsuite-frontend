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

        getImageUrl: function () {
            var fileId = this.model.get('fileId');
            return fileId ? data.API_ROOT + '/files/' + fileId + '/thumbnail' : '';
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
                var title = this.model.id ? 'Edit group chat' : 'Create group chat';
                if (this.model.get('type') === 'channel') title = this.model.id ? 'Edit channel' : 'Create new channel';

                var title_id = _.uniqueId('title');
                this.$('.modal-header').empty().append(
                    $('<h1 class="modal-title">').attr('id', title_id).text(title),
                    new PictureUpload({ model: this.model }).render().$el
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
            var dataObj = this.model.toJSON();
            else dataObj.members = this.collection.pluck('email1');

            if (this.model.get('title') === originalModel.get('title')) delete dataObj.title;
            if (this.model.get('description') === originalModel.get('description')) delete dataObj.description;

            if (dataObj.pictureFileEdited === '') {
                dataObj.icon = null;
            } else if (this.model.get('pictureFile') === originalModel.get('pictureFile')) {
                dataObj.icon = undefined;
            } else {
                dataObj.icon = dataObj.pictureFileEdited;
            }

            data.chats.addAsync(dataObj).done(function (model) {
                def.resolve(model.id);
            });
        })
        .on('discard', def.reject)
        .open();

        return def.promise();
    }

    return open;
});
