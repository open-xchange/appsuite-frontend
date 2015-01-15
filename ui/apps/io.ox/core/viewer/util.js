/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/util', [
    'io.ox/core/date',
    'gettext!io.ox/core/viewer'
], function (OXDate, gt) {

    'use strict';

    var Util = {};

    /**
     * Returns a date formatted as string
     *
     * @param {Number} timestamp
     *  The core date.
     *
     * @param {Object} options
     *      @param {Boolean} [options.fulldate = false]
     *          If set to true the time part is added to the date String.
     *      @param {Boolean} [options.filtertoday = true]
     *          If set to true only displays the time part for today.
     *
     * @returns {String}
     *  The formatted date string.
     */
    Util.getDateFormated = function (timestamp, options) {
        if (!_.isNumber(timestamp)) { return '-'; }

        var opt = $.extend({ fulldate: false, filtertoday: true }, options || {}),
        now = new OXDate.Local(),
        d = new OXDate.Local(timestamp),
        timestr = function () {
            return d.format(OXDate.TIME);
        },
        datestr = function () {
            return d.format(OXDate.DATE) + (opt.fulldate ? ' ' + timestr() : '');
        },
        isSameDay = function () {
            return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getYear() === now.getYear();
        };
        return isSameDay() && opt.filtertoday ? timestr() : datestr();
    };

    /**
     * Creates Bootstrap panel markup
     *
     *  @param {Object} options
     *      @param {String} options.title
     *          The panel header title.
     *      @param {String} [options.collapsed = false]
     *          If true the panel body is collapsed by default.
     *
     * @returns {jQuery}
     *  The jQuery panel node.
     */
    Util.createPanelNode = function (options) {
        var options = $.extend({ title: '', collapsed: false }, options || {}),
            panelBody = $('<div>').addClass('panel-body ' + (options.collapsed ? 'panel-collapsed' : '')).css('display', (options.collapsed ? 'none' : 'block')),
            toggleButton = $('<a>', { href: '#', role: 'button', tabindex: 1, title: gt('Toggle panel'), 'aria-expanded': options.collapsed ? 'false' : 'true' }).addClass('toggle-panel panel-heading-button btn'),
            buttonIcon = $('<i>').addClass('fa fa-chevron-' + (options.collapsed ? 'right' : 'down')),
            panel;

        /**
         * Panel toggle button handler, switches the panel header icon.
         */
        function onTogglePanel (event) {
            event.preventDefault();

            if (panelBody.hasClass('panel-collapsed')) {
                buttonIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                toggleButton.attr('aria-expanded', 'true');
            } else {
                buttonIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                toggleButton.attr('aria-expanded', 'false');
            }
        }

        panel = $('<div>').addClass('panel panel-default').append(
            $('<div>').addClass('panel-heading').append(
                $('<h3>').addClass('panel-title').text(options.title),
                toggleButton.append(
                    buttonIcon
                )
                .on('click', onTogglePanel)
            ),
            panelBody
        );

        return panel;
    };

    return Util;
});
