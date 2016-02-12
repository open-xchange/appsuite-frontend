/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/errormessages', [
    'gettext!io.ox/presenter'
], function (gt) {

    'use strict';

    /**
     * Default error messages
     */
    var GENERAL_ERROR = gt('A general error occurred. Please try to reload the document. In case this does not help, please contact your system administrator.');
    var GENERAL_NETWORK_ERROR = gt('A general network error occurred. Please try to reload the document. In case this does not help, please contact your system administrator.');
    var GENERAL_FILE_STORAGE_ERROR = gt('A general file storage error occurred. Please try to reload the document. In case this does not help, please contact your system administrator.');

    /**
     * Drive error messages
     */
    var FILE_STORAGE = {
        '8': gt('The requested document does not exist.'),
        '17': gt('The presentation cannot be started. Please check the URL or contact the presenter.'),
        '57': gt('This document does not have any content.'),
        '58': gt('You do not have the appropriate permissions to read the document.')
    };
    FILE_STORAGE['18'] = FILE_STORAGE['28'] = FILE_STORAGE['47'] = FILE_STORAGE['17'];
    FILE_STORAGE['26'] = FILE_STORAGE['55'] = FILE_STORAGE['8'];
    FILE_STORAGE['62'] = FILE_STORAGE['58'];

    var IFO = {
        '300': FILE_STORAGE['8'],
        '400': FILE_STORAGE['58'],
        '438': FILE_STORAGE['8'],
        '500': FILE_STORAGE['57']
    };

    var DRIVE_ERROR_MESSAGES = _.extend(processErrorMessages(FILE_STORAGE, 'FILE_STORAGE'), processErrorMessages(IFO, 'IFO'));

    /**
     * Realtime error messages
     */
    var SVL = {
        '2': FILE_STORAGE['17'],
        '4': FILE_STORAGE['17'],
        '10': FILE_STORAGE['17'],
        '15': gt('A general network error occurred. Please contact your system administrator.'),
        '30': FILE_STORAGE['17']
    };
    SVL['16'] = SVL['15'];

    var RT_ERROR_MESSAGES = processErrorMessages(SVL, 'SVL');

    /**
     * Document conversion error messages
     */
    var DOC_CONVERTER_ERROR_MESSAGES = {
        'importError': gt('An error occurred loading the document so it cannot be displayed.'),
        'filterError': gt('An error occurred converting the document so it cannot be displayed.'),
        'passwordProtected': gt('This document is password protected and cannot be displayed.')
    };

    /**
     * Expands they key of the given error message object.
     *
     * @param {Object} messages
     *  The error message object to expand the keys for.
     *
     * @param {String} [prefix]
     *  The prefix String to add (optional).
     *
     * @returns {Object}
     *  The error message object with key expanded.
     */
    function processErrorMessages(messages, prefix) {
        var result = {};
        var key;

        for (var code in messages) {
            if (messages.hasOwnProperty(code)) {
                key = (_.isString(prefix) && prefix.length > 0) ? (prefix + '-') : '';
                key += _.pad(code, 4);
                result[key] = messages[code];
            }
        }

        return result;
    }

    /**
     * A central class that maps the file storage, realtime and document conversion error codes to user readable error messages.
     */
    var ErrorMessages = {

        /**
         * Creates a user readable error message from error objects provided
         * by Realtime, Drive and the Document Converter.
         * An unknown error code will be translated to a general error message.
         *
         * @param {Object} error
         *  The error object to get a user-interface error message for.
         *
         * @param {Object} [options]
         *  @param {String} options.category
         *      The error category to provide more specific messages for unknown error codes.
         *      Supported categories are 'rt', 'drive' and 'conversion'.
         *
         * @returns {String}
         *  A user readable error message.
         */
        getErrorMessage: function (error, options) {
            // the error code provided by Drive and Realtime
            var errorCode = _.isObject(error) && _.isString(error.error) && error.code || null;
            // the error cause provided by document conversion
            var errorCause = _.isObject(error) && error.cause || null;
            // the error category
            var category = options && options.category || null;
            // the resulting message
            var message = DRIVE_ERROR_MESSAGES[errorCode] || RT_ERROR_MESSAGES[errorCode] || DOC_CONVERTER_ERROR_MESSAGES[errorCause];

            if (!message) {
                switch (category) {
                    case 'conversion':
                        message = DOC_CONVERTER_ERROR_MESSAGES.importError;
                        break;

                    case 'drive':
                        message = GENERAL_FILE_STORAGE_ERROR;
                        break;

                    case 'rt':
                        message = GENERAL_NETWORK_ERROR;
                        break;

                    default:
                        message = GENERAL_ERROR;
                        break;
                }
            }

            return message;
        },

        /**
         * Creates a user readable error message from the provided Realtime error object.
         * An unknown error code will be translated to a general Realtime error message.
         *
         * @param {Object} error
         *  The error object to get a user-interface error message for.
         */
        getRealtimeErrorMessage: function (error) {
            return this.getErrorMessage(error, { category: 'rt' });
        },

        /**
         * Creates a user readable error message from the provided Drive error object.
         * An unknown error code will be translated to a general Drive error message.
         *
         * @param {Object} error
         *  The error object to get a user-interface error message for.
         */
        getDriveErrorMessage: function (error) {
            return this.getErrorMessage(error, { category: 'drive' });
        },

        /**
         * Creates a user readable error message from the provided document conversion error object.
         * An unknown error code will be translated to a document conversion import error message.
         *
         * @param {Object} error
         *  The error object to get a user-interface error message for.
         */
        getConversionErrorMessage: function (error) {
            return this.getErrorMessage(error, { category: 'conversion' });
        }
    };

    return ErrorMessages;

});
