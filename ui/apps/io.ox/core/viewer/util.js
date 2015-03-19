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
     * The Unicode character for a horizontal ellipsis.
     *
     * @constant
     */
    Util.ELLIPSIS_CHAR = '\u2026';

    /**
     * A unique object used as return value in callback functions of iteration
     * loops to break the iteration process immediately.
     *
     * @constant
     */
    Util.BREAK = {};

    /**
     * A function that does nothing and returns its calling context (the symbol
     * this).
     *
     * @constant
     */
    Util.NOOP = function () { return this; };

    /**
     * Number of colors in the color scheme used for highlighting of specific
     * document contents.
     *
     * @constant
     */
    Util.SCHEME_COLOR_COUNT = 7;

    /**
     * A Boolean flag specifying whether the current display is a retina
     * display.
     *
     * @constant
     */
    Util.RETINA = _.device('retina');

    /**
     * A Boolean flag specifying whether the current device is small (smart
     * phones).
     *
     * @constant
     */
    Util.SMALL_DEVICE = _.device('smartphone');

    /**
     * A Boolean flag specifying whether the current device is small (smart
     * phones) or medium sized (tablets with a width of less than 1024px).
     *
     * @constant
     */
    Util.COMPACT_DEVICE = Util.SMALL_DEVICE || _.device('tablet');

    /**
     * A Boolean flag specifying whether the Internet Explorer version 9 is
     * running.
     *
     * @constant
     */
    Util.IE9 = _.isNumber(_.browser.IE) && (_.browser.IE < 10);

    /**
     * A Boolean flag specifying whether the current device is a Touch Device.
     *
     * @constant
     */
    Util.TOUCHDEVICE = Modernizr.touch;

    /**
     * A Boolean flag specifying whether the current device is an iPad.
     *
     * @constant
     */
    Util.IPAD = !!(Util.TOUCHDEVICE && _.browser.iOS && _.browser.Safari);

    /**
     * A Boolean flag specifying whether the current device is Android and the
     * browser is Chrome.
     *
     * @constant
     */
    Util.CHROME_ON_ANDROID = !!(_.browser.Android && _.browser.Chrome);

    /**
     * Determines the performance level of the system using some system and
     * browser specific values.
     *
     * @returns {Number}
     *  A performance level, as percentage between 0 and 100, where the value 0
     *  means poor performance, and the value 100 best performance.
     */
    Util.PERFORMANCE_LEVEL = (function () {

        var // default factor for unknown devices/browsers
            DEFAULT_FACTOR = 0.8,
        // the resulting factor
            resultLevel = 100;

        function getAspectFactor(aspects) {
            var aspectFactor = _.find(aspects, function (factor, key) { return _.device(key); });
            return _.isNumber(aspectFactor) ? aspectFactor : DEFAULT_FACTOR;
        }

        // reduce performance level by device type
        resultLevel *= getAspectFactor({ desktop: 1, tablet: 0.6, smartphone: 0.5 });
        // reduce performance level by browser type
        resultLevel *= getAspectFactor({ chrome: 1, safari: 1, firefox: 0.9, ie: 0.6 });

        // ensure value is at least 10%
        resultLevel = Math.max(10, resultLevel);
        //Util.log('Util: platform performance level: ' + (Math.round(resultLevel * 10) / 10) + '%');
        return resultLevel;
    }());

    /**
     * A Boolean flag specifying whether the current device is considered to be
     * slow.
     *
     * @constant
     */
    Util.SLOW_DEVICE = Util.PERFORMANCE_LEVEL <= 50;

    /**
     * The maximum explicit size of single DOM nodes, in pixels. The size is
     * limited by browsers; by using larger sizes the elements may collapse to
     * zero size.
     * - IE limits this to 1,533,917 (2^31/1400) in both directions.
     * - Firefox limits this to 17,895,696 (0x1111110) in both directions.
     * - Chrome limits this to 33,554,428 (0x1FFFFFC) in both directions.
     *
     * @constant
     */
    Util.MAX_NODE_SIZE = _.browser.IE ? 1.5e6 : _.browser.WebKit ? 33.5e6 : 17.8e6;

    /**
     * The maximum width of a container node that can be reached by inserting
     * multiple child nodes, in pixels. The width is limited by browsers; by
     * inserting more nodes the width of the container node becomes incorrect
     * or collapses to zero.
     * - IE limits this to 10,737,418 (2^31/200) pixels.
     * - Firefox and Chrome do not allow to extend the container node beyond
     *   the explicit size limits of a single node (see comment for the
     *   Util.MAX_NODE_SIZE constant above).
     *
     * @constant
     */
    Util.MAX_CONTAINER_WIDTH = _.browser.IE ? 10.7e6 : Util.MAX_NODE_SIZE;

    /**
     * The maximum height of a container node that can be reached by inserting
     * multiple child nodes, in pixels. The height is limited by browsers; by
     * inserting more nodes the height of the container node becomes incorrect
     * or collapses to zero.
     * - IE limits this to 21,474,836 (2^31/100) pixels.
     * - Firefox and Chrome do not allow to extend the container node beyond
     *   the explicit size limits of a single node (see comment for the
     *   Util.MAX_NODE_SIZE constant above).
     *
     * @constant
     */
    Util.MAX_CONTAINER_HEIGHT = _.browser.IE ? 21.4e6 : Util.MAX_NODE_SIZE;

    /**
     * Maps the file categories of the OX Viewer model to Font Awesome icon classes.
     */
    Util.CATEGORY_ICON_MAP = {
        'OFFICE': 'fa-file-text-o',
        'OFFICE_TEXT': 'fa-file-word-o',
        'OFFICE_PRESENTATION': 'fa-file-powerpoint-o',
        'OFFICE_SPREADSHEET': 'fa-file-excel-o',
        'IMAGE': 'fa-file-image-o',
        'VIDEO': 'fa-file-video-o',
        'AUDIO': 'fa-file-audio-o',
        'PDF': 'fa-file-pdf-o'
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
        var fileCategory = model && model.get('fileCategory'),
            iconClass = Util.CATEGORY_ICON_MAP[fileCategory] || 'fa-file-o';

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
     * Extracts a string property from the passed object. If the property does
     * not exist, or is not a string, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some properties. May be undefined.
     *
     * @param {String} name
     *  The name of the string property to be returned.
     *
     * @param {Any} [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified property, or if the property is
     *  not a string. May be any value (not only strings).
     *
     * @param {Boolean} [nonEmpty=false]
     *  If set to true, only non-empty strings will be returned from the
     *  options object. Empty strings will be replaced with the specified
     *  default value.
     *
     * @returns {Any}
     *  The value of the specified property, or the default value.
     */
    Util.getStringOption = function (options, name, def, nonEmpty) {
        var value = Util.getOption(options, name);
        return (_.isString(value) && (!nonEmpty || (value.length > 0))) ? value : def;
    };

    /**
     * Extracts a function from the passed object. If the property does not
     * exist, or is not a function, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some properties. May be undefined.
     *
     * @param {String} name
     *  The name of the property to be returned.
     *
     * @param {Any} [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified property, or if the property is
     *  not an object. May be any value (not only functions).
     *
     * @returns {Any}
     *  The value of the specified property, or the default value.
     */
    Util.getFunctionOption = function (options, name, def) {
        var value = Util.getOption(options, name);
        return _.isFunction(value) ? value : def;
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
     * Returns the current value of the specified CSS length attribute, in
     * pixels.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose length attribute will be returned. If this object
     *  is a jQuery collection, uses the first node it contains.
     *
     * @param {String} name
     *  The name of the CSS attribute to be returned.
     *
     * @returns {Number}
     *  The length value, converted to pixels, rounded to integer.
     */
    Util.getElementCssLength = function (node, name) {
        return Util.convertCssLength($(node).css(name), 'px', 1);
    };

    /**
     * Converts a CSS length value with measurement unit into a value of
     * another absolute CSS measurement unit.
     *
     * @param {String} valueAndUnit
     *  The value with its measurement unit to be converted, as string.
     *
     * @param {String} toUnit
     *  The target CSS measurement unit. See method Util.convertLength() for
     *  a list of supported units.
     *
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Util.convertCssLength = function (valueAndUnit, toUnit, precision) {
        var value = parseFloat(valueAndUnit);
        if (!_.isFinite(value)) {
            value = 0;
        }
        if (value && (valueAndUnit.length > 2)) {
            value = Util.convertLength(value, valueAndUnit.substr(-2), toUnit, precision);
        }
        return value;
    };

    /**
     * Converts a length value from an absolute CSS measurement unit into
     * another absolute CSS measurement unit.
     *
     * @param {Number} value
     *  The length value to convert, as floating-point number.
     *
     * @param {String} fromUnit
     *  The CSS measurement unit of the passed value, as string. Supported
     *  units are 'px' (pixels), 'pc' (picas), 'pt' (points), 'in' (inches),
     *  'cm' (centimeters), and 'mm' (millimeters).
     *
     * @param {String} toUnit
     *  The target measurement unit.
     *
     * @param {Number} [precision]
     *  If specified, the resulting length will be rounded to the nearest
     *  multiple of this value. Must be positive.
     *
     * @returns {Number}
     *  The length value converted to the target measurement unit, as
     *  floating-point number.
     */
    Util.convertLength = (function () {

        var // the conversion factors between pixels and other units
            FACTORS = {
                'px': 1,
                'pc': 1 / 9,
                'pt': 4 / 3,
                'in': 96,
                'cm': 96 / 2.54,
                'mm': 96 / 25.4
            };

        return function convertLength(value, fromUnit, toUnit, precision) {
            value *= (FACTORS[fromUnit] || 1) / (FACTORS[toUnit] || 1);
            return _.isFinite(precision) ? Util.round(value, precision) : value;
        };
    }());

    /**
     * Rounds the passed floating-point number to the nearest multiple of the
     * specified precision.
     *
     * @param {Number} value
     *  The floating-point number to be rounded.
     *
     * @param {Number} precision
     *  The precision used to round the number. The value 1 will round to
     *  integers (exactly like the Math.round() method). Must be positive. If
     *  less than 1, must be the inverse of an integer to prevent further
     *  internal rounding errors.
     *
     * @returns {Number}
     *  The rounded number.
     */
    Util.round = function (value, precision) {
        // Multiplication with small value may result in rounding errors (e.g.,
        // 227*0.1 results in 22.700000000000003), division by inverse value
        // works sometimes (e.g. 227/(1/0.1) results in 22.7), rounding the
        // inverse before division finally should work in all(?) cases, but
        // restricts valid precisions to inverses of integer numbers.
        value = Math.round((precision < 1) ? (value * Math.round(1 / precision)) : (value / precision));
        return (precision < 1) ? (value / Math.round(1 / precision)) : (value * precision);
    };

    /**
     * Sets a CSS formatting attribute with all browser-specific prefixes at
     * the passed element.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose CSS attribute will be changed. If this object is
     *  a jQuery collection, changes all contained nodes.
     *
     * @param {String} name
     *  The base name of the CSS attribute.
     *
     * @param {Any} value
     *  The new value of the CSS attribute.
     */
    Util.setCssAttributeWithPrefixes = (function () {

        var // the prefix for the current browser
            prefix = _.browser.WebKit ? '-webkit-' : _.browser.Firefox ? '-moz-' : _.browser.IE ? '-ms-' : '';

        return function (node, name, value) {
            var props = Util.makeSimpleObject(name, value);
            if (prefix) { props[prefix + name] = value; }
            $(node).css(props);
        };
    }());

    /**
     * Returns a new object containing a single property with the specified key
     * and value.
     *
     * @param {String} key
     *  The name of the property to be inserted into the returned object.
     *
     * @param value
     *  The value of the property to be inserted into the returned object.
     *
     * @returns {Object}
     *  A new object with a single property.
     */
    Util.makeSimpleObject = function (key, value) {
        var object = {};
        object[key] = value;
        return object;
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
