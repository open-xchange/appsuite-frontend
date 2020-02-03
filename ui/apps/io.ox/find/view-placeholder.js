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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view-placeholder', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core'
], function (DisposableView, gt) {

    'use strict';

    var PlaceholderView = DisposableView.extend({

        events: {
            'focusin': 'focused',
            'keyup': 'showSpinner'
        },

        initialize: function (options) {
            var win = options.app.getWindow();
            // field stub already rendered by desktop.js
            this.setElement(win.nodes.sidepanel.find('.io-ox-find'));

            // shortcuts
            this.ui = {
                field: this.$el.find('.search-field'),
                action: this.$el.find('.action-show')
            };

            // reuse
            this.options = options;

            this.listenTo(options.app, 'view:disable', this.disable);
            this.listenTo(options.app, 'view:enable', this.enable);
        },

        hideSpinner: function () {
            this.ui.action.idle();
        },

        showSpinner: function () {
            this.ui.action.busy({ immediate: true });
        },

        disable: function () {
            // only real change. We want to avoid screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === true) return;
            this.ui.field.prop('disabled', true);
            this.ui.action.prop('disabled', true);
            this.ui.field.find('input.token-input.tt-input').removeAttr('tabindex');
            this.$el.find('.arialive').text(gt('Search function not supported in this folder'));
        },

        enable: function () {
            // only real change. We want to avoid screenreader talking with every folderchange
            if (this.ui.field.prop('disabled') === false) return;
            this.ui.field.prop('disabled', false);
            this.ui.action.prop('disabled', false);
            this.ui.field.find('input.token-input.tt-input').attr('tabindex', 0);
            this.$el.find('.arialive').text('');
        },

        focused: function () {
            this.trigger('launch');
            this.destroy();
        },

        destroy: function () {
            if (this.disposed) return;
            this.hideSpinner();
            this.trigger('destroy');
            this.dispose();
        }
    });

    return PlaceholderView;
});
