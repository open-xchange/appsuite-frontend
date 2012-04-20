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
       'io.ox/core/tk/view',
       'io.ox/core/tk/model',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/settings/accounts'], function (ext, View, Model, utils, dialogs, settings) {


    'use strict';

    var AccountsSettingsModel = Model.extend({
    });

    var AccountsSettingsModelView = View.extend({
        draw: function (data) {
            var self = this,
                listbox = null;
            self.node.append(this.createSettingsHead(data))
            .append(
                    this.createSection()
                    .append(this.createSectionTitle({text: 'Accounts'}))
                    .append(
                        this.createSectionContent()
                        .append(
                            listbox = this.createListBox({
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
                        .append(this.createButton({label: 'Add ...', btnclass: 'btn'}).css({'margin-right': '15px'}))
                        .append(
                          this.createButton({label: 'Edit ...', btnclass: 'btn'})
                            .css({'margin-right': '15px'})
                            .on('click', function (args) {
                                var selectedItemID = listbox.find('div[selected="selected"]').attr('data-item-id');
                                if (selectedItemID !== undefined) {
                                    var type = selectedItemID.split(/\//)[0]; // first is the type (subpath)
                                    var dataid = selectedItemID.split(/\//)[1];
                                    require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                                        console.log('ext: ' + 'io.ox/settings/accounts/' + type + '/settings/detail');
                                        ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', self.node, dataid);

                                    });
                                }
                            })
                        )
                        .append(this.createButton({label: 'Delete ...', btnclass: 'btn'}))
                    )
                    .append(this.createSectionDelimiter())
                );
            return self;

        }
    });






    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            var myModel = settings.createModel(AccountsSettingsModel),
                myView = new AccountsSettingsModelView({model: myModel});
            this.append(myView.draw(data).node);
            return myView.node;
        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

