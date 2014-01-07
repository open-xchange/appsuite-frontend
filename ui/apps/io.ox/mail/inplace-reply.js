/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/inplace-reply', [], function () {

    'use strict';

    // store messages during session. avoid data loss. no dialogs required.
    var replyCache = {};

    var InplaceReply = Backbone.View.extend({

        className: 'inplace-reply',

        events: {
            'change .inplace-editor': 'onChange'
        },

        onChange: function () {
            var content = this.getContent();
            replyCache[this.cid] = content;
        },

        getContent: function () {
            return this.$textarea.val();
        },

        setContent: function (content) {
            return this.$textarea.val(content);
        },

        initialize: function (options) {
            // remember cid
            this.cid = options.cid || _.uniqueId('reply');
            // register for 'dispose' event
            this.$el.on('dispose', $.proxy(this.dispose, this));
            // make all views accessible via DOM; gets garbage-collected on remove
            this.$el.data('view', this);
            // main control
            this.$textarea = $('<textarea class="inplace-editor" tabindex="1">')
                .attr({
                    'data-cid': this.cid,
                    'placeholder': 'Reply'
                });
            // prefill?
            var content = replyCache[this.cid] || '';
            if (content !== '') {
                _.defer(function () {
                    this.$el.parent().scrollTop(0);
                    this.setContent(content);
                    this.$textarea.focus().height(Math.min(this.$textarea.prop('scrollHeight') - 38, 300));
                }.bind(this));
            }
        },

        render: function () {
            this.$el.append(this.$textarea);
            return this;
        },

        dispose: function () {
            this.stopListening();
            this.model = null;
        }
    });

    return InplaceReply;
});
