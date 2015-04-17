/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/showlink', [
    'io.ox/files/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/util',
    'gettext!io.ox/files'
], function (api, dialogs, util, gt) {

    'use strict';

    function process(list) {

        new dialogs.ModalDialog({ width: 500 })
            .build(function () {
                // header
                this.header($('<h4>').text(gt('Direct link')));
                // content
                this.getContentNode().addClass('user-select-text max-height-200').append(

                    _(list).map(function (file) {

                        var url = ox.abs + ox.root +
                            '/#!&app=io.ox/files' +
                            '&folder=' + encodeURIComponent(file.folder_id) +
                            '&id=' + encodeURIComponent(file.folder_id) + '.' + encodeURIComponent(file.id);

                        return $('<p>').append(
                            $('<div>').text(file.filename || file.title || ''),
                            $('<div>').append(
                                $('<a class="direct-link" target="_blank" tabindex="1">')
                                .attr('href', url)
                                .html(util.breakableHTML(url))
                            )
                        );
                    })
                );
            })
            .addPrimaryButton('cancel', gt('Close'), 'cancel',  { 'tabIndex': '1' })
            .show(function () {
                this.find('a.direct-link').focus();
            });
    }

    return function (list) {
        api.getList(list).done(process);
    };
});
