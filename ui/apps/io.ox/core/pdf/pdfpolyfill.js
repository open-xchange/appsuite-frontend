/*
 * https://github.com/remy/polyfills
 *
 * dataset.js
 *
 * License: http://rem.mit-license.org
 */
define('io.ox/core/pdf/pdfpolyfill', function () {

    (function () {
        var forEach = [].forEach,
            regex = /^data-(.+)/,
            dashChar = /\-([a-z])/ig,
            el = document.createElement('div'),
            mutationSupported = false,
            match;

        function detectMutation() {
            mutationSupported = true;
            this.removeEventListener('DOMAttrModified', detectMutation, false);
        }

        function toCamelCase(s) {
            return s.replace(dashChar, function (m, l) { return l.toUpperCase(); });
        }

        function updateDataset() {
            var dataset = {};
            forEach.call(this.attributes, function (attr) {
                if (match = attr.name.match(regex)) {
                    dataset[toCamelCase(match[1])] = attr.value;
                }
            });
            return dataset;
        }

        // only add support if the browser doesn't support data-* natively
        if (el.dataset !== undefined) return;

        el.addEventListener('DOMAttrModified', detectMutation, false);
        el.setAttribute('foo', 'bar');

        function defineElementGetter(obj, prop, getter) {
            if (Object.defineProperty) {
                Object.defineProperty(obj, prop, {
                    get: getter
                });
            } else {
                obj.__defineGetter__(prop, getter);
            }
        }

        if (mutationSupported) {
            defineElementGetter(Element.prototype, 'dataset', function () {
                if (!this._datasetCache) {
                    this._datasetCache = updateDataset.call(this);
                }
                return this._datasetCache;
            });
        } else {
            defineElementGetter(Element.prototype, 'dataset', mutationSupported, updateDataset);
        }

        document.addEventListener('DOMAttrModified', function (event) {
            delete event.target._datasetCache;
        }, false);
    })();

    if (window.CanvasPixelArray && window.CanvasPixelArray.prototype && !window.CanvasPixelArray.prototype.set) {
        window.CanvasPixelArray.prototype.set = function () {
            return this;
        };
    }

    (function () {
        // override drawImage on desktop and mobile Safari
        if (_.device('safari')) {
            var origDrawImage = window.CanvasRenderingContext2D.prototype.drawImage;

            window.CanvasRenderingContext2D.prototype.drawImage = function () {
                try {
                    return origDrawImage.apply(this, arguments);
                } catch (e) {
                    console.info('Canvas drawImage() call FAILED', e);
                }
            };
        }
    })();

});
