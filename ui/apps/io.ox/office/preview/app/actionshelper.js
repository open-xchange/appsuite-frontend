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

define('io.ox/office/preview/app/actionshelper',
    ['io.ox/core/capabilities',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/preview/main',
     'io.ox/office/tk/utils',
     'io.ox/office/framework/app/extensionregistry',
     'gettext!io.ox/office/main'
    ], function (capabilities, ext, links, preview, Utils, ExtensionRegistry, gt) {

    'use strict';

    // private global functions ===============================================

    /**
     * Returns whether the file selection described in the passed callback data
     * object is viewable in the OX Viewer application.
     *
     * @param {Object} data
     *  The data passed to the 'requires' callback function of an action.
     *
     * @returns {Boolean}
     *  Whether the passed data describes exactly one file that is viewable in
     *  the OX Viewer application.
     */
    function isViewable(data) {
        return data.collection.has('one') && ExtensionRegistry.isViewable(data.context.filename);
    }

    /**
     * Launches a new OX Viewer application with the passed file descriptor.
     */
    function launchApplication(file) {
        ox.launch('io.ox/office/preview/main', { action: 'load', file: file });
    }

    // static class ActionsHelper =============================================

    /**
     * Defines static methods to create new actions and links to launch the OX
     * Viewer application from various other applications in OX AppSuite.
     */
    var ActionsHelper = {};

    // methods ----------------------------------------------------------------

    /**
     * Creates a new action that will show a single document in the OX Viewer
     * application.
     *
     * @param {String} actionId
     *  The identifier of the new action.
     *
     * @param {Function} fileDescriptorHandler
     *  A converter callback function that receives the Baton object and has to
     *  return the file descriptor passed to the launcher of OX Viewer.
     */
    ActionsHelper.createViewerAction = function (actionId, fileDescriptorHandler) {
        new links.Action(actionId, {
            requires: isViewable,
            action: function (baton) {
                launchApplication(fileDescriptorHandler(baton));
            }
        });
    };

    /**
     * Creates a new clickable link that launches OX Viewer for a specific
     * file.
     *
     * @param {String} pointId
     *  The identifier of the extension point containing the links.
     *
     * @param {String} actionId
     *  The identifier of the action launching the OX Viewer application.
     *
     * @param {Object} [options]
     *  Additional options passed to the constructor of the link.
     */
    ActionsHelper.createViewerLink = function (pointId, actionId, options) {
        ext.point(pointId).extend(new links.Link(Utils.extendOptions({
            id: 'office_view',
            index: 100,
            label: gt('View'),
            ref: actionId
        }, options)));
    };

    /**
     * Extends the specified action. It will be disabled, if the file passed to
     * the action is viewable in the OX Viewer application.
     *
     * @param {String} actionId
     *  The identifier of the action to be disabled for files viewable in the
     *  OX Viewer application.
     */
    ActionsHelper.disableActionForViewable = function (actionId) {
        new links.Action(actionId, {
            id: 'disable_action',
            index: 'first',
            requires: function (data) {
                if (isViewable(data)) {
                    data.stopPropagation();
                    return false;
                }
            }
        });
    };

    // static initialization ==================================================

    // register preview renderer for documents supported by OX Viewer
    if (capabilities.has('document_preview')) {
        (function () {

            function getWidth(options) {
                return Utils.getIntegerOption(options, 'width', 400);
            }

            function getUrl(file, options) {
                var url = file.dataURL || file.url;
                return url + '&format=preview_image&width=' + getWidth(options) + '&delivery=view&scaleType=contain';
            }

            function drawPreview(file, options) {

                var // the outer container node for the preview image
                    containerNode = this,
                    // the link node that will launch OX Viewer when clicked
                    linkNode = preview.protectedMethods.clickableLink(file, function (e) {
                        e.preventDefault();
                        if (file.module) {
                            file.source = 'task';
                            file.folder_id = file.folder;
                        } else if (file.data && file.data.mail) {
                            file.folder_id = file.data.mail.folder_id;
                            file.attached = file.data.id;
                            file.id = file.data.mail.id;
                            file.source = 'mail';
                        }
                        launchApplication(file);
                    }).appendTo(containerNode),
                    // the image node showing the first page of the document
                    imgNode = $('<img>', { alt: '' }).addClass('io-ox-clickable').appendTo(linkNode),
                    // a Deferred object waiting for the image
                    def = $.Deferred();

                containerNode.css({ minHeight: 20 }).busy();

                // prepare and load the preview image
                imgNode
                    .css({ width: getWidth(options), maxWidth: getWidth(options), visibility: 'hidden' })
                    .on('load', function () { def.resolve(); })
                    .on('error', function () { def.reject(); })
                    .attr('src', getUrl(file, options));

                // react on the result of the image
                def
                .always(function () { containerNode.css({ minHeight: '' }).idle(); })
                .done(function () { imgNode.css('visibility', ''); })
                .fail(function () { containerNode.empty(); });

                preview.protectedMethods.dragOutHandler(linkNode);
            }

            // create a new rendering engine for all supported documents
            preview.Renderer.point.extend(new preview.Engine({
                id: 'office',
                index: 10,
                supports: ExtensionRegistry.getViewableExtensions(), // TODO: mimetypes too?
                getUrl: getUrl,
                draw: drawPreview,
                omitDragoutAndClick: true
            }));

        }());
    }

    // exports ================================================================

    return ActionsHelper;

});
