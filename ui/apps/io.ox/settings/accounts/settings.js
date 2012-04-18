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
/*global
define: true, _: true
*/
define('io.ox/settings/accounts/settings',
      ['io.ox/core/extensions',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/settings/accounts'], function (ext, utils, dialogs, settings) {


    'use strict';

    var myValidator = {

    };

    var accountsView =  {
        draw: function (node, data) {
            var listbox = null;
            node
            .append(
                utils.createSettingsHead(data)
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Accounts'}))
                .append(
                    utils.createSectionContent()
                    .append(
                        listbox = utils.createListBox({
                            dataid: 'accounts-list',
                            model: {
                                get: function () {
                                    var list = [
                                        {dataid: 'email/2281', html: 'mario@sourcegarden.com (imap)'},
                                        {dataid: 'facebook/2823', html: 'mario.scheliga (facebook)'},
                                        {dataid: 'twitter/28311', html: 'marioscheliga (twitter)'},
                                        {dataid: 'xing/288128', html: 'mario.scheliga (xing)'},
                                        {dataid: 'linkedin/288111', html: 'mario.scheliga (linkedIn)'}
                                    ];
                                    return list;
                                }
                            }
                        })
                    )
                    .append(utils.createButton({label: 'Add ...', btnclass: 'btn'}).css({'margin-right': '15px'}))
                    .append(
                      utils.createButton({label: 'Edit ...', btnclass: 'btn'})
                        .css({'margin-right': '15px'})
                        .on('click', function (args) {
                            var selectedItemID = listbox.find('div[selected="selected"]').attr('data-item-id');
                            if (selectedItemID !== undefined) {
                                var type = selectedItemID.split(/\//)[0]; // first is the type (subpath)
                                var dataid = selectedItemID.split(/\//)[1];
                                require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                                    console.log('ext: ' + 'io.ox/settings/accounts/' + type + '/settings/detail');
                                    ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', node, dataid);

                                });
                            }
                        })
                    )
                    .append(utils.createButton({label: 'Delete ...', btnclass: 'btn'}))
                )
                .append(utils.createSectionDelimiter())
            );
        }
    };


    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            accountsView.draw(this, data);
        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

