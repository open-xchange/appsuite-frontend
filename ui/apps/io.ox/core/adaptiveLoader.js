/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/adaptiveLoader', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (ext, caps, settings) {

    'use strict';

    var api;
    if (localStorage && caps.has('lab:adaptiveLoading')) {
        var capString = _(ox.serverConfig.capabilities).pluck('id').sort().join(','), language = settings.get('language'), theme = settings.get('theme');
        api = {
            log: function () {
                if (api.debug || true) {
                    console.log.apply(console, arguments);
                }
            },
            listen: function (chunkName) {
                api.log('listen', chunkName);
                if (!api.cache) {
                    api.init();
                }
                api.currentChunk = chunkName;
                api.modules = api.cache[chunkName] || [];
            },
            startAndLoad: function (chunkName) {
                api.log('startAndLoad', chunkName);
                if (!api.cache) {
                    api.init();
                }
                api.listen(chunkName);
                if (api.cache[chunkName]) {
                    return require(api.cache[chunkName]);
                }
            },
            startAndEnhance: function (chunkName, requirements) {
                api.log('startAndEnhance', chunkName, requirements);
                if (!api.cache) {
                    api.init();
                }
                api.listen(chunkName);
                if (api.cache[chunkName]) {
                    _(api.cache[chunkName]).each(function (m) {
                        if (!_(requirements).contains(m)) {
                            requirements.push(m);
                        }
                    });
                }
                api.log('enhanced', requirements);
                return requirements;
            },

            stop: function () {
                api.log('stop', api.currentChunk);
                if (!api.cache) {
                    api.init();
                }
                if (!api.currentChunk) {
                    return;
                }
                api.cache[api.currentChunk] = _.uniq(api.modules);
                api.log(api.cacheKey, api.cache);
                localStorage.setItem(api.cacheKey, JSON.stringify(api.cache));
                delete api.modules;
                delete api.currentChunk;
            },

            record: function (chunkName) {
                api.log('record', chunkName);
                if (!api.cache) {
                    api.init();
                }
                setTimeout(function () {
                    if (api.currentChunk === chunkName) {
                        api.stop();
                    }
                });
                return api.listen(chunkName);
            },
            init: function () {
                api.log('init');
                api.cacheKey = 'ox-adaptiveload-' + ox.base + '[' + (ox.user || 'anon') + '][' + capString + ']' + '[' + language + ']' + '[' + theme + ']';
                api.cache = JSON.parse(localStorage.getItem(api.cacheKey));
                if (!api.cache) {
                    api.cache = {};
                }
                api.log('cache', api.cache);
                $(window).on('require:require', function (event, module) {
                    if (api.modules) {
                        api.modules.push(module.replace(/\.js$/, ''));
                    }
                    if (!api.dirty) {
                        api.dirty = true;
                        setTimeout(function () {
                            if (api.currentChunk) {
                                api.cache[api.currentChunk] = _.uniq(api.modules);
                                api.log(api.cacheKey, api.cache);
                                localStorage.setItem(api.cacheKey, JSON.stringify(api.cache));
                            }
                            api.dirty = false;
                        }, 3000);
                    }
                });
            }
        };
    } else {
        api = {
            listen: $.noop,
            startAndLoad: function () {
                return $.Deferred().resolve();
            },
            startAndEnhance: function (chunkName, requirements) {
                return requirements;
            },
            stop: $.noop,
            record: $.noop,
            init: $.noop
        };
    }
    return api;
});
