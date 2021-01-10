/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/util', ['gettext!io.ox/chat'], function (gt) {

    'use strict';

    var classNames = {
        'application/pdf': 'pdf',
        'image/svg': 'svg',
        'application/zip': 'zip',
        'text/plain': 'txt',

        // images
        'image/jpeg': 'image',
        'image/gif': 'image',
        'image/bmp': 'image',
        'image/png': 'image',

        // documents
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template': 'doc',
        'application/msword': 'doc',

        // excel
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'xls',
        'application/vnd.ms-excel': 'xls',

        // ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.template': 'ppt',
        'application/vnd.ms-powerpoint': 'ppt'
    };

    var fileTypeNames = {
        'application/pdf': 'PDF',
        'image/svg': 'SVG',
        'application/zip': 'ZIP',
        'text/plain': gt('Text file'),

        // images
        'image/jpeg': 'JPEG',
        'image/gif': 'GIF',
        'image/bmp': 'BMP',
        'image/png': 'PNG',

        // documents
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': gt('Text document'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template': gt('Text document'),
        'application/msword': gt('Text document'),

        // excel
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': gt('Excel document'),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template': gt('Excel document'),
        'application/vnd.ms-excel': 'Excel document',

        // ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': gt('Presentation'),
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow': gt('Presentation'),
        'application/vnd.openxmlformats-officedocument.presentationml.template': gt('Presentation'),
        'application/vnd.ms-powerpoint': gt('Presentation')
    };

    var util = {

        getDeliveryStateClass: function (deliveryState) {
            if (!deliveryState) return '';
            if (deliveryState.state) return deliveryState.state;
            var members = Object.keys(deliveryState);
            return members.reduce(function (memo, email) {
                var state = deliveryState[email].state;
                if (!state) return '';
                if (state === 'server' && memo !== '') return 'server';
                if (state === 'received' && memo === 'seen') return 'received';
                return memo;
            }, 'seen');
        },

        getClassFromMimetype: function (mimetype) {
            return classNames[mimetype] || 'file';
        },

        getFileTypeName: function (mimetype, fileName) {
            var name = fileTypeNames[mimetype];
            if (name) return name;

            name = fileName.split('.').length > 1 && fileName.split('.').pop().toUpperCase();
            return name || gt('File');
        },

        renderFile: function (file) {
            if (!file) return;
            return [
                util.svg({ icon: 'fa-' + util.getClassFromMimetype(file.mimetype) }).addClass('file-type'),
                $('<span class="name">').text(file.name)
            ];
        },

        strings: {
            compare: function (a, b) {
                if (!a) return -1;
                if (!b) return 1;
                if (a.length < b.length) return -1;
                if (a.length > b.length) return 1;
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            },
            greaterThan: function (a, b) {
                return util.strings.compare(a, b) > 0;
            }
        },

        isFile: function (obj) {
            if (obj instanceof File) return true;
            if (typeof obj.name === 'string' && obj.type) return true;
            return false;
        },

        svg: function (options) {
            var icon = map[options.icon] || '';
            return $('<svg viewbox="0 0 100 100" class="fa" aria-hidden="true" data-icon="' + options.icon + '">' +
                '<text x="50" y="86" text-anchor="middle">' + icon + '</text>' +
                '</svg>');
        }
    };

    var map = {
        'fa-address-book': '\uf2b9',
        'fa-bars': '\uf0c9',
        'fa-chevron-down': '\uf078',
        'fa-chevron-left': '\uf053',
        'fa-clock-o': '\uf017',
        'fa-download': '\uf019',
        'fa-envelope-o': '\uf003',
        'fa-group': '\uf0c0',
        'fa-hashtag': '\uf292',
        'fa-paperclip': '\uf0c6',
        'fa-paper-plane': '\uf1d8',
        'fa-phone': '\uf095',
        'fa-play': '\uf04b',
        'fa-plus': '\uf067',
        'fa-smile-o': '\uf118',
        'fa-times': '\uf00d',
        'fa-times-circle': '\uf057',
        'fa-user': '\uf007',
        'fa-users': '\uf0c0',
        'fa-window-maximize': '\uf2d0',
        // file types
        'fa-file': '\uf016', // fa-file-o
        'fa-pdf': '\uf1c1', // fa-file-pdf-o
        'fa-txt': '\uf0f6', // fa-file-text-o
        'fa-doc': '\uf1c3', // fa-file-word-o
        'fa-xls': '\uf1c3', // fa-file-excel-o
        'fa-ppt': '\uf1c4', // fa-file-powerpoint-o
        'fa-zip': '\uf187', // fa-archive
        'fa-svg': '\uf1c9', // fa-file-code-o
        'fa-image': '\uf1c5' // file-image-o
    };

    (function ($) {

        // we should MERGE this with other selection implementations
        // like list-selection.js after 7.10.5 (!)

        var pluginName = 'makeAccessible';

        $.fn[pluginName] = function (options) {
            return this.each(function () {
                if ($.data(this, 'plugin_' + pluginName)) return;
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            });
        };

        function Plugin(el, options) {
            this.el = el;
            this.$el = $(el);
            this.$el.data('plugin', this);
            this.options = $.extend({ selector: '[aria-selected]' }, options);
            this.initialize();
        }

        $.extend(Plugin.prototype, {

            initialize: function () {
                this.$el
                    .addClass('accessible-list')
                    .attr('tabindex', 0)
                    .on('focus', this.onFocus.bind(this))
                    .on('blur', this.onBlur.bind(this))
                    .on('keydown', this.options.selector, this.onKeydown.bind(this))
                    .on('click', this.options.selector, this.onClick.bind(this));
            },


            getItems: function () {
                return this.$el.find(this.options.selector);
            },

            find: function (el) {
                var items = this.getItems();
                if (_.isString(el)) el = items.filter(el);
                return { items: items, index: items.index(el) };
            },

            onFocus: function () {
                if (document.activeElement !== this.el) return;
                console.log('onFocus?');
                // forward focus to first item
                this.$el.attr('tabindex', -1);
                var f = this.find('[tabindex="0"]:first');
                this.select(f.index, f.items);
            },

            onBlur: function () {
                if ($.contains(this.el, document.activeElement)) return;
                // make sure an inner or the outer element is in tab order
                var f = this.find('[tabindex="0"]:first');
                this.$el.attr('tabindex', Math.min(f.index, 0));
            },

            onKeydown: function (e) {
                if (!/^(13|32|38|40)$/.test(e.which)) return;
                e.preventDefault();
                var f = this.find(document.activeElement);
                switch (e.which) {
                    // cursor up/down
                    case 38:
                    case 40:
                        this.focus(f.index + (e.which === 38 ? -1 : +1), f.items);
                        break;
                    // enter/space
                    case 13:
                    case 32:
                        this.select(f.index, f.items);
                        break;
                    // no default
                }
            },

            onClick: function (e) {
                var f = this.find(target(e));
                this.select(f.index, f.items);
            },

            focus: function (index, items) {
                this.change(index, { tabindex: true, focus: true }, items);
            },

            select: function (index, items) {
                this.change(index, { tabindex: true, focus: true, select: true, event: true }, items);
            },

            set: function (cid) {
                var f = this.find('[data-cid="' + $.escape(cid) + '"]');
                if (f.index === -1) return;
                this.$el.attr('tabindex', -1);
                this.change(f.index, { tabindex: true, focus: false, select: true, event: false }, f.items);
            },

            change: function (index, options, items) {
                items = items || this.getItems();
                index = Math.max(0, Math.min(index, items.length - 1));
                var $el = items.eq(index);
                if (options.tabindex) {
                    resetTabindex(items);
                    $el.attr('tabindex', 0);
                }
                if (options.focus) $el.focus();
                if (options.select) {
                    resetSelected(items);
                    $el.attr('aria-selected', true);
                }
                if (options.event) {
                    var cid = $el.data('cid');
                    this.$el.triggerHandler('select', [[cid]]);
                }
            }
        });

        function target(e) {
            return $(e.currentTarget);
        }

        function resetTabindex(items) {
            items.filter('[tabindex="0"]').attr('tabindex', -1);
        }

        function resetSelected(items) {
            items.filter('[aria-selected="true"]').attr('aria-selected', false);
        }

    }(jQuery));

    return util;
});
