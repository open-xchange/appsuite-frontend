/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/types/documenttype', [
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/core/viewer/types/basetype',
    'io.ox/core/viewer/io',
    'io.ox/core/viewer/util'
], function (PDFDocument, PDFView, BaseType, IO, Util) {
    /**
     * The document file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function createSlide(model, modelIndex);
     *    function loadSlide(slideElement);
     * }
     *
     */
    var documentType = {
        /**
         * Creates a document slide.
         *
         * @param {Object} model
         *  An OX Viewer Model object.
         *
         * @param {Number} modelIndex
         *  Index of this model object in the collection.
         *
         * @returns {jQuery} slide
         *  the slide jQuery element.
         */
        createSlide: function (model, modelIndex) {
            //console.warn('DocumentType.createSlide()');
            var slide = this.createSlideNode(),
                pageContainer = $('<div class="document-container">'),
                slidesCount = model.collection.length;
            slide.append(pageContainer, this.createCaption(modelIndex, slidesCount));
            return slide;
        },

        /**
         * "Loads" a document slide.
         *
         *
         * @param {jQuery} slideElement
         *  the slide jQuery element to be loaded.
         */
        loadSlide: function (model, slideElement) {
            // disable loading document temporarily
            // ignore slide duplicates and already loaded documents
            if (slideElement.hasClass('swiper-slide-duplicate') || slideElement.find('.document-page').length > 0) { return; }
            var // the file descriptor object
                file = model.get('origData'),
                // current Appsuite App
                currentAppUniqueID = ox.ui.App.getCurrentApp().get('uniqueID'),
                // generate document converter URL of the document
                documentUrl = getServerModuleUrl(IO.CONVERTER_MODULE_NAME, {
                    action: 'getdocument',
                    documentformat: 'pdf',
                    priority: 'instant',
                    mimetype: file.file_mimetype ? encodeURIComponent(file.file_mimetype) : '',
                    nocache: _.uniqueId() // needed to trick the browser cache (is not evaluated by the backend)
                }),
                // fire up PDF.JS with the document URL and get its loading promise
                pageContainer = slideElement.find('.document-container'),
                pdfDocument = null,
                pdfView = null;

            /**
             * Creates and returns the URL of a server request.
             *
             * @param {String} module
             *  The name of the server module.
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
            function getServerModuleUrl (module, params, options) {
                // return nothing if no file is present
                if (!ox.session || !file) {
                    return;
                }

                var // the parameters for the file currently loaded
                    fileParams = getFileParameters(Util.extendOptions(options, { encodeUrl: true }));

                // add default parameters (session and UID), and file parameters
                params = _.extend({ session: ox.session, uid: currentAppUniqueID }, fileParams, params);

                // build and return the resulting URL
                return ox.apiRoot + '/' + module + '?' + _.map(params, function (value, name) { return name + '=' + value; }).join('&');
            }

            /**
             * Returns an object with attributes describing the file currently
             * opened by this application.
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
            function getFileParameters (options) {

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
            }

            /**
             * Calculates document page numbers to render depending on visilbility of the pages
             * in the viewport (window).
             *
             * @returns {Array} pagesToRender
             *  an array of page numbers which should be rendered.
             */
            function getPagesToRender() {
                //console.warn('DocumentType.getPagesToRender()', pageContainer);
                var pages = pageContainer.find('.document-page'),
                    pagesToRender = [];
                // Whether the page element is visible in the viewport, wholly or partially.
                function isPageVisible(pageElement) {
                    var pageRect = pageElement.getBoundingClientRect();
                    function isInWindow(verticalPosition) {
                        return verticalPosition >= 0 && verticalPosition <= window.innerHeight;
                    }
                    return isInWindow(pageRect.top) ||
                        isInWindow(pageRect.bottom) ||
                        (pageRect.top < 0 && pageRect.bottom > window.innerHeight);
                }
                // return the visible pages
                _.each(pages, function (element, index) {
                    if (!isPageVisible(element)) { return; }
                    pagesToRender.push(index + 1);
                });
                return pagesToRender;
            }

            /**
             * Returns the pageNode with the given pageNumber.
             *
             * @param pageNumber
             *  The 1-based number of the page node to return
             *
             * @returns {jquery.Node} pageNode
             *  The jquery page node for the requested page number.
             */
            function getPageNode(pageNumber) {
                return (_.isNumber(pageNumber) && (pageNumber >= 1)) ? pageContainer.children().eq(pageNumber - 1) : null;
            }

            // create the PDF document model
            pdfDocument = new PDFDocument(documentUrl);

            // wait for PDF document to finish loading
            $.when(pdfDocument.getLoadPromise()).then(function (pageCount) {
                if (pageCount > 0) {
                    // create the PDF view after successful loading;
                    // the initial zoom factor is already set to 1.0
                    pdfView = new PDFView(pdfDocument);

                    //console.warn('DocumentType promises finished.');
                    _.times(pageCount, function (index) {
                        var jqPage = $('<div class="document-page">'),
                            pageSize = pdfDocument.getOriginalPageSize(index + 1);

                        pageContainer.append(jqPage.attr(pageSize).css(pageSize));
                    });

                    // set callbacks at PDFView to start rendering
                    pdfView.setRenderCallbacks(getPagesToRender, getPageNode);
                }
            });
        }
    };

    // returns an object which inherits BaseType
    return _.extend(Object.create(BaseType), documentType);

});
