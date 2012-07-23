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

define('io.ox/office/tk/apphelper', function () {

    'use strict';

    // static class AppHelper =================================================

    var AppHelper = {};

    // options object ---------------------------------------------------------

    /**
     * Extracts an attribute value from the passed object. If the attribute
     * does not exist, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute.
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    AppHelper.getOption = function (options, name, def) {
        return (_.isObject(options) && (name in options)) ? options[name] : def;
    };

    /**
     * Extracts a string attribute from the passed object. If the attribute
     * does not exist, or is not a string, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the string attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a string. May be any value (not only strings).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    AppHelper.getStringOption = function (options, name, def) {
        var value = AppHelper.getOption(options, name);
        return _.isString(value) ? value : def;
    };

    /**
     * Extracts a boolean attribute from the passed object. If the attribute
     * does not exist, or is not a boolean value, returns the specified default
     * value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the boolean attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a boolean value. May be any value (not only booleans).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    AppHelper.getBooleanOption = function (options, name, def) {
        var value = AppHelper.getOption(options, name);
        return _.isBoolean(value) ? value : def;
    };

    /**
     * Extracts an integer attribute from the passed object. If the attribute
     * does not exist, or is not a number, returns the specified default value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the integer attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not a number. May be any value (not only numbers).
     *
     * @param [min]
     *  If specified and a number, set a lower bound for the returned value. Is
     *  not used, if neither the attribute nor the passed default are numbers.
     *
     * @param [max]
     *  If specified and a number, set an upper bound for the returned value.
     *  Is not used, if neither the attribute nor the passed default are
     *  numbers.
     *
     * @returns
     *  The value of the specified attribute, or the default value, rounded
     *  down to an integer.
     */
    AppHelper.getIntegerOption = function (options, name, def, min, max) {
        var value = AppHelper.getOption(options, name);
        value = _.isNumber(value) ? value : def;
        if (_.isNumber(value)) {
            if (_.isNumber(min) && (value < min)) { value = min; }
            if (_.isNumber(max) && (value > max)) { value = max; }
            return Math.floor(value);
        }
        return value;
    };

    /**
     * Extracts an object attribute from the passed object. If the attribute
     * does not exist, or is not an object, returns the specified default
     * value.
     *
     * @param {Object|Undefined} options
     *  An object containing some attribute values. May be undefined.
     *
     * @param {String} name
     *  The name of the attribute to be returned.
     *
     * @param [def]
     *  The default value returned when the options parameter is not an object,
     *  or if it does not contain the specified attribute, or if the attribute
     *  is not an object. May be any value (not only objects).
     *
     * @returns
     *  The value of the specified attribute, or the default value.
     */
    AppHelper.getObjectOption = function (options, name, def) {
        var value = AppHelper.getOption(options, name);
        return _.isObject(value) ? value : def;
    };

    /**
     * Extends the passed object with the specified attributes.
     *
     * @param {Object} [options]
     *  An object containing some attribute values. May be undefined.
     *
     * @param {Object} [extensions]
     *  Another object whose attributes will be inserted into the former
     *  object. Will overwrite existing attributes.
     *
     * @returns {Object}
     *  An object containing the attributes of the objects passed to both
     *  parameters.
     */
    AppHelper.extendOptions = function (options, extensions) {
        return _(_.isObject(options) ? options : {}).extend(_.isObject(extensions) ? extensions : {});
    };

    // functional -------------------------------------------------------------

    /**
     * Wraps the passed function, protecting it from being called
     * recursively.
     *
     * @param {Function} func
     *  The original function that needs to be protected against recursive
     *  calls.
     *
     * @param {Object} [context]
     *  The calling context used to invoke the wapped function.
     *
     * @returns {Function}
     *  A wrapper function that initially calls the wrapped function and
     *  returns its value. When called recursively while running (directly
     *  or indirectly in the same call stack, or even asynchronously), it
     *  simply returns undefined instead of calling the wrapped function
     *  again.
     */
    AppHelper.makeNoRecursionGuard = function (func, context) {
        var running = false;
        return function () {
            if (!running) {
                try {
                    running = true;
                    return func.apply(context, arguments);
                } finally {
                    running = false;
                }
            }
        };
    };

    // document filters -------------------------------------------------------

    /**
     * Returns the URL passed to AJAX calls used to convert a document file
     * with the 'oxodocumentfilter' service.
     *
     * @param {Object} app
     *  The OX application object.
     *
     * @param {String} action
     *  The name of the action to be passed to the document filter.
     *
     * @param {String} [format]
     *  The file format name, used by specific actions.
     *
     * @returns {String}
     *  The filter URL.
     */
    AppHelper.getDocumentFilterUrl = function (app, action, format) {

        var // the descriptor of the file loaded by the application
            file = app.getFileDescriptor();

        return ox.apiRoot +
            '/oxodocumentfilter' +
            '?action=' + action +
            '&id=' + file.id +
            '&folder_id=' + file.folder_id +
            '&version=' + file.version +
            '&filename=' + file.filename +
            '&session=' + ox.session +
            '&uid=' + app.getUniqueId() +
            (format ? ('&filter_format=' + format) : '');
    };

    /**
     * Extracts the result data object from the passed response object of
     * an AJAX import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @return {Object|Undefined}
     *  The result data object, if existing, otherwise undefined.
     */
    AppHelper.extractAjaxResultData = function (response) {

        // check that the AJAX response is an object
        if (!_.isObject(response)) {
            return;
        }

        // convert JSON result string to object (may throw)
        if (_.isString(response.data)) {
            try {
                response.data = JSON.parse(response.data);
            } catch (ex) {
                return;
            }
        }

        // check that the data attribute is an object
        if (!_.isObject(response.data)) {
            return;
        }

        // response data object is valid, return it
        return response.data;
    };

    /**
     * Extracts a string attribute from the passed response object of an AJAX
     * import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @param {String} attribName
     *  The name of the attribute contained in the response data object.
     *
     * @return {String|Undefined}
     *  The attribute value, if existing, otherwise undefined.
     */
    AppHelper.extractAjaxStringResult = function (response, attribName) {

        var // the result data
            data = AppHelper.extractAjaxResultData(response);

        // check that the result data object contains a string attribute
        if (!_.isObject(data) || !_.isString(data[attribName])) {
            return;
        }

        // the result data object is valid, return the attribute value
        return data[attribName];
    };

    // exports ================================================================

    return AppHelper;

});
