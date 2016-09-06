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
    'io.ox/files/api',
    'io.ox/core/notifications'
], function (DisposableView, api, notifications) {

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
                console.log('hier?', meta);
                api.update(_.cid(this.options.cid), { meta: meta });
            });

            this.render().fetch();

            this.$('.note-title input').on('input', _.throttle(function () {
                this.updateTitle();
            }.bind(this), 5000));

            // this.$('.note-content').on('input', _.throttle(function () {
            //     console.log('throttle...');
            //     this.updateContent();
            // }.bind(this), 5000));

            // // fix line breaks
            this.$('.note-content').on('keydown', function (e) {
                switch (e.which) {
                    // enter
                    case 13:
                        e.preventDefault();
                        document.execCommand('insertHTML', false, '<br>');
                        break;
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
        },

        getModel: function () {
            var cid = this.options.cid,
                model = api.pool.get('detail').get(cid);
            if (!model) {
                model = new Backbone.Model();
                api.pool.get('detail').add(model);
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

            $.when(
                api.get(obj).fail(notifications.yell),
                $.ajax({ type: 'GET', url: api.getUrl(obj, 'view') + '&' + _.now(), dataType: 'text' })
            )
            .done(function (data, text) {
                if (self.disposed) return;
                // move some meta data silently
                self.model.set('preview', data.meta.note_preview, { silent: true });
                // set all other data
                self.model.set(data).set(self.parsePlainText(text[0]));
            });
        },

        parsePlainText: function (text) {

            text = $.trim(text);
            var lines = _.escape(text).split(/\n/), openList;

            lines = lines.map(function (line) {
                var match = line.match(/^(\*\s|\#\s|\-\s\[(?:\s|x)\])\s?(.+)$/), out, item;
                if (!match) {
                    if (openList) {
                        out = '</' + openList + '>' + (line.length ? line + '\n' : '');
                        openList = false;
                    } else {
                        out = line + '\n';
                    }
                    return out;
                }
                item = (/^-\s\[x]/.test(line) ? '<li class="checked">' : '<li>') + match[2] + '</li>';
                if (openList) return item;
                switch (line[0]) {
                    case '#': out = '<ol>'; openList = 'ol'; break;
                    case '-': out = '<ul class="todo">'; openList = 'ul'; break;
                    default: out = '<ul>'; openList = 'ul'; break;
                }
                return out + item;
            });

            var html = lines.join('')
                    .replace(/(^|[^\\])\*([^<\*]+)\*/g, '$1<b>$2</b>')
                    .replace(/(^|[^\\])\_([^<\_]+)\_/g, '$1<u>$2</u>')
                    .replace(/(^|[^\\])\~([^<\~]+)\~/g, '$1<strike>$2</strike>')
                    .replace(/(http\:\/\/\S+)/ig, '<a href="$1" target="_blank" rel="noopener">$1</a>')
                    .replace(/\n/g, '<br>');

            var preview = text.replace(/\s+/g, ' ').substr(0, 200);

            return { html: html, preview: preview, content: text };
        },

        updateTitle: function () {
            if (this.disposed) return;
            var title = this.$('.note-title input').val();
            this.model.set('title', title);
            var obj = _.cid(this.options.cid);
            api.update(obj, { title: title });
        },

        updateContent: function () {
            if (this.disposed) return;
            var html = this.$('.note-content').html();
            // get rid of unwanted DIVs (hopefully not needed)
            // html = html.replace(/<div>/gi, '<br>').replace(/<\/div>/gi, '');
            // we don't need <ul> elements
            html = html.replace(/<\/?ul[^>]*>/gi, '\n');
            // transform <li> elements
            html = html.replace(/<li[^>]*>([^<]*)<\/li>/gi, function (all, content) {
                return '* ' + content + '\n';
            });
            console.log('updateContent', html);
        }
    });

    // // update
    // return api.versions.upload({ id: data.id, folder: data.folder_id, file: blob, filename: data.filename })
    //     .done(function () {
    //         previous = model.toJSON();
    //     })
    //     .always(function () { view.idle(); })
    //     .fail(notifications.yell)
    //     .fail(function (error) {
    //         // file no longer exists
    //         if (error.code === 'IFO-0300') model.unset('id');
    //     });

    return DetailView;
});
