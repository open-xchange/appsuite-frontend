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
define('io.ox/mail/settings',
       ['io.ox/core/extensions',
        'io.ox/settings/utils',
        'io.ox/core/tk/dialogs',
        'io.ox/core/tk/forms',
        'io.ox/core/tk/view',
        'settings!io.ox/mail'], function (ext, utils, dialogs, forms, View, settings) {

    'use strict';

    var myValidator = {


    };

    var Builder = function () {

        var nodes = [$()],
            index = 0,
            last = $(),
            self = this,
            wrap = function (module, id) {
                return function () {
                    nodes[index] = nodes[index][index === 0 ? 'add' : 'append'](
                        last = module[id].apply(module, arguments)
                    );
                    return this;
                };
            };

        // copy functions
        _(arguments).each(function (module) {
            // do not use _().each here, since we need the prototype as well
            for (var id in module) {
                if (_.isFunction(module[id])) {
                    self[id] = wrap(module, id);
                }
            }
        });

        this.invoke = function () {
            var args = $.makeArray(arguments), name = args.shift();
            last[name].apply(last, args);
            return this;
        };

        // add - increases nesting level
        this.add = function () {
            index++;
            nodes.push(last);
            return this;
        };

        // end - decreases nesting level
        this.end = function () {
            if (index > 0) {
                index--;
                nodes.pop();
            }
            return this;
        };

        // get outer jQuery object
        this.get = function () {
            return nodes[0];
        };

        // destructor - the final get
        this.done = function () {
            try {
                return this.get();
            } catch (e) {
            } finally {
                for (var id in this) {
                    delete this[id];
                }
                nodes = last = self = null;
            }
        };
    };

    window.settings = settings;
    var mailSettings = {
        draw: function (node, app) {
            var myView = new View({model: settings});
            node.append(myView.node);
            //myView.createSectionTitle({text: 'Common'});

            console.log(myView);

           /* new Builder(utils, myView)
                .createSettingsHead(app)
                .createSection()
                .add()
                    .createSectionTitle({ text: 'Common' })
                    .createSectionContent()
                    .add()
                        .createInfoText({
                            html: 'EVERYTHING IS JUST MENT TO BE AN EXAMPLE HERE::::: Melden Sie sich mit Ihrem OX-Konto in OX Chrome an, ' +
                                'um Ihre personalisierten Browserfunktionen online zu ' +
                                'speichern und über OX Chrome auf jedem Computer darauf ' +
                                'zuzugreifen. Sie werden dann auch automatisch in Ihren ' +
                                'Lieblingsdiensten von OX angemeldet. Weitere Informationen' +
                                'mehr Infos unter <a href="http://www.open-xchange.com" target="_blank">www.open-xchange.com</a>'
                        })
                        .createSectionGroup()
                        .invoke('addClass', 'expertmode')
                        .add()
                            .createSelectbox({
                                property: 'mail-common-defaultview',
                                label: 'Default view:',
                                items: {
                                    'V-split view 1': 'option1',
                                    'V-split view 2': 'option2',
                                    'V-split view 3': 'option3'
                                },
                                currentValue: 'option1',
                                validator: myValidator
                            })
                        .end()
                        .createSectionGroup()
                        .invoke('addClass', 'expertmode')
                        .add()
                            .createSelectbox({
                                property: 'mail-common-spamfolderview',
                                label: 'Default view for Spam folder',
                                items:
                                {   'V-split view 1': 'option1',
                                    'V-split view 2': 'option2',
                                    'V-split view 3': 'option3'
                                },
                                currentValue: 'option1',
                                validator: myValidator
                            })
                        .end()
                        .createSectionDelimiter()
                        .add()
                            .createButton({label: 'my button me'})
                        .end()
                    .end()

                .get()
                .appendTo(myView.node);*/

            myView.node
            .append(
                utils.createSettingsHead(app)
            )
            //section
            .append(
                utils.createSection()
                .append(
                    utils.createSectionTitle({ text: 'Common' }),
                    utils.createSectionContent()
                    .append(
                        utils.createInfoText({
                            html: 'EVERYTHING IS JUST MENT TO BE AN EXAMPLE HERE::::: Melden Sie sich mit Ihrem OX-Konto in OX Chrome an, ' +
                                  'um Ihre personalisierten Browserfunktionen online zu ' +
                                  'speichern und über OX Chrome auf jedem Computer darauf ' +
                                  'zuzugreifen. Sie werden dann auch automatisch in Ihren ' +
                                  'Lieblingsdiensten von OX angemeldet. Weitere Informationen' +
                                  'mehr Infos unter <a href="http://www.open-xchange.com" target="_blank">www.open-xchange.com</a>'
                        }),
                        utils.createSectionGroup()
                            .append(
                                myView.createSelectbox({
                                    property: 'mail-common-defaultview',
                                    label: 'Default view:',
                                    items: {
                                        'V-split view 1': 'option1',
                                        'V-split view 2': 'option2',
                                        'V-split view 3': 'option3'
                                    },
                                    currentValue: 'option1',
                                    validator: myValidator
                                })
                            )
                            .addClass('expertmode'),

                        utils.createSectionGroup()
                            .append(
                                myView.createSelectbox({
                                    property: 'mail-common-spamfolderview',
                                    label: 'Default view for Spam folder',
                                    items: {
                                        'V-split view 1': 'option1',
                                        'V-split view 2': 'option2',
                                        'V-split view 3': 'option3'
                                    },
                                    validator: myValidator
                                })
                            )
                            .addClass('expertmode'),

                        utils.createSectionDelimiter(),
                        utils.createButton({label: 'my button me'}),
                        myView.createCheckbox({property: 'mail-common-selectfirst', label: 'Automatically select first E-Mail?', validator: myValidator}).addClass('expertmode'),
                        myView.createCheckbox({property: 'mail-common-removepermanently', label: 'Permanently remove deleted E-Mails?', validator: myValidator}),
                        myView.createCheckbox({property: 'mail-common-notifyreceipt', label: 'Notify on delivery receipt?', validator: myValidator}).addClass('expertmode'),
                        myView.createCheckbox({property: 'mail-common-showsenderpic', label: 'Show sender image?',  validator: myValidator}),
                        myView.createCheckbox({property: 'mail-common-collectwhilesending', label: 'Automatically collect contacts in the folder "Collected addresses" while sending?', validator: myValidator}).addClass('expertmode'),
                        myView.createCheckbox({property: 'mail-common-collectwhilereading', label: 'Automatically collect contacts in the folder "Collected addresses" while reading?', validator: myValidator}).addClass('expertmode'),
                        utils.createSectionDelimiter(),
                        utils.createButton({label: 'click me'})
                    ),
                    utils.createSectionDelimiter()
                )
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Compose'}))
                .append(
                  utils.createSectionContent()
                    .append(myView.createCheckbox({property: 'mail-common-selectfirst', label: 'Insert the original E-Mail text to a reply',  validator: myValidator}).addClass('expertmode'))
                    .append(myView.createCheckbox({property: 'mail-common-removepermanently', label: 'Append vcard',  validator: myValidator}))
                    .append(myView.createCheckbox({property: 'mail-common-notifyreceipt', label: 'Enable auto completion of E-Mail addresses',  validator: myValidator}).addClass('expertmode'))
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'Forward E-Mails as:'}))
                        .append(myView.createRadioButton({property: 'mail-compose-forwardas', label: 'Inline', name: 'mail-compose-forwardas', value: true,  validator: myValidator}))
                        .append(myView.createRadioButton({property: 'mail-compose-forwardas', label: 'Attachment', name: 'mail-compose-forwardas', value: false,  validator: myValidator}))
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'When "Reply all":'}))
                        .append(myView.createRadioButton({property: 'mail-compose-whenreplyall', label: 'Add sender and recipients to "To", Cc to "Cc"', name: 'mail-compose-whenreplyall', value: "fields",  validator: myValidator}))
                        .append(myView.createRadioButton({property: 'mail-compose-whenreplyall', label: 'Add sender to "To", recipients to "Cc"', name: 'mail-compose-whenreplyall', value: "cc",  validator: myValidator}))
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'Format E-Mails as:'}))
                        .append(myView.createRadioButton({property: 'mail-compose-emailformat', label: 'HTML', name: 'mail-compose-emailformat', value: "html",  validator: myValidator}))
                        .append(myView.createRadioButton({property: 'mail-compose-emailformat', label: 'Plain text', name: 'mail-compose-emailformat', value: "plain",  validator: myValidator}))
                        .append(myView.createRadioButton({property: 'mail-compose-emailformat', label: 'HTML and Plain text', name: 'mail-compose-emailformat', value: 'both',  validator: myValidator}))
                    )

                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createSelectbox({
                                property: 'mail-testselect',
                                label: 'Editor feature set',
                                items: {
                                    'Enhanced': 'enhanced',
                                    'Default': 'default'
                                },
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createSelectbox({property: 'mail-compose-font', label: 'Default E-Mail font:', items: {
                                'Default': 'default',
                                'Andale Mono': 'andale_mono',
                                'Arial': 'arial',
                                'Arial Black': 'arial_black',
                                'Book Antiqua': 'book_antiqua'
                            },  validator: myValidator })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createSelectbox({property: 'mail-compose-fontsize', label: 'Default E-Mail font size:', items: {
                                'Default': 'default',
                                '1 (8pt)': '8_pt',
                                '2 (10pt)': '10_pt'
                            },  validator: myValidator})
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createText({ text: 'Line wrap when sending text mails after: ' })
                        )
                        .append(
                            myView.createTextField({
                                property: 'mail-compose-linewarpafter',
                                validator: myValidator
                            })
                            .css({ width: '30px', display: 'inline-block'})
                        )
                        .append(
                            myView.createText({ text: ' characters' })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createSelectbox({
                                property: 'mail-compose-defaultsender',
                                label: 'Default sender address:',
                                items: {
                                    'mario@sourcegarden.de': 'mario@sourcegarden.de',
                                    'mario@sourcegarden.com': 'mario@sourcegarden.com',
                                    'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com'
                                },
                                validator: myValidator
                            })
                        )
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            myView.createSelectbox({
                                property: 'mail-compose-savedraftsinterval',
                                label: 'Auto-save Email drafts?',
                                items: {
                                    'Disabled': 'disabled',
                                    '1 Minute': '1_minute',
                                    '3 Minutes': '3_minutes',
                                    '5 Minutes': '5_minutes',
                                    '10 Minutes': '10_minutes'
                                },
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(utils.createSectionDelimiter())
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Display'}))
                .append(
                    utils.createSectionContent()
                    .append(myView.createCheckbox({property: 'mail-display-allowhtml', label: 'Allow html formatted E-Mails',  validator: myValidator}))
                    .append(myView.createCheckbox({property: 'mail-display-blockimgs', label: 'Block pre-loading of externally linked images',  validator: myValidator}))
                    .append(myView.createCheckbox({property: 'mail-display-emotionicons', label: 'Display emoticons as graphics in text E-Mails',  validator: myValidator}))
                    .append(myView.createCheckbox({property: 'mail-display-colorquotes', label: 'Color quoted lines',  validator: myValidator}))
                    .append(myView.createCheckbox({property: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields',  validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .addClass('expertmode')
                .append(utils.createSectionTitle({text: 'Signatures'}))
                .append(
                  utils.createSectionContent()
                    .append(myView.createCheckbox({property: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields',  validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .addClass('expertmode')
                .append(utils.createSectionTitle({text: 'Filter' }))
                .append(
                  utils.createSectionContent()
                    .append(myView.createCheckbox({property: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields',  validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Vacation Notice'}))
                .append(
                  utils.createSectionContent()
                    .append(myView.createCheckbox({property: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields',  validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            );

            return node;
        }
    };

    // created on/by
    ext.point("io.ox/mail/settings/detail").extend({
        index: 200,
        id: "mailsettings",
        draw: function (data) {
            return mailSettings.draw(this, data);
        },
        save: function () {
            settings.save().done(function () {
                console.log('saved for email');
            });
        }
    });

    return {}; //whoa return nothing at first
});
