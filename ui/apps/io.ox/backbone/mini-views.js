/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views', [
    'io.ox/backbone/mini-views/abstract',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/date'
], function (AbstractView, common, date) {

    'use strict';

    return _.extend({ AbstractView: AbstractView }, common, date);
});
