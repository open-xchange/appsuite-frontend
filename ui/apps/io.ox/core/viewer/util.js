/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/util', [
    'io.ox/core/date',
    'gettext!io.ox/core/viewer'
], function (OXDate, gt) {

    'use strict';

    var Util = {};

    // constants --------------------------------------------------------------
    /**
     * Maps the file categories of the OX Viewer model to Font Awesome icon classes.
     */
    Util.CATEGORY_ICON_MAP = {
        'file': 'fa-file-o',
        'txt': 'fa-file-text-o',
        'doc': 'fa-file-word-o',
        'ppt': 'fa-file-powerpoint-o',
        'xls': 'fa-file-excel-o',
        'image': 'fa-file-image-o',
        'video': 'fa-file-video-o',
        'audio': 'fa-file-audio-o',
        'pdf': 'fa-file-pdf-o'
    };

    /**
     * Returns a date formatted as string
     *
     * @param {Number} timestamp
     *  The core date.
     *
     * @param {Object} options
     *      @param {Boolean} [options.fulldate = false]
     *          If set to true the time part is added to the date String.
     *      @param {Boolean} [options.filtertoday = true]
     *          If set to true only displays the time part for today.
     *
     * @returns {String}
     *  The formatted date string.
     */
    Util.getDateFormated = function (timestamp, options) {
        if (!_.isNumber(timestamp)) { return '-'; }

        var opt = $.extend({ fulldate: false, filtertoday: true }, options || {}),
        now = new OXDate.Local(),
        d = new OXDate.Local(timestamp),
        timestr = function () {
            return d.format(OXDate.TIME);
        },
        datestr = function () {
            return d.format(OXDate.DATE) + (opt.fulldate ? ' ' + timestr() : '');
        },
        isSameDay = function () {
            return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getYear() === now.getYear();
        };
        return isSameDay() && opt.filtertoday ? timestr() : datestr();
    };

    /**
     * Shortens a String and returns a result object containing the original
     * and two Strings clipped to normal and short max length.
     *
     * @param {String} str
     *  The input String.
     *
     * @param {Object} options
     *  Additional parameters
     *
     * @param {Number} [options.maxNormal = 40]
     *  The max length for the String clipped to normal length.
     *
     * @param {Number} [options.maxShort = 26]
     *  The max length for the String clipped to short length.
     *
     * @param {String} [options.charpos = 'middle']
     *  The position of the ellipsis char, 'end' or 'middle'.
     *
     * @param {String} [options.char = '\u2026']
     *  The ellipsis char.
     *
     * @returns {Object}
     *  {String} title: the original or an empty String
     *  {String} data-label-normal: the String clipped to normal length
     *  {String} data-label-short: the String clipped to short length
     */
    Util.getClippedLabels = function (str, options) {

        var opt = _.extend({
                maxNormal: 40,
                maxShort: 26,
                charpos: 'middle'
            }, options || {}),

            text = String(str || '').trim(),

            normal = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxNormal }))),
            short = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxShort })));

        return {
            title: text,
            'aria-label': text,
            'data-label-normal': normal,
            'data-label-short': short
        };
    };

    /**
     * Set a clipped label and the title to the given node according to the device type.
     *
     * Shortens a String and returns a result object containing the original
     * and two clipped Strings.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     *
     * @param {String} str
     *  The label String.
     *
     * @param {String} [charpos = 'middle']
     *  The position of the ellipsis char, 'middle' or 'end'.
     */
    Util.setClippedLabel = function (node, str, charpos) {

        var attr = Util.getClippedLabels (str, charpos);

        node = (node instanceof $) ? node : $(node);
        node.attr(attr).addClass('viewer-responsive-label');
    };

    /**
     * Sets a CSS to indicate if current device is a 'smartphone' or 'tablet'
     * to the given DOM node.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     */
    Util.setDeviceClass = function (node) {
        node = (node instanceof $) ? node : $(node);
        node.addClass( _.device('smartphone') ? 'smartphone' : (_.device('tablet') ? 'tablet' : '') );
    };

    /**
     * Creates Bootstrap panel markup
     *
     *  @param {Object} options
     *      @param {String} options.title
     *          The panel header title.
     *      @param {String} [options.collapsed = false]
     *          If true the panel body is collapsed by default.
     *
     * @returns {jQuery}
     *  The jQuery panel node.
     */
    Util.createPanelNode = function (options) {
        var options = $.extend({ title: '', collapsed: false }, options || {}),
            panelId = _.uniqueId('panel-'),
            panelHeader,
            panelBody,
            toggleButton,
            buttonIcon,
            panel;

        /**
         * Panel toggle button handler, switches the panel header icon.
         */
        function onTogglePanel (event) {
            event.preventDefault();

            if (panelBody.hasClass('panel-collapsed')) {
                buttonIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                toggleButton.attr('aria-expanded', 'true');
                panelHeader.attr('aria-expanded', 'true');
            } else {
                buttonIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                toggleButton.attr('aria-expanded', 'false');
                panelHeader.attr('aria-expanded', 'false');
            }
        }

        toggleButton = $('<a>', {
            'class': 'toggle-panel panel-heading-button btn',
            href: '#',
            tabindex: 1,
            title: gt('Toggle panel'),
            role: 'button',
            'aria-label': options.title,
            'aria-controls': panelId,
            'aria-expanded': options.collapsed ? 'false' : 'true'
        });

        toggleButton[0].onclick = onTogglePanel;

        buttonIcon = $('<i>', { 'aria-hidden': 'true' }).addClass('fa fa-chevron-' + (options.collapsed ? 'right' : 'down'));

        panelHeader = $('<div>', { 'class': 'panel-heading', role: 'tab', 'aria-expanded': options.collapsed ? 'false' : 'true' }).append(
            $('<h3>').addClass('panel-title').text(options.title),
            toggleButton.append(
                buttonIcon
            )
        );

        panelBody = $('<div>', {
            'class': 'panel-body',
            id: panelId,
            role: 'tabpanel',
            'aria-label': options.title,
            'aria-hidden': (options.collapsed ? 'true' : 'false')
        })
        .addClass(options.collapsed ? 'panel-collapsed' : '')
        .css('display', (options.collapsed ? 'none' : 'block'));

        panel = $('<div>').addClass('panel panel-default').append(
            panelHeader,
            panelBody
        );

        return panel;
    };

    /**
     * Returns the Font Awesome icon class for the file category of the
     * given OX Viewer model.
     *
     * @param {Object} model
     *  The OX Viewer model.
     *
     * @returns {String}
     *  The Font Awesome icon class String.
     */
    Util.getIconClass = function (model) {
        if (!model) {
            return Util.CATEGORY_ICON_MAP.file;
        }
        var fileType = model.getFileType(),
            iconClass = Util.CATEGORY_ICON_MAP[fileType] || Util.CATEGORY_ICON_MAP.file;

        return iconClass;
    };

    /**
     * Extracts a property value from the passed object. If the property does
     * not exist, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some properties. May be undefined.
     *
     * @param {String} name
     *  The name of the property to be returned.
     *
     * @param {Any} [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified property.
     *
     * @returns {Any}
     *  The value of the specified property, or the default value.
     */
    Util.getOption = function (options, name, def) {
        return (_.isObject(options) && (name in options)) ? options[name] : def;
    };

    /**
     * Extracts a boolean property from the passed object. If the property does
     * not exist, or is not a boolean value, returns the specified default
     * value.
     *
     * @param {Object|Undefined} options
     *  An object containing some properties. May be undefined.
     *
     * @param {String} name
     *  The name of the boolean property to be returned.
     *
     * @param {Any} [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified property, or if the property is
     *  not a boolean value. May be any value (not only booleans).
     *
     * @returns {Any}
     *  The value of the specified property, or the default value.
     */
    Util.getBooleanOption = function (options, name, def) {
        var value = Util.getOption(options, name);
        return _.isBoolean(value) ? value : def;
    };

    /**
     * Creates and returns a merged options map from the passed objects. Unlike
     * Underscore's extend() method, does not modify the passed objects, but
     * creates and returns a clone. Additionally, extends embedded plain JS
     * objects deeply instead of replacing them, for example, extending the
     * objects {a:{b:1}} and {a:{c:2}} will result in {a:{b:1,c:2}}.
     *
     * @param {Object} [...]
     *  One or more objects whose properties will be inserted into the
     *  resulting object.
     *
     * @returns {Object}
     *  A new object containing all properties of the passed objects.
     */
    Util.extendOptions = function () {

        var // the resulting options
            result = {};

        function isPlainObject(value) {
            return _.isObject(value) && (value.constructor === Object);
        }

        function extend(options, extensions) {
            _.each(extensions, function (value, name) {
                if (isPlainObject(value)) {
                    // extension value is a plain object: ensure that the options map contains an embedded object
                    if (!isPlainObject(options[name])) {
                        options[name] = {};
                    }
                    extend(options[name], value);
                } else {
                    // extension value is not a plain object: clear old value, even if it was an object
                    options[name] = value;
                }
            });
        }

        // add all objects to the clone
        for (var index = 0; index < arguments.length; index += 1) {
            if (_.isObject(arguments[index])) {
                extend(result, arguments[index]);
            }
        }

        return result;
    };

    /**
     * Creates and returns the URL of a server request.
     *
     * @param {String} module
     *  The name of the server module.
     *
     * @param {Object} file
     *  the OX Drive file descriptor object.
     *
     * @param {Object} [params]
     *  Additional parameters inserted into the URL.
     *
     * @param {Object} [options]
     *  Optional parameters:
     *  @param {Boolean} [options.currentVersion=false]
     *      If set to true, the version stored in the file descriptor will
     *      NOT be inserted into the generated URL (thus, the server will
     *      always access the current version of the document).
     *
     * @returns {String|Undefined}
     *  The final URL of the server request; or undefined, if the
     *  application is not connected to a document file, or the current
     *  session is invalid.
     */
    Util.getServerModuleUrl = function (module, file, params, options) {
        // return nothing if no file is present
        if (!ox.session || !file) {
            return;
        }

        var // the parameters for the file currently loaded
            fileParams = Util.getFileParameters(file, Util.extendOptions(options, { encodeUrl: true })),
            // unique ID of current App
            currentAppUniqueID = ox.ui.App.getCurrentApp().get('uniqueID');

        // add default parameters (session and UID), and file parameters
        params = _.extend({ session: ox.session, uid: currentAppUniqueID }, fileParams, params);

        // build and return the resulting URL
        return ox.apiRoot + '/' + module + '?' + _.map(params, function (value, name) { return name + '=' + value; }).join('&');
    };

    /**
     * Returns an object with attributes describing the file currently
     * opened by this application.
     *
     * @param {Object} file
     *  the OX Drive file descriptor object.
     *
     * @param {Object} [options]
     *  Optional parameters:
     *  @param {Boolean} [options.encodeUrl=false]
     *      If set to true, special characters not allowed in URLs will be
     *      encoded.
     *  @param {Boolean} [options.currentVersion=false]
     *      If set to true, the version stored in the file descriptor will
     *      NOT be inserted into the result (thus, the server will always
     *      access the current version of the document).
     *
     * @returns {Object|Null}
     *  An object with file attributes, if existing; otherwise null.
     */
    Util.getFileParameters = function (file, options) {

        var // function to encode a string to be URI conforming if specified
            encodeString = Util.getBooleanOption(options, 'encodeUrl', false) ? encodeURIComponent : _.identity,
            // the resulting file parameters
            parameters = null;

        if (file) {
            parameters = {};

            // add the parameters to the result object, if they exist in the file descriptor
            _.each(['id', 'folder_id', 'filename', 'version', 'source', 'attached', 'module'], function (name) {
                if (_.isString(file[name])) {
                    parameters[name] = encodeString(file[name]);
                } else if (_.isNumber(file[name])) {
                    parameters[name] = file[name];
                }
            });

            // remove the version identifier, if specified
            if (Util.getBooleanOption(options, 'currentVersion', false)) {
                delete parameters.version;
            }
        }

        return parameters;
    };

    return Util;
});
