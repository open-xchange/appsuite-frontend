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

define('io.ox/office/tk/control/label',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    // class Label ============================================================

    /**
     * Creates a label control listening to update requests.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the label. Supports all
     *  options of the Group base class, and all generic formatting options for
     *  labels (see method Utils.createLabel() for details). Additionally,
     *  supports the following options:
     *  @param {Function} [updateHandler]
     *      If specified, will be called every time the label has to be
     *      updated. Will be called in the context of this control instance.
     *      Receives the new value of the label control as first parameter.
     */
    function Label(options) {

        var // create the label
            label = Utils.createLabel(options),

            // the update handler
            updateHandler = Utils.getFunctionOption(options, 'updateHandler');

        // private methods ----------------------------------------------------

        /**
         * Sets the passed value as caption label.
         *
         * @param [value]
         *  A value that will be set as caption label. If null or undefined is
         *  passed, the caption label will be cleared. Otherwise, the label
         *  will will be converted to a string value.
         */
        function defaultUpdateHandler(value) {
            var labelOptions = Utils.extendOptions(options, { label: (_.isUndefined(value) || _.isNull(value)) ? undefined : value });
            Utils.setControlCaption(label, labelOptions);
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // initialization -----------------------------------------------------

        // insert the label into this group, and register event handlers
        this.addChildNodes(label)
            .registerUpdateHandler(_.isFunction(updateHandler) ? updateHandler : defaultUpdateHandler);

    } // class Label

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: Label });

});
