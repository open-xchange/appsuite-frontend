/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jonas Regier <jonas.regier@open-xchange.com>
 */
define('io.ox/core/tk/doc-converter/errormessages', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    var DOC_CONVERTER_ERROR_MESSAGES = {
        importError: gt('An error occurred while loading the document so it cannot be displayed.'),
        filterError: gt('An error occurred while converting the document so it cannot be displayed.'),
        passwordProtected: gt('This document is password protected and cannot be displayed.'),
        invalidFilename: gt('The PDF could not be exported. The file name contains invalid characters:')

    };

    var ConverterError = {

        isDocConverterError: function (docConverterResponse) {
            return docConverterResponse && docConverterResponse.origin && (docConverterResponse.origin === 'DocumentConverter');
        },

        getErrorTextFromResponse: function (docConverterResponse) {
            // return 'null' when it's not a docConverterResponse,
            // this behavior is utilized in different parts of the code
            if (!this.isDocConverterError(docConverterResponse)) { return null; }

            var cause = docConverterResponse && docConverterResponse.cause;
            var errorParams = docConverterResponse;
            return this.getErrorText(cause, errorParams);
        },

        getErrorText: function (cause, errorParams) {

            switch (cause) {
                case 'importError':
                    return DOC_CONVERTER_ERROR_MESSAGES.importError;

                case 'filterError':
                    return DOC_CONVERTER_ERROR_MESSAGES.filterError;

                case 'passwordProtected':
                    return DOC_CONVERTER_ERROR_MESSAGES.passwordProtected;

                case 'invalidFilename':
                    return DOC_CONVERTER_ERROR_MESSAGES.invalidFilename + ' "' + errorParams.invalidCharacters.join('') + '"';

                default:
                    // return 'null' when no or an unknown cause is provided,
                    // this behavior is utilized in different parts of the code
                    return null;
            }
        }

    };

    return ConverterError;
});
