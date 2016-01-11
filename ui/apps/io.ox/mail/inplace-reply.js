/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/inplace-reply', [
    'io.ox/backbone/disposable',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    'settings!io.ox/mail'
], function (DisposableView, api, accountAPI, yell, gt, settings) {

    'use strict';

    // store messages during session. avoid data loss. no dialogs required.
    var drafts = {};

    // helper

    function getFormat() {
        return settings.get('messageFormat', 'html');
    }

    function getContentType() {
        switch (getFormat()) {
            case 'alternative': return 'alternative';
            case 'html': return 'text/html';
            default: return 'text/plain';
        }
    }

    function getProperDisplayName(from) {
        return accountAPI.getSenderAddresses().then(function (addresses) {
            var name, address = from[1];
            // drop display name?
            if (!settings.get('sendDisplayName', true)) {
                // no display name at all
                name = null;
            } else if (settings.get(['customDisplayNames', address, 'overwrite'])) {
                // custom display name
                name = settings.get(['customDisplayNames', address, 'name'], '');
            } else {
                // look for matching sender address
                name = (_(addresses).find(function (item) { return item[1] === address; }) || from)[0];
            }
            return [name, address];
        });
    }

    function transformID(sent) {
        var matches = /^(.+)\D(\d+)$/.exec(sent);
        return _.cid({ folder_id: matches[1], id: matches[2] });
    }

    var InplaceReplyView = DisposableView.extend({

        className: 'inplace-reply',

        events: {
            'input .inplace-editor': 'onChange',
            'click [data-action="send"]': 'onSend',
            'click [data-action="cancel"]': 'onCancel',
            'keydown': 'onKeyUpDown',
            'keyup': 'onKeyUpDown'
        },

        onSend: function () {
            // get reply
            this.busy(true).setProgress(30);
            // alternativ also asks for HTML
            var view = getFormat() === 'text' ? 'text' : 'html';
            api.replyall(_.cid(this.cid), view)
                .done(this.onReplyReady.bind(this, $.trim(this.getContent())))
                .fail(this.onSendFail.bind(this));
        },

        onReplyReady: function (content, data) {
            // progress
            this.setProgress(70);
            // escape plain text content since we always send HTML
            content = _.escape(content).replace(/\n/g, '<br>');
            // append quoted content of original message
            content += '<br>' + data.attachments[0].content;
            // pick other stuff we need
            data = _(data).pick('from', 'to', 'cc', 'bcc', 'headers', 'priority', 'vcard', 'subject', 'sendtype', 'csid', 'msgref');
            data.attachments = [{ id: 1, content_type: getContentType(), content: content }];
            getProperDisplayName(data.from[0]).done(function (from) {
                data.from[0] = from;
                // go!
                api.send(data)
                    .done(this.onSendComplete.bind(this))
                    .fail(this.onSendFail.bind(this));
            }.bind(this));
        },

        onSendComplete: function (response) {
            this.setProgress(100);
            this.trigger('send', transformID(response.data));
            delete drafts[this.cid];
            var view = this, $el = this.$el;
            setTimeout(function () {
                view.renderSuccess();
                setTimeout(function () {
                    $el.fadeOut();
                    $el = view = null;
                }, 4000);
            }, 1000);
        },

        onSendFail: function (e) {
            yell(e);
            this.busy(false);
        },

        onCancel: function () {
            delete drafts[this.cid];
            this.$el.remove();
        },

        onChange: function () {
            var content = $.trim(this.getContent());
            drafts[this.cid] = content;
            this.updateSendButton(content);
        },

        onKeyUpDown: function (e) {
            // keep keyboard stuff local to avoid side-effects
            e.stopPropagation();
            // respond to <esc> if empty
            if (e.which === 27 && $.trim(this.getContent()) === '') this.onCancel();
        },

        busy: function (state) {
            if (this.disposed) return this;
            this.$('textarea, .form-group').toggle(!state);
            return this;
        },

        setProgress: function (pct) {
            if (this.disposed) return this;
            this.$('.progress').toggle(pct > 0);
            this.$('.progress-bar').width(pct + '%').attr('aria-valuenow', pct);
            return this;
        },

        updateSendButton: function (content) {
            content = content || $.trim(this.getContent());
            var isEmpty = !content.length;
            this.$send.toggleClass('disabled', isEmpty).prop('disabled', isEmpty);
        },

        getContent: function () {
            return this.$textarea.val();
        },

        setContent: function (content) {
            return this.$textarea.val(content);
        },

        initialize: function (options) {

            // remember cid
            this.cid = options.cid;

            this.$send = $();
            this.$textarea = $('<textarea class="inplace-editor form-control" tabindex="1">');

            // prefill?
            var content = drafts[this.cid] || '';
            if (content !== '') this.setContent(content);
        },

        render: function () {

            this.$el.append(
                // editor
                this.$textarea,
                // progress bar (while sending)
                $('<div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">')
                    .append($('<div class="progress-bar progress-bar-striped active" style="width: 0%">'))
                    .hide(),
                // buttons
                $('<div class="form-group">').append(
                    this.$send = $('<button class="btn btn-primary btn-sm disabled" data-action="send" tabindex="1">')
                        .prop('disabled', true)
                        .text(gt('Reply to all')),
                    $.txt(' '),
                    $('<button class="btn btn-default btn-sm" data-action="cancel" tabindex="1">')
                        .text(gt('Cancel'))
                )
            );

            this.updateSendButton();

            // interval to grow once
            this.$textarea.on('input', function () {
                this.style.height = 'auto';
                var scrh = this.scrollHeight, h = 0;
                if (scrh <= 105) h = 105; else if (scrh >= 399) h = 399; else h = scrh + 6;
                this.style.height = h + 'px';
            });

            // defer initial focus ($el is not yet in DOM)
            setTimeout(function (node) { node.focus(); }, 0, this.$textarea);

            return this;
        },

        renderSuccess: function () {
            this.$el.empty().append(
                $('<div class="alert alert-success" role="alert">').append(
                    $('<i class="fa fa-check" aria-hidden="true">'),
                    $.txt(' '),
                    $.txt(gt('Your reply has been sent'))
                )
            );
        }
    });

    InplaceReplyView.hasDraft = function (cid) {
        return !!drafts[cid];
    };

    // accessible for debugging
    InplaceReplyView.drafts = drafts;

    return InplaceReplyView;
});
