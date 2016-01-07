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

define('io.ox/mail/inplace-reply', ['io.ox/backbone/disposable', 'gettext!io.ox/mail'], function (DisposableView, gt) {

    'use strict';

    // store messages during session. avoid data loss. no dialogs required.
    var replyCache = {};

    var InplaceReplyView = DisposableView.extend({

        className: 'inplace-reply',

        events: {
            'input .inplace-editor': 'onChange',
            'click [data-action="send"]': 'onSend',
            'click [data-action="cancel"]': 'onCancel'
        },

        onSend: function () {
            /*eslint-disable no-alert*/
            alert('Please insert another coin ...');
            /*eslint-enable no-alert*/
        },

        onCancel: function () {
            delete replyCache[this.cid];
            this.$el.remove();
        },

        onChange: function () {
            var content = $.trim(this.getContent());
            replyCache[this.cid] = content;
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
            this.$textarea = $('<textarea class="inplace-editor form-control" tabindex="1">')
                .attr('placeholder', 'Just a prototype; does not yet send the message!');

            // prefill?
            var content = replyCache[this.cid] || '';
            if (content !== '') this.setContent(content);
        },

        render: function () {

            this.$el.append(
                this.$textarea
                    // keep keyboard stuff local to avoid side-effects
                    .on('keydown keyup', function (e) { e.stopPropagation(); }),
                $('<div class="form-group">').append(
                    this.$send = $('<button class="btn btn-primary disabled" data-action="send" tabindex="1">')
                        .prop('disabled', true)
                        .text(gt('Reply to all')),
                    $.txt(' '),
                    $('<button class="btn btn-default" data-action="cancel" tabindex="1">')
                        .text(gt('Cancel'))
                )
            );

            this.updateSendButton();

            // interval to grow once
            this.$textarea.on('input', function () {
                this.style.height = 'auto';
                var scrh = this.scrollHeight, h = 0;
                if (scrh <= 119) h = 119; else if (scrh >= 399) h = 399; else h = scrh + 6;
                this.style.height = h + 'px';
            });

            // defer initial focus ($el is not yet in DOM)
            setTimeout(function (node) { node.focus(); }, 0, this.$textarea);

            return this;
        }
    });

    InplaceReplyView.hasDraft = function (cid) {
        return !!replyCache[cid];
    };

    return InplaceReplyView;
});
