/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * 
 */

// TODO: Caching? Replace Mock Data with real backend calls
define("extensions/halo/api", ["io.ox/core/http"], function (http) {
    return {
        person: function (contactData) {
            return new $.Deferred().resolve({
                data: [
                    {
                        type: "contact",
                        data: contactData
                    },
                    {
                        token: "123abc"
                    }
                ]
            });
        },
        resolve: function (token) {
            return new $.Deferred().resolve({
                data: {
                    type: "linkedin:sharedContacts",
                    data: [
                        {
                            firstName: "Francisco",
                            lastName: "Laguna"
                        },
                        {
                            firstName: "Matthias",
                            lastName: "Biggeleben"
                        }
                    ]
                }
            });
        }
    };
});