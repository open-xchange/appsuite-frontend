/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/framework/view/basecontrols',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/label',
     'gettext!io.ox/office/main'
    ], function (Utils, Label, gt) {

    'use strict';

    // static class BaseControls ==============================================

    var BaseControls = {};

    // constants --------------------------------------------------------------

    /**
     * Standard options for the 'Close' button.
     *
     * @constant
     */
    BaseControls.QUIT_OPTIONS = { icon: 'icon-remove', tooltip: gt('Close document') };

    /**
     * Standard options for the 'Hide side panel' button.
     *
     * @constant
     */
    BaseControls.HIDE_SIDEPANE_OPTIONS = { icon: 'docs-hide-sidepane', tooltip: gt('Hide side panel'), value: false };

    /**
     * Standard options for the 'Show side panel' button.
     *
     * @constant
     */
    BaseControls.SHOW_SIDEPANE_OPTIONS = { icon: 'docs-show-sidepane', tooltip: gt('Show side panel'), value: true };

    // class StatusLabel ======================================================

    /**
     * A status label with special appearance and fade-out animation.
     *
     * The method StatusLabel.update() expects a data object value containing
     * the following properties:
     *  - {String} [data.caption='']
     *      The caption text to be shown in the label.
     *  - {String} [data.type='info']
     *      The label type ('success', 'warning', 'error', or 'info').
     *  - {Boolean} [data.fadeOut=false]
     *      Whether to fade out the label automatically after a short delay.
     *  - {Number} [data.delay=0]
     *      The delay time after the status label will be actually updated.
     */
    BaseControls.StatusLabel = Label.extend({ constructor: function (app) {

        var // self reference
            self = this,

            // current initial delay timer before the state of the label will be changed
            initialTimer = null,

            // current animation delay timer (jQuery.delay() does not work well with jQuery.stop())
            animationTimer = null;

        // base constructor ---------------------------------------------------

        Label.call(this, { classes: 'status-label', updateHandler: updateHandler });

        // private methods ----------------------------------------------------

        /**
         * Stops the running jQuery fade animation and removes all explicit CSS
         * attributes from the group node.
         */
        function stopNodeAnimation() {
            self.getNode().stop(true).css({ display: '', opacity: '' });
        }

        /**
         * Callback called from the Label.update() method.
         */
        function updateHandler(value) {

            if (initialTimer) { initialTimer.abort(); }
            initialTimer = app.executeDelayed(function () {

                var // the new label text
                    caption = Utils.getStringOption(value, 'caption', ''),
                    // the new type of the label (colors)
                    type = Utils.getStringOption(value, 'type', 'info');

                // stop running fade-out and remove CSS attributes added by jQuery
                if (animationTimer) { animationTimer.abort(); }
                stopNodeAnimation();

                // update the status label
                if (caption.length > 0) {
                    self.setLabelText(caption).show().getNode().attr('data-type', type);
                    if (Utils.getBooleanOption(value, 'fadeOut', false)) {
                        animationTimer = app.executeDelayed(function () {
                            self.getNode().fadeOut(function () { self.hide(); });
                        }, { delay: 2000 });
                    }
                } else {
                    self.hide();
                }

            }, { delay: Utils.getIntegerOption(value, 'delay', 0, 0) });
        }

        // initialization -----------------------------------------------------

        this.update(null);
        app.on('docs:destroy', stopNodeAnimation);

    }}); // class StatusLabel

    // exports ================================================================

    return BaseControls;

});
