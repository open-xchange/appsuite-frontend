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

// var loadpath = '999'
// window.loadpath = '222'
define([], function () {
    return {
        load: function (name, req, onload) {
            var modulePath = req.toUrl(name + '.mjs');
            var loadPath = ox.abs + ox.root + '/' + modulePath;
            console.log(loadPath);
            // using parameters with 'new Function' has a different scope behavior, let's keep it as simple as possible here
            // eslint-disable-next-line
            var dynamicImport = new Function('return import("' + loadPath + '");');
            dynamicImport()
                .then(function (module) {
                    console.log('loaded module', module);
                    // so far not needed, feel free to extend this loader for default exports as well
                    if (module.default) throw new Error('The ESM loader has found an unexpected default export within the module.');
                    return onload(module);
                })
                .catch(function (err) {
                    onload.error(err);
                });
        }
    };
});
