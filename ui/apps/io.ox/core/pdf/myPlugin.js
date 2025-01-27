/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

console.error('!!!!!!!! esmodule plugin loaded');

// myPlugin.js
// define([], function() {
//     return {
//         load: function(name, req, onload, config) {
//             console.error('!!!!!!!!esmodule IN LOAD', name, req, onload, config);
//             // Simulate an asynchronous operation
//             setTimeout(function() {
//                 // Here you can load resources or perform operations
//                 onload("Loaded: " + name);
//             }, 1000);
//         }
//     };
// });


// define([], function() {
//     return {
//         load: function(name, req, onload, config) {
//             var modulePath = req.toUrl(name + '.js');
//             console.log(ox.abs + ox.root + '/' + modulePath)
//             import(ox.abs + ox.root + '/' + modulePath)
//                 .then(function(module) {
//                     return onload(module.default || module);
//                 })
//                 .catch(function(err) {
//                     onload.error(err);
//                 });
//         }
//     };
// });

define([], function () {
    return {
        load: function (name, req, onload) {
        // load: function(name, req, onload, config) {
            var modulePath = req.toUrl(name + '.mjs');
            var loadPath = ox.abs + ox.root + '/' + modulePath;
            console.log(ox.abs + ox.root + '/' + modulePath);
            // eslint-disable-next-line
            var dynamicImport = new Function('return import("' + loadPath + '");');
            dynamicImport(ox.abs + ox.root + '/' + modulePath)
                .then(function (module) {
                    return onload(module.default || module);
                })
                .catch(function (err) {
                    onload.error(err);
                });
        }
    };
});

// define([], function() {
// //define('io.ox/core/esmwrapper', [], function () {
//     'use strict';

//     return {
//         load: function (name, req, onload, config) {
//             console.error('!!!!!!!!esmodule IN LOAD', name, req, onload, config);
//             var script = document.createElement('script');
//             // script.type = 'module';
//             script.src = name;  // path to the ES module

//             script.onload = function () {
//                 // onload();
//                 // console.error('!!!!!!!!esmodule onload', name);
//                 // return 'jo';

//                 // Once the script is loaded, we can access the module's exports
//                 // Note: You need to ensure that the module exposes its exports globally
//                 var moduleName = name.split('/').pop().replace('.js', ''); // Get the module name
//                 var moduleExports = window[moduleName]; // Access the module's exports from the global scope
//                 onload(moduleExports); // Call onload with the module's exports
//             };
//             script.onerror = function (err) {
//                 onload.error(err);
//             };
//             document.head.appendChild(script);

//             //
//             // import(name).then(module => {
//             //   onload(module);
//             // }).catch(err => {
//             //   onload.error(err);
//             // });
//         }
//     };
// });

// define corresponding plugin now (not earlier)
// (function () {
//     'use strict';
//     // just to fool build system.
//     window[0 || 'define']('esmwrapper', ['io.ox/core/esmwrapper'], _.identity);
// }());

// require(['esmwrapper!pdfjs-dist/build/pdf'], function (myModule) {
//     return myModule;
// });
