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

define('io.ox/office/tk/toolbarconfig',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils'
     ], function (Extensions, Links, Utils) {

    'use strict';

    // class ToolBarConfiguration =============================================

    /**
     * Registers buttons and other control elements in the header tool bar of
     * the application window. Registration is done once for all instances of
     * the specified application type. The elements in the tool bar will be
     * generated according to this registration every time an application
     * window becomes visible.
     *
     * @constructor
     *
     * @param {String} moduleName
     *  The application type identifier.
     */
    function ToolBarConfiguration(moduleName) {

        var // self reference
            self = this,

            // prefix for action identifiers
            actionPath = moduleName + '/actions',

            // prefix for links into the window tool bar
            toolBarPath = moduleName + '/links/toolbar',

            // the index that will be passed to GUI elements inserted into the window tool bar
            groupIndex = 0;

        // class Group --------------------------------------------------------

        var Group = _.makeExtendable(function (groupId, options) {

            var // extension point of this group
                point = Extensions.point(toolBarPath + '/' + groupId),
                // the index that will be passed to GUI elements inserted into the group
                index = 0;

            // private methods ------------------------------------------------

            function getButtonOptions(key, options) {

                var // button active (false: hidden)
                    active = Utils.getBooleanOption(options, 'active', true),
                    // options for the button element
                    buttonOptions = active ? { index: index += 1, id: key, ref: actionPath + '/' + key } : null,
                    // width of the button, in pixels
                    width = Utils.getIntegerOption(options, 'width'),
                    minWidth = Utils.getIntegerOption(options, 'minWidth');

                // initialize button options
                if (buttonOptions) {
                    buttonOptions.cssClasses = 'btn btn-inverse';
                    buttonOptions.icon = Utils.getStringOption(options, 'icon');
                    if (_.isString(buttonOptions.icon)) {
                        buttonOptions.icon += ' icon-white';
                    }
                    buttonOptions.label = Utils.getStringOption(options, 'label');
                    if (width) {
                        buttonOptions.css = { width: width + 'px' };
                    }
                    if (minWidth) {
                        buttonOptions.css = { minWidth: minWidth + 'px' };
                    }
                }

                return buttonOptions;
            }

            // methods --------------------------------------------------------

            this.registerButton = function (key, handler, options) {

                var // options for the button element
                    buttonOptions = getButtonOptions(key, options);

                // do not initialize inactive buttons
                if (buttonOptions) {
                    // create the action, it registers itself at the global registry
                    new Links.Action(buttonOptions.ref, {
                        requires: true,
                        action: handler
                    });
                    // create the button element in the button group
                    point.extend(new Links.Button(buttonOptions));
                }

                return this;
            };

            this.addLabel = function (key, handler, options) {

                var // options for the button element
                    buttonOptions = getButtonOptions(key, options);

                // do not initialize inactive labels
                if (buttonOptions) {
                    point.extend(new Links.Button(buttonOptions));
                }

                return this;
            };

            this.end = function () { return self; };

            // initialization -------------------------------------------------

            // create the core ButtonGroup object
            new Links.ButtonGroup(toolBarPath, {
                id: groupId,
                index: groupIndex += 1,
                radio: Utils.getBooleanOption(options, 'radio')
            });

        }); // class Group

        // class ButtonGroup --------------------------------------------------

        var ButtonGroup = Group.extend({ constructor: function (id) {

            Group.call(this, id);

            this.addButton = function (key, options) {
                return this.registerButton(key, function (data) { data.app.getController().change(key); }, options);
            };

        }}); // class ButtonGroup

        // class RadioGroup ---------------------------------------------------

        var RadioGroup = Group.extend({ constructor: function (key) {

            Group.call(this, key, { radio: true });

            this.addButton = function (value, options) {
                return this.registerButton(key + '/' + value, function (data) { data.app.getController().change(key, value); }, options);
            };

        }}); // class RadioGroup

        // methods ------------------------------------------------------------

        this.addButtonGroup = function (id) {
            return new ButtonGroup(id);
        };

        this.addRadioGroup = function (id, handler) {
            return new RadioGroup(id, handler);
        };

    } // class ToolBarConfiguration

    // exports ================================================================

    return ToolBarConfiguration;

});
