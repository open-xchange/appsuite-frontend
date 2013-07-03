/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/framework/app/extensionregistry',
    ['io.ox/core/capabilities',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/config'
    ], function (Capabilities, Utils, Config) {

    'use strict';

    var // which file formats are editable
        EDITABLE_FILE_FORMATS = {
            ooxml: true,
            odf: Utils.getBooleanOption(Config.get(), 'odfsupport', false)
        },

        // the extension suffix for files with an internal error
        INTERNAL_ERROR_SUFFIX = '_ox',

        // file extension configuration (all extensions are viewable by OX Preview)
        FILE_EXTENSION_CONFIGURATION = {

            text: {
                module: 'io.ox/office/text',
                requires: 'text',
                extensions: {
                    docx: { format: 'ooxml' },
                    docm: { format: 'ooxml', macros: true },
                    dotx: { format: 'ooxml', template: true },
                    dotm: { format: 'ooxml', template: true, macros: true },
                    odt:  { format: 'odf',   macros: true },
                    ott:  { format: 'odf',   template: true, macros: true },
                    doc:  { format: 'odf',   macros: true, convert: true },
                    dot:  { format: 'odf',   template: true, macros: true, convert: true },
                    rtf:  { format: 'odf',   convert: true }
                }
            },

            spreadsheet: {
                module: 'io.ox/office/spreadsheet',
                requires: 'spreadsheet',
                extensions: {
                    xlsx: { format: 'ooxml' },
                    xlsm: { format: 'ooxml',  macros: true },
                    xltx: { format: 'ooxml',  template: true },
                    xltm: { format: 'ooxml',  template: true, macros: true },
                    ods:  { format: 'odf',    macros: true },
                    ots:  { format: 'odf',    template: true, macros: true },
                    xls:  { format: 'odf',    macros: true, convert: true },
                    xlt:  { format: 'odf',    template: true, macros: true, convert: true },
                    xlsb: { format: 'odf',    macros: true, convert: true }
                }
            },

            presentation: {
                module: 'io.ox/office/presentation',
                requires: 'presentation',
                extension: {
                    pptx: { format: 'ooxml' },
                    pptm: { format: 'ooxml', macros: true },
                    potx: { format: 'ooxml', template: true },
                    potm: { format: 'ooxml', template: true, macros: true },
                    odp:  { format: 'odf',   macros: true },
                    otp:  { format: 'odf',   template: true, macros: true },
                    ppt:  { format: 'odf',   macros: true, convert: true },
                    pot:  { format: 'odf',   template: true, macros: true, convert: true }
                }
            },

            drawing: {
                extensions: {
                    odg:  { format: 'odf', macros: true },
                    otg:  { format: 'odf', template: true, macros: true }
                }
            },

            preview: {
                extensions: {
                    pdf:  {}
                }
            }
        },

        // all configurations, mapped by lower-case extension
        fileExtensionMap = {},

        // whether OX Preview is available at all
        previewAvailable = Capabilities.has('document_preview');

    // static class ExtensionRegistry =========================================

    /**
     * Configuration settings for all supported file extensions of all OX
     * Documents application.
     */
    var ExtensionRegistry = {};

    // methods ----------------------------------------------------------------

    /**
     * Returns the configuration settings of the file extension contained by
     * the passed file name.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Object|Null}
     *  The file extension settings; or null, if the extension is not known.
     */
    ExtensionRegistry.getExtensionSettings = function (fileName, editModule) {

        var // position of the last period character
            index = _.isString(fileName) ? fileName.lastIndexOf('.') : -1,
            // the lower-case extension of the passed file name
            extension = (index >= 0) ? fileName.substring(index + 1).toLowerCase() : '',
            // the extension settings object
            extensionSettings = (extension in fileExtensionMap) ? fileExtensionMap[extension] : null,
            // the module name of the edit application for the extension
            module = Utils.getStringOption(extensionSettings, 'module');

        // passed module name must match if specified
        return (_.isString(editModule) && (editModule !== module)) ? null : extensionSettings;
    };

    /**
     * Returns whether the file with the passed name is viewable by the OX
     * Preview application.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @returns {Boolean}
     *  Whether the specified file is viewable by the OX Preview application.
     */
    ExtensionRegistry.isViewable = function (fileName) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName);
        return Utils.getBooleanOption(extensionSettings, 'viewable', false);
    };

    /**
     * Returns whether the file with the passed name is editable by any of the
     * OX Documents edit applications.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file is editable by one of the OX Documents edit
     *  applications.
     */
    ExtensionRegistry.isEditable = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getBooleanOption(extensionSettings, 'editable', false);
    };

    /**
     * Returns whether the file with the passed name is editable natively with
     * any of the OX Documents edit applications, according to the file format.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file is editable natively with one of the OX
     *  Documents edit applications.
     */
    ExtensionRegistry.isNative = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getBooleanOption(extensionSettings, 'editable', false) && Utils.getBooleanOption(extensionSettings, 'native', false);
    };

    /**
     * Returns whether the file with the passed name is editable with any of
     * the OX Documents edit applications by conversion to a natively supported
     * file format, according to the file format.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file is editable with one of the OX Documents
     *  edit applications by conversion to a native file format.
     */
    ExtensionRegistry.isConvertible = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getBooleanOption(extensionSettings, 'editable', false) && !Utils.getBooleanOption(extensionSettings, 'native', false);
    };

    /**
     * Returns whether the file with the passed name is a file that will be
     * edited in the OpenDocument file format (either natively, or by
     * conversion from a file format not supported natively).
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file will be edited in the OpenDocument file
     *  format.
     */
    ExtensionRegistry.isOpenDocument = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getStringOption(extensionSettings, 'format') === 'odf';
    };

    /**
     * Returns whether the file with the passed name is a template file.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file is a document template file.
     */
    ExtensionRegistry.isTemplate = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getBooleanOption(extensionSettings, 'template', false);
    };

    /**
     * Returns whether the file with the passed name may contain macro scripts.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @param {String} [editModule]
     *  If specified, must match the module name of the edit application
     *  registered for the extension of the passed file name. If omitted, the
     *  edit application module name for the extension will be ignored.
     *
     * @returns {Boolean}
     *  Whether the specified file may contain macro scripts.
     */
    ExtensionRegistry.isScriptable = function (fileName, editModule) {
        var extensionSettings = ExtensionRegistry.getExtensionSettings(fileName, editModule);
        return Utils.getBooleanOption(extensionSettings, 'macros', false);
    };

    // static initialization ==================================================

    // process the configuration of all modules
    _(FILE_EXTENSION_CONFIGURATION).each(function (moduleConfiguration, documentType) {

        var // the capability required to edit the file
            requires = Utils.getStringOption(moduleConfiguration, 'requires', null),
            // the module name of the edit application
            module = Utils.getStringOption(moduleConfiguration, 'module', null),
            // whether the edit module is available at all
            editAvailable = _.isString(requires) && Capabilities.has(requires) && _.isString(module);

        // process all extensions registered for the module
        _(moduleConfiguration.extensions).each(function (extensionSettings, extension) {

            var // the file format of files with the current extension
                format = Utils.getStringOption(extensionSettings, 'format', ''),
                // whether the file extension is supported natively
                native = !Utils.getBooleanOption(extensionSettings, 'convert', false);

            if (extension in fileExtensionMap) {
                Utils.warn('ExtensionRegistry(): extension "' + extension + '" already registered');
            }

            // initialize all properties of the current extension
            fileExtensionMap[extension] = _({
                type: documentType,
                viewable: previewAvailable,
                editable: editAvailable && Utils.getBooleanOption(EDITABLE_FILE_FORMATS, format, false),
                module: module,
                native: native
            }).extend(extensionSettings);

            // initialize all properties of the current extension with internal error
            // suffix (native only) - these files are not viewable in OX Preview
            if (native) {
                fileExtensionMap[extension + INTERNAL_ERROR_SUFFIX] = _.chain(fileExtensionMap[extension]).clone().extend({ viewable: false }).value();
            }
        });
    });

    // exports ================================================================

    return ExtensionRegistry;

});
