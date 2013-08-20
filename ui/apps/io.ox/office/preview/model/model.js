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

define('io.ox/office/preview/model/model',
    ['io.ox/office/tk/utils',
     'io.ox/office/framework/model/basemodel'
    ], function (Utils, BaseModel) {

    'use strict';

    var // the global cache size
        CACHE_SIZE = Modernizr.touch ? 15 : 100;

    // class Cache ============================================================

    /**
     * Caches arbitrary elements and maintains a maximum cache size. Creates
     * new elements on demand via a callback function.
     *
     * @param {Function} createElementHandler
     *  A callback function that will be called when the cache does not contain
     *  the requested element. Receives the application instance as first
     *  parameter, and the element key as second parameter. Must return the
     *  element that will be stored in this cache.
     *
     * @param {Function} [destroyElementHandler]
     *  A callback function that will be called before a cached element will be
     *  removed from the cache. Receives the application instance as first
     *  parameter, the cached element as second parameter, and its key as third
     *  parameter.
     *
     * @param {Object} [context]
     *  The context used to call the callback functions.
     */
    function Cache(createElementHandler, destroyElementHandler, context) {

        var // cached elements, mapped by key
            elements = {},

            // last used keys, in order of access
            lastKeys = [];

        // methods ------------------------------------------------------------

        /**
         * Returns the element stored under the specified key. If the element
         * does not exist yet, calls the 'createElementHandler' callback
         * function passed to the constructor, and stores its result in this
         * cache.
         *
         * @param {PreviewApplication} app
         *  The application instance that requests the element.
         *
         * @param {String|Number|Object} key
         *  The key of the requested element.
         *
         * @param {Any} [options]
         *  Additional options that will be passed as second parameter to the
         *  'createElementHandler' callback function.
         *
         * @returns {Any}
         *  The element that has been already cached, or that has been created
         *  by the 'createElementHandler' callback function.
         */
        this.getElement = function (app, key, options) {

            var // make the key globally unique according to application
                uniqueKey = { id: app.get('uniqueID'), key: key },
                // convert unique key to JSON representation
                jsonKey = JSON.stringify(uniqueKey);

            // execute callback handler for missing elements
            if (!(jsonKey in elements)) {
                elements[jsonKey] = createElementHandler.call(context, app, key, options);
            }

            // update array of last used keys
            lastKeys = _(lastKeys).without(jsonKey);
            lastKeys.push(jsonKey);
            if (lastKeys.length > CACHE_SIZE) {
                var lastKey = lastKeys.shift();
                if (_.isFunction(destroyElementHandler)) {
                    destroyElementHandler.call(context, app, elements[lastKey], JSON.parse(lastKey).key);
                }
                delete elements[lastKey];
            }

            return elements[jsonKey];
        };

    } // class Cache

    // cache singletons -------------------------------------------------------

    /**
     * Creates an <img> element containing the specified page.
     *
     * @param {Object} key
     *  The cache key containing the page number, image format, optional target
     *  width, and optional target height of the image.
     *
     * @param {Object} options
     *  The options map passed to the cache, containing the priority.
     *
     * @returns {jQuery.Promise}
     *  The Promise of a Deferred object that will be resolved with the <img>
     *  element as jQuery object.
     */
    function createImageNode(app, key, options) {

        var // additional parameters inserted into the request URL of the image
            urlParams = {
                convert_format: 'html',
                convert_action: 'getpage',
                page_number: key.page,
                target_format: key.format,
                convert_priority: Utils.getStringOption(options, 'priority', 'medium'),
                returntype: 'file'
            };

        // add width and height, if specified in the cache key
        if ('width' in key) { urlParams.target_width = key.width; }
        if ('height' in key) { urlParams.target_height = key.height; }

        // request the image and create the <img> element (wrapped in a Deferred object)
        return app.createImageNode(app.getPreviewModuleUrl(urlParams), { timeout: 60000 });
    }

    /**
     * Destroys the image node contained in the passed Promise. Used as
     * callback function for the image cache.
     *
     * @param {jQuery.Promise} promise
     *  The Promise that will be or has been resolved with an image node.
     */
    function destroyImageNode(app, promise) {
        promise.done(function (imgNode) { app.destroyImageNodes(imgNode); });
    }

    /**
     * Loads the SVG mark-up of the specified page.
     *
     * @param {Number} page
     *  The one-based page number.
     *
     * @param {Object} [options]
     *  A map with options controlling the behavior of this method. The
     *  following options are supported:
     *  @param {String} [options.priority='medium']
     *      Specifies with which priority the server will handle the image
     *      request. Must be one of the strings 'low', 'medium' (default),
     *      or 'high'.
     *
     * @returns {jQuery.Promise}
     *  The Promise of a Deferred object that will be resolved with the SVG
     *  mark-up.
     */
    function loadSvgMarkup(app, page, options) {
        return app.sendPreviewRequest({
            params: {
                convert_format: 'html',
                convert_action: 'getpage',
                page_number: page,
                convert_priority: Utils.getStringOption(options, 'priority', 'medium')
            },
            resultFilter: function (data) {
                // extract SVG mark-up, returning undefined will reject the entire request
                return Utils.getStringOption(data, 'HTMLPages');
            }
        })
        .promise();
    }

    var // the page cache containing Deferred objects with <img> elements
        staticImageCache = new Cache(createImageNode, destroyImageNode),

        // the page cache containing Deferred objects with SVG mark-up as strings
        staticSvgMarkupCache = new Cache(loadSvgMarkup);

    // class PreviewModel =====================================================

    /**
     * The model of the Preview application. Stores and provides the HTML
     * representation of the document pages.
     *
     * @constructor
     *
     * @extends BaseModel
     */
    function PreviewModel(app) {

        var // the total page count of the document
            pageCount = 0;

        // base constructor ---------------------------------------------------

        BaseModel.call(this, app);

        // methods ------------------------------------------------------------

        /**
         * Sets the number of pages contained in the document.
         *
         * @param {Number} count
         *  The number of pages in the document currently previewed.
         */
        this.setPageCount = function (count) {
            pageCount = Math.min(10000, count);
        };

        /**
         * Returns the number of pages contained in the document.
         *
         * @returns {Number}
         *  The number of pages in the document currently previewed.
         */
        this.getPageCount = function () {
            return pageCount;
        };

        /**
         * Returns the Promise of a Deferred object that will be resolved with
         * the <img> element containing the image representation of the
         * specified document page.
         *
         * @param {Number} page
         *  The one-based index of the requested page.
         *
         * @param {Object} [options]
         *  A map with options controlling the behavior of this method. The
         *  following options are supported:
         *  @param {String} [options.format='png']
         *      The image format. Supported values are 'jpg', 'png', and 'svg'.
         *  @param {Number} [options.width]
         *      If specified, the requested width of the image, in pixels. If
         *      the option 'options.height' is specified too, the resulting
         *      width may be less than this value.
         *  @param {Number} [options.height]
         *      If specified, the requested height of the image, in pixels. If
         *      the option 'options.width' is specified too, the resulting
         *      height may be less than this value.
         *  @param {String} [options.priority='medium']
         *      Specifies with which priority the server will handle the image
         *      request. Must be one of the strings 'low', 'medium' (default),
         *      or 'high'.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  completed <img> element representing the the specified page (as
         *  jQuery object), or rejected on error.
         */
        this.loadPageAsImage = function (page, options) {

            var format = Utils.getStringOption(options, 'format', 'png'),
                width = Utils.getIntegerOption(options, 'width', 0, 0),
                height = Utils.getIntegerOption(options, 'height', 0, 0),
                priority = Utils.getStringOption(options, 'priority', 'medium'),
                cacheKey = { page: page, format: format },
                cacheOptions = { priority: priority };

            if (width > 0) { cacheKey.width = width; }
            if (height > 0) { cacheKey.height = height; }

            return staticImageCache.getElement(app, cacheKey, cacheOptions).then(function (imgNode) {
                // clone the cached image on every access
                return app.createImageNode(imgNode.attr('src'), { timeout: 15000 });
            });
        };

        /**
         * Returns the Promise of a Deferred object that will be resolved with
         * the SVG mark-up of the specified page.
         *
         * @param {Number} page
         *  The one-based index of the requested page.
         *
         * @param {String} priority
         *  Specifies with which priority the server will handle the image
         *  request. Must be one of the strings 'low', 'medium', or 'high'.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  SVG mark-up of the specified page as string, or rejected on error.
         */
        this.loadPageAsSvgMarkup = function (page, priority) {
            return staticSvgMarkupCache.getElement(app, page, { priority: priority });
        };

    } // class PreviewModel

    // exports ================================================================

    // derive this class from class BaseModel
    return BaseModel.extend({ constructor: PreviewModel });

});
