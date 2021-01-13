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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/emoji/view', [
    'io.ox/backbone/views/disposable',
    'raw!io.ox/core/emoji/unified.json',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'gettext!io.ox/core',
    'less!io.ox/core/emoji/style'
], function (DisposableView, unified, settings, mailSettings, gt) {

    'use strict';

    // parse once
    unified = JSON.parse(unified);

    var EmojiView = DisposableView.extend({

        className: 'emoji-picker',

        events: {
            'click .reset-recents': 'onResetRecents',
            'click .emoji-icons button': 'onInsertEmoji',
            'click .emoji-footer button': 'onSelectCategory',
            'click .emoji-option, .emoji-tab': 'onSelectEmojiCollection'
        },

        // when user clicks on emoji. inserts emoji into editor
        onInsertEmoji: function (e) {
            // this happens if user click on "reset-recents"
            if (e.isDefaultPrevented()) return;
            var unicode = $(e.target).text();
            util.addRecent(unicode);
            if (this.options.editor) this.options.editor.execCommand('mceInsertContent', false, unicode);
            this.trigger('insert', unicode);
            if (this.options.closeOnInsert && !(e.shiftKey || e.altKey)) {
                if (this.previousActiveElement) this.previousActiveElement.focus();
                this.hide();
            }
        },

        // when user clicks on emoji category
        onSelectCategory: function (e) {
            e.preventDefault();
            var node = $(e.target);
            this.setCategory(node.attr('data-category'));
        },

        // when user clicks on "Reset" in "Recently used" list
        onResetRecents: function (e) {
            e.preventDefault();
            util.resetRecents();
            this.drawEmojis();
        },

        initialize: function (options) {
            this.options = _.extend({ closeOnInsert: false, closeOnFocusLoss: false }, options);
            this.isRendered = false;
            this.isOpen = false;
            this.currentCategory = '';
            if (this.options.editor) this.$el.addClass('mceEmojiPane');
            if (this.options.closeOnFocusLoss) {
                this.$el.on('focusout', function () {
                    setTimeout(function () {
                        // we don't close if the focus is on the "opener" (as it usually works as a toggle)
                        if (document.activeElement === this.previousActiveElement) return;
                        var inside = $.contains(this.el, document.activeElement);
                        if (!inside) this.hide();
                    }.bind(this), 10);
                }.bind(this));
            }
        },

        render: function () {
            this.$el.append(
                $('<div class="emoji-header">').append(
                    $('<span class="emoji-category">')
                ),
                $('<div class="emoji-icons">'),
                $('<div class="emoji-footer">')
            );
            this.drawCategories();
            this.setCategory();
            this.isRendered = true;
            this.toggle(true);
            return this;
        },

        drawCategories: function () {
            this.$('.emoji-footer').empty().append(
                _(categories).map(function (category, id) {
                    return $('<button type="button">')
                        .attr('data-category', id)
                        .attr('title', name)
                        .text(category.code);
                })
            );
        },

        // get emojis of current category
        getEmojis: function () {
            return util.getEmojis(this.currentCategory);
        },

        // draw all emojis of current category
        drawEmojis: function () {

            var node = this.$('.emoji-icons').hide().empty(),
                list = this.getEmojis();

            node.append(
                list.map(function (code) {
                    try {
                        var emoji = /^0x/.test(code) ? String.fromCodePoint.apply(String, code.split(' ')) : code;
                        return $('<button type="button">').text(emoji);
                    } catch (e) {
                        console.error('String.fromCodePoint', code, e);
                        return '.';
                    }
                })
            );

            // add "reset" link for recently
            if (list.length > 0 && this.currentCategory === 'Recently') {
                node.append(
                    $('<button class="reset-recents">').text(gt('Reset this list'))
                );
            }

            node.show().scrollTop(0);
        },

        // set current category. sets title and triggers repaint of all icons
        setCategory: function (category) {
            // always draw emojis because the collection might have changed
            this.currentCategory = category || util.getDefaultCategory();
            this.$('.emoji-category').text(util.getCategoryName(this.currentCategory));
            this.$('.emoji-footer > button').removeClass('active');
            this.$('.emoji-footer > [data-category="' + this.currentCategory + '"]').addClass('active');
            this.drawEmojis();
        },

        // hide/show view
        toggle: function (state) {
            this.isOpen = state === undefined ? !this.isOpen : state;
            if (this.isOpen) {
                if (!this.isRendered) this.render();
                this.previousActiveElement = document.activeElement;
                this.$el.show();
                this.$('button:first').focus();
            } else {
                this.$el.hide();
            }
            this.trigger('toggle', this.isOpen);
        },

        hide: function () {
            this.toggle(false);
        }
    });

    var categories = {
        'Recently': {
            //#. Emoji category
            name: gt('Recently used'),
            code: '\ud83d\udd52'
        },
        'Smileys & People': {
            //#. Emoji category
            name: gt('Smileys & People'),
            code: '\ud83d\ude00'
        },
        'Animals & Nature': {
            //#. Emoji category
            name: gt('Animals & Nature'),
            code: '\ud83d\udc36'
        },
        'Food & Drink': {
            //#. Emoji category
            name: gt('Food & Drink'),
            code: '\ud83c\udf70'
        },
        'Activities': {
            //#. Emoji category
            name: gt('Activities'),
            code: '\u26bd'
        },
        'Travel & Places': {
            //#. Emoji category
            name: gt('Travel & Places'),
            code: '\ud83c\udfe0'
        },
        'Objects': {
            //#. Emoji category
            name: gt('Objects'),
            code: '\ud83d\udca1'
        },
        'Symbols': {
            //#. Emoji category
            name: gt('Symbols'),
            code: '\u2764'
        },
        'Flags': {
            //#. Emoji category
            name: gt('Flags'),
            code: '\ud83c\udfc1'
        }
    };

    // helper

    var util = {

        getDefaultCategory: function () {
            return 'Smileys & People';
        },

        getCategoryName: function (category) {
            return (categories[category] || {}).name || '';
        },

        getRecents: function () {
            // this has been are mail settings but we now (2021) use it at least for chat, too
            var oldRecently = mailSettings.get('emoji/recently', {});
            return settings.get('emoji/recently', oldRecently);
        },

        // add to "recently used" category
        addRecent: function (code) {
            var recently = this.getRecents();
            // encode unicode to avoid backend bug
            var key = escape(code);
            if (key in recently) {
                recently[key].count++;
                recently[key].time = _.now();
            } else {
                recently[key] = { count: 1, time: _.now() };
            }
            settings.set('emoji/recently', recently).save();
        },

        resetRecents: function () {
            settings.set('emoji/recently', {}).save();
        },

        getEmojis: function (category) {
            if (category !== 'Recently') return unified[category] || [];
            return _(this.getRecents())
                .chain()
                .map(function (value, key) {
                    return [unescape(key), value];
                })
                // sort by timestamp
                .sortBy(function (array) {
                    return 0 - array[1].time;
                })
                // get first 40 icons (5 rows; 8 per row)
                .first(40)
                // now sort by frequency (descending order)
                .sortBy(function (array) {
                    return array[1].count;
                })
                // extract the icon
                .pluck(0)
                .value()
                .reverse();
        }
    };

    EmojiView.util = util;

    return EmojiView;
});
