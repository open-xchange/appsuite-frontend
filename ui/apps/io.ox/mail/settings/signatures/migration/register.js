/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/mail/settings/signatures/migration/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/core/updates').extend({
        id: 'migrate-signatures',
        run: function () {

            var def = $.Deferred();
            require(['io.ox/core/config', 'io.ox/core/api/snippets'], function (config, snippets) {
                var classicSignatures = config.get('gui.mail.signatures');

                var deferreds = _(classicSignatures).map(function (classicSignature) {
                    // console.log("Importing signature " + classicSignature.signature_name);
                    return snippets.create({

                        type: 'signature',
                        module: 'io.ox/mail',
                        displayname: classicSignature.signature_name,
                        content: classicSignature.signature_text,
                        misc: {
                            insertion: classicSignature.position
                        },
                        meta: {
                            imported: classicSignature
                        }
                    });

                });

                $.when.apply($, deferreds).done(def.resolve).fail(def.reject);

            }).fail(def.reject);

            return def;
        }
    });

});
