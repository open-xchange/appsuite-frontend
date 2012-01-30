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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/contacts/model',
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    // validate                                               DONE
    // consitency (nur bei save, dann trigger save event)     DONE
    // prototype (wech: -> klassenfunction extend)            DONE
    // contact model sauber (alles ins main wat geht)         DONE
    // form->datefield
    // node a la textfield img and so on

    var ContactModel = Model.extend({
        properties: {
            'display_name': {format: 'string', defaultValue: 'Mrs. Bean'},
            'first_name': { format: 'string', mandatory: true},
            'last_name': {  format: 'string'},
            'second_name': { format: 'string'},
            'suffix': { format: 'string'},
            'title': { format: 'string'},
            'street_home': { format: 'string', mandatory: true},
            'postal_code_home': { format: 'string'},
            'city_home': { format: 'string'},
            'state_home': { format: 'string'},
            'country_home': { format: 'string'},
            'birthday': { format: 'pastDate'},
            'email1': { format: 'email'}
        }
    });

    return ContactModel;
});
