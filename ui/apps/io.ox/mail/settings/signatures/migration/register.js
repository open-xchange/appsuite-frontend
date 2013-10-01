/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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
