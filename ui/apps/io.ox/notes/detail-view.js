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

define('io.ox/notes/detail-view', [
    'io.ox/backbone/views/disposable',
    'io.ox/notes/api',
    'io.ox/notes/parser',
    'io.ox/core/notifications'
], function (DisposableView, api, parser, notifications) {

    'use strict';

    var DetailView = DisposableView.extend({

        className: 'abs note',

        initialize: function (options) {

            this.options = options || {};
            this.model = this.getModel();
            this.$el.attr('data-cid', this.options.cid);

            this.listenTo(this.model, 'change:html', this.renderHTML);
            this.listenTo(this.model, 'change:title', this.renderTitle);
            this.listenTo(this.model, 'change:preview', function (model, value) {
                var meta = _.extend({}, this.model.get('meta'), { note_preview: value });
                this.model.set('meta', meta);
                api.update(this.options.cid, { meta: meta });
            });

            this.render().fetch();

            this.$('.note-content').on('keydown', function (e) {

                if (!e.metaKey) return;

                switch (e.which) {
                    // "S"
                    case 83:
                        e.preventDefault();
                        document.execCommand('strikeThrough', false, 'true');
                        break;
                    // "U"
                    case 85:
                        e.preventDefault();
                        document.execCommand('underline', false, 'true');
                        break;
                    // no default
                }
            });

            this.$('.note-content').on('click', 'ul.todo li', function (e) {
                if (e.offsetX >= 0) return;
                $(this).toggleClass('checked');
                $(e.delegateTarget).trigger('input');
            });

            var THROTTLE = 60 * 1000;

            this.updateContent = _.throttle(function () {
                this.updateContentImmediately();
            }, THROTTLE, { leading: false });

            this.updateTitle = _.throttle(function () {
                this.updateTitleImmediately();
            }, THROTTLE, { leading: false });

            this.$('.note-content').on('input', this.updateContent.bind(this));
            this.$('.note-title input').on('input', this.updateTitle.bind(this));

            this.on('dispose', function () {
                this.updateContentImmediately();
                this.updateTitleImmediately();
            });
        },

        getModel: function () {
            var model = api.getModel(this.options.cid);
            if (!model) {
                model = new Backbone.Model();
                api.addToPool(model);
            }
            return model;
        },

        render: function () {
            this.$el.append(
                $('<div class="abs note-title">').append($('<input type="text">')),
                $('<div class="abs note-content scrollable" tabindex="0" contenteditable="true" spellcheck="true">')
            );
            this.renderTitle();
            this.renderHTML();
            return this;
        },

        renderTitle: function () {
            this.$('.note-title input').val(
                String(this.model.get('title') || '').replace(/\.txt$/i, '')
            );
        },

        renderHTML: function () {
            this.$('.note-content').html(this.model.get('html') || '');
        },

        fetch: function () {

            // quick check if we already have model data
            if (this.model.has('preview')) return;

            var obj = _.cid(this.options.cid), self = this;

            api.get(obj)
                .done(function (response) {
                    if (self.disposed) return;
                    // move some meta data silently
                    var data = response.data;
                    self.model.set('preview', data.meta.note_preview, { silent: true });
                    // set all other data
                    self.model.set(data).set(parser.parsePlainText(response.content));
                })
                .fail(notifications.yell);
        },

        updateContentImmediately: function () {
            if (this.disposed) return;
            var result = parser.parseHTML(this.$('.note-content'));
            if (result.content === this.model.get('content')) return;
            this.model.set(result);
            console.log('updateContentImmediately', result);
            // api.updateContent(this.model.pick('id', 'folder_id', 'filename'), result.content);
            // this.$debug = this.$debug || $('<div class="note-debug">').appendTo('body');
            // this.$debug.text(this.model.get('editedContent'));
        },

        updateTitleImmediately: function () {
            if (this.disposed) return;
            var title = this.$('.note-title input').val();
            if (title === this.model.get('title')) return;
            this.model.set('title', title);
            api.update(this.options.cid, { title: title });
        }
    });

    return DetailView;
});
