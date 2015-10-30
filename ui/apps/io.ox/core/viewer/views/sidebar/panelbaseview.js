/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/panelbaseview', [
    'io.ox/backbone/disposable',
    'gettext!io.ox/core/viewer'
], function (DisposableView, gt) {

    'use strict';

    /**
     * The PanelBaseView is intended as a base view for the SidebarView sub views
     * and is responsible for creating and handling the panel.
     * Triggers 'open' and 'close' events at 'this.$el' when the panel body is opened / closed.
     */
    var PanelBaseView = DisposableView.extend({

        // overwrite constructor to keep initialize intact
        initialize: function (options) {

            var panelId = _.uniqueId('panel-');

            // we only need the DOM element at this point
            this.$el.addClass('sidebar-panel');

            // ensure we have options
            options = _.extend({ fixed: false }, options);

            if (options.fixed) {
                // static variant
                this.$el.append(
                    // header
                    $('<div class="sidebar-panel-heading">').append(
                        // title
                        $('<h3 class="sidebar-panel-title">').text('\u00a0')
                    ),
                    // body
                    $('<div class="sidebar-panel-body">')
                );
            } else {
                // dynamic variant
                this.$el.append(
                    // header
                    $('<div class="sidebar-panel-heading" role="tab" aria-expanded="false">').append(
                        // title
                        $('<h3 class="sidebar-panel-title">').text('\u00a0'),
                        // button
                        $('<a href="#" class="panel-toggle-btn" role="button" tabindex="1" aria-expanded="false">', { 'title': gt('Toggle panel'), 'aria-controls': panelId }).append(
                            $('<span class="sr-only">').text(gt('Toggle panel')),
                            $('<i class="fa fa-chevron-right toggle-icon" aria-hidden="true">')
                        )
                    ),
                    // body
                    $('<div class="sidebar-panel-body panel-collapsed" role="tabpanel" aria-label="" aria-hidden="true">', { id: panelId })
                );

                this.$el.on('click', '.sidebar-panel-heading', this.onTogglePanel.bind(this));
            }
        },

        /**
         * Set the panel header title.
         *
         * @param {String} title
         *  The title.
         */
        setPanelHeader: function (title) {
            this.$('.sidebar-panel-title').text(title || '\u00a0');
            this.$('.sidebar-panel-body').attr('aria-label', title || '');
            return this;
        },

        /**
         * Set new content to the panel body.
         */
        setPanelBody: function () {
            var panelBody = this.$('.sidebar-panel-body');
            panelBody.empty().append.apply(panelBody, arguments);
        },

        /**
         * Appends content to the panel body.
         */
        appendToPanelBody: function () {
            var panelBody = this.$('.sidebar-panel-body');
            panelBody.append.apply(panelBody, arguments);
        },

        /**
         * Panel toggle handler
         */
        onTogglePanel: function (e) {
            e.preventDefault();
            this.togglePanel();
        },

        /**
         * Toggles the panel depending on the state.
         *  State 'true' opens the panel, 'false' closes the panel and
         *  an unset state toggles the panel.
         *
         * @param {Boolean} [state].
         *  The panel state.
         */
        togglePanel: function (state) {
            // determine current state if undefined
            if (state === undefined) {
                state = this.$('.sidebar-panel-body').hasClass('panel-collapsed');
            }
            // toggle state
            this.$('.sidebar-panel-body').toggleClass('panel-collapsed', !state).attr('aria-hidden', !state);
            this.$('.sidebar-panel-heading').attr('aria-expanded', state);
            this.$('.panel-toggle-btn').attr('aria-expanded', state);
            this.$('.toggle-icon').toggleClass('fa-chevron-right', !state).toggleClass('fa-chevron-down', state);
            this.$el.trigger(state ? 'open' : 'close');
            return this;
        },

        render: function () {
            return this;
        }

    });

    return PanelBaseView;
});
