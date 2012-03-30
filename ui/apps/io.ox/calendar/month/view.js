/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'gettext!io.ox/calendar/month/view'], function (util, gt) {

    'use strict';

    var // vars
        app, win, main,
        // init
        initialized = false,
        initialize = function (a) {
            if (!initialized) {
                app = a;
                win = app.getWindow();
                main = win.addView('month-view');
                main.append(
                    $('<h3>').text('Hallo Welt!')
                );
                initialized = true;
            }
        };

    return {

        show: function (app) {

            // init first
            initialize(app);

            // set view
            win.setView('month-view');

            // draw scaffold
            main.empty().css({
                    color: '#eb7d1e',
                    backgroundColor: '#333',
                    padding: '30px',
                    textAlign: 'right',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '32pt',
                    lineHeight: '1.25em',
                    whiteSpace: 'pre'
                });

            main.append($('<span>').css('color', '#555').append($.txt(util.getDayNames().join(" ") + '\n')));
            var list = util.getMonthScaffold(_.now());
            _(list).each(function (days) {
                main.append($.txt(
                    _(days).map(function (day) {
                            return _.pad(day.date, 2, " ");
                        })
                        .join(" ") + '\n'
                ));
            });
        }
    };
});