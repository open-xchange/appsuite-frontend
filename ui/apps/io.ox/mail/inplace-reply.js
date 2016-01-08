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
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    'settings!io.ox/mail'
], function (DisposableView, api, yell, gt, settings) {

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

    var InplaceReplyView = DisposableView.extend({

        className: 'inplace-reply',

        events: {
            'input .inplace-editor': 'onChange',
            'click [data-action="send"]': 'onSend',
            'click [data-action="cancel"]': 'onCancel'
        },

        onSend: function () {
            // get reply
            this.busy(true);
            // alternativ also asks for HTML
            var view = getFormat() === 'text' ? 'text' : 'html';
            api.replyall(_.cid(this.cid), view)
                .done(this.onReplyReady.bind(this, $.trim(this.getContent())))
                .fail(this.onSendFail.bind(this));
        },

        onReplyReady: function (content, data) {
            // add content
            content = _.escape(content).replace(/\n/g, '<br>');
            // append quoted message
            content += '<br>' + data.attachments[0].content;
            // pick other stuff we need
            data = _(data).pick('from', 'to', 'cc', 'bcc', 'headers', 'priority', 'vcard', 'subject', 'sendtype', 'csid', 'msgref');
            // add content
            data.attachments = [{ id: 1, content_type: getContentType(), content: content }];
            // send
            api.send(data)
                .done(this.onSendComplete.bind(this))
                .fail(this.onSendFail.bind(this));
        },

        onSendComplete: function () {
            delete drafts[this.cid];
            this.$el.empty().append(
                $('<div class="alert alert-success" role="alert">').text(gt('Your reply has been sent'))
            );
            setTimeout(function ($el) {
                $el.fadeOut();
            }, 5000, this.$el);
        },

        onSendFail: function (e) {
            yell(e);
            this.busy(false);
        },

        busy: function (state) {
            this.$('.btn, textarea').prop('disabled', state).toggleClass('disabled', state);
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
                this.$textarea
                    // keep keyboard stuff local to avoid side-effects
                    .on('keydown keyup', function (e) { e.stopPropagation(); }),
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
                if (scrh <= 101) h = 101; else if (scrh >= 399) h = 399; else h = scrh + 6;
                this.style.height = h + 'px';
            });

            // defer initial focus ($el is not yet in DOM)
            setTimeout(function (node) { node.focus(); }, 0, this.$textarea);

            return this;
        }
    });

    InplaceReplyView.hasDraft = function (cid) {
        return !!drafts[cid];
    };

    // accessible for debugging
    InplaceReplyView.drafts = drafts;

    return InplaceReplyView;
});
