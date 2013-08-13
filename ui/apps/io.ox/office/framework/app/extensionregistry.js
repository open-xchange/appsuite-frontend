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

    var // which file formats are editable (maps format identifier to Booleans)
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
                editable: !Utils.ANDROID,
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
                editable: true,
                extensions: {
                    xlsx: { format: 'ooxml' },
                    xlsm: { format: 'ooxml', macros: true },
                    xltx: { format: 'ooxml', template: true },
                    xltm: { format: 'ooxml', template: true, macros: true },
                    xlam: {                  macros: true }, // add-in
                    ods:  { format: 'odf',   macros: true },
                    ots:  { format: 'odf',   template: true, macros: true },
                    xls:  { format: 'odf',   macros: true, convert: true },
                    xlt:  { format: 'odf',   template: true, macros: true, convert: true },
                    xla:  {                  macros: true }, // add-in
                    xlsb: { format: 'odf',   macros: true, convert: true }
                }
            },

            presentation: {
                module: 'io.ox/office/presentation',
                requires: 'presentation',
                editable: true,
                extensions: {
                    pptx: { format: 'ooxml' },
                    pptm: { format: 'ooxml', macros: true },
                    potx: { format: 'ooxml', template: true },
                    potm: { format: 'ooxml', template: true, macros: true },
                    ppsx: {}, // slide show
                    ppsm: {                  macros: true }, // slide show
                    ppam: {                  macros: true }, // add-in
                    odp:  { format: 'odf',   macros: true },
                    otp:  { format: 'odf',   template: true, macros: true },
                    ppt:  { format: 'odf',   macros: true, convert: true },
                    pot:  { format: 'odf',   template: true, macros: true, convert: true },
                    pps:  {                  macros: true }, // slide show
                    ppa:  {                  macros: true } // add-in
                }
            },

            preview: {
                extensions: {
                    pdf:  {},
                    odg:  { format: 'odf', macros: true }, // drawing
                    otg:  { format: 'odf', template: true, macros: true }, // drawing
                    odi:  { format: 'odf' }, // image
                    oti:  { format: 'odf', template: true }, // image
                    odc:  { format: 'odf' }, // chart
                    otc:  { format: 'odf', template: true }, // chart
                    odf:  { format: 'odf' }, // formula
                    otf:  { format: 'odf', template: true }, // formula
                    odm:  { format: 'odf' } // global text document
                }
            }
        },

        // all application configurations, mapped by application identifier
        applicationMap = {},

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
     * Returns whether the passed module name specifies an OX Documents
     * application that can edit documents on the current platform.
     *
     * @param {String} editModule
     *  The module name of the application.
     *
     * @returns {Boolean}
     *  Whether the application is able to edit documents.
     */
    ExtensionRegistry.supportsEditMode = function (editModule) {
        return Utils.getBooleanOption(applicationMap[editModule], 'editable', false);
    };

    /**
     * Returns the lower-case extension of the passed file name.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @returns {String}
     *  The lower-case extension of the passed file name.
     */
    ExtensionRegistry.getExtension = function (fileName) {
        var index = String(fileName || '').lastIndexOf('.');
        return (index >= 0) ? fileName.substring(index + 1).toLowerCase() : '';
    };

    /**
     * Returns the base name of the passed file name, without file extension.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @returns {String}
     *  The base name of the passed file name. Character case will be
     *  preserved.
     */
    ExtensionRegistry.getBaseName = function (fileName) {
        var index = String(fileName || '').lastIndexOf('.');
        return (index > 0) ? fileName.substring(0, index) : index;
    };

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

        var // the lower-case extension of the passed file name
            extension = ExtensionRegistry.getExtension(fileName),
            // the extension settings object
            extensionSettings = (extension in fileExtensionMap) ? fileExtensionMap[extension] : null,
            // the module name of the edit application for the extension
            module = Utils.getStringOption(extensionSettings, 'module');

        // passed module name must match if specified
        return (_.isString(editModule) && (editModule !== module)) ? null : extensionSettings;
    };

    /**
     * Returns all extensions that can be viewed with OX Preview as array.
     *
     * @returns {Array}
     *  All extensions supported by OX Preview.
     */
    ExtensionRegistry.getViewableExtensions = function () {
        var extensions = [];
        _(fileExtensionMap).each(function (settings, extension) {
            if (settings.viewable) {
                extensions.push(extension);
            }
        });
        return extensions;
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

    /**
     * Returns whether the file with the passed name contains the 'internal
     * error' extension suffix.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @returns {Boolean}
     *  Whether the file with the passed name contains the 'internal error'
     *  extension suffix.
     */
    ExtensionRegistry.isError = function (fileName) {
        var extension = ExtensionRegistry.getExtension(fileName);
        return extension.indexOf(INTERNAL_ERROR_SUFFIX, extension.length - INTERNAL_ERROR_SUFFIX.length) >= 0;
    };

    /**
     * Extends and returns the passed file name with the 'internal error'
     * extension suffix. If the file name already contains this suffix, it will
     * be returned as is.
     *
     * @param {String} fileName
     *  The file name (case-insensitive).
     *
     * @returns {String}
     *  The passed passed file name with the 'internal error' extension suffix.
     */
    ExtensionRegistry.createErrorFileName = function (fileName) {
        return ExtensionRegistry.isError(fileName) ? fileName : (fileName + INTERNAL_ERROR_SUFFIX);
    };

    // static initialization ==================================================

    // process the configuration of all modules
    _(FILE_EXTENSION_CONFIGURATION).each(function (moduleConfiguration, documentType) {

        var // the capability required to edit the file
            editable = Utils.getBooleanOption(moduleConfiguration, 'editable', false),
            // the capability required to edit the file
            requires = Utils.getStringOption(moduleConfiguration, 'requires', null),
            // the module name of the edit application
            module = Utils.getStringOption(moduleConfiguration, 'module', null),
            // whether the edit module is available at all
            editAvailable = editable && _.isString(requires) && Capabilities.has(requires) && _.isString(module);

        // application configuration antry
        applicationMap[documentType] = { editable: editAvailable };

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
