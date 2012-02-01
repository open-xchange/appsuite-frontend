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
        'io.ox/core/tk/view',
        'io.ox/core/tk/model',
        'io.ox/settings/utils',
        'gettext!io.ox/mail/mail',
        'settings!io.ox/mail'],

function (ext, View, Model, util, gt, settings) {

    'use strict';


    var MailSettingsModel = Model.extend({
        properties: {


        },
        set: function (key, value) {
            var validated = this.validate(key, value);
            console.log('validated');
            console.log(validated);
            if (validated !== true || validated.constructor.toString().indexOf('ValidationError') !== -1) {
                return $(this).trigger('error:validation', [validated]);
            }

            if (_.isEqual(value, this.data[key])) {
                return true;
            }

            this.data.set(key, value);
            $(this).trigger('change:' + key, [key, value]);
            $(this).trigger('change', [key, value]);
        },
        get: function (k) {
            return this.data.get(k);
        }

    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_common',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Common')}),
                        util.createSectionContent()
                          .append(
                              util.createInfoText({html: 'EVERYTHING IS JUST MENT TO BE AN EXAMPLE HERE::::: Melden Sie sich mit Ihrem OX-Konto in OX Chrome an, ' +
                                        'um Ihre personalisierten Browserfunktionen online zu ' +
                                        'speichern und über OX Chrome auf jedem Computer darauf ' +
                                        'zuzugreifen. Sie werden dann auch automatisch in Ihren ' +
                                        'Lieblingsdiensten von OX angemeldet. Weitere Informationen' +
                                        'mehr Infos unter <a href="http://www.open-xchange.com" target="_blank">www.open-xchange.com</a>'}),
                              util.createSectionGroup()
                                  .append(
                                      this.createSelectbox({property: 'mail-common-defaultview',
                                          label: 'Default view:',
                                          items: { 'V-split view 1': 'option1',
                                              'V-split view 2': 'option2',
                                              'V-split view 3': 'option3'
                                          },
                                          currentValue: 'option1'
                                      })
                                  ).addClass('expertmode'),
                              util.createSectionGroup()
                                  .append(
                                      this.createSelectbox({property: 'mail-common-spamfolderview',
                                          label: 'Default view for Spam folder:',
                                          items: { 'V-split view 1': 'option1',
                                              'V-split view 2': 'option2',
                                              'V-split view 3': 'option3'
                                          },
                                          currentValue: 'option1'
                                      })
                                  ).addClass('expertmode'),
                              util.createSectionDelimiter(),
                              util.createButton({label: 'my button me'}),
                              this.createCheckbox({property: 'mail-common-selectfirst', label: 'Automatically select first E-Mail?'}).addClass('expertmode'),
                              this.createCheckbox({property: 'mail-common-removepermanently', label: 'Permanently remove deleted E-Mails?'}),
                              this.createCheckbox({property: 'mail-common-notifyreceipt', label: 'Notify on delivery receipt?'}).addClass('expertmode'),
                              this.createCheckbox({property: 'mail-common-showsenderpic', label: 'Show sender image?'}),
                              this.createCheckbox({property: 'mail-common-collectwhilesending', label: 'Automatically collect contacts in the folder "Collected addresses" while sending?'}).addClass('expertmode'),
                              this.createCheckbox({property: 'mail-common-collectwhilereading', label: 'Automatically collect contacts in the folder "Collected addresses" while reading?'}).addClass('expertmode'),
                              util.createSectionDelimiter(),
                              util.createButton({label: 'click me'})
                          ),
                      util.createSectionDelimiter()
                    )
            );
        }
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_compose',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Compose')}),
                        util.createSectionContent()
                            .append(
                                this.createCheckbox({property: 'mail-common-selectfirst', label: 'Insert the original E-Mail text to a reply'}).addClass('expertmode'),
                                this.createCheckbox({property: 'mail-common-removepermanently', label: 'Append vcard'}),
                                this.createCheckbox({property: 'mail-common-notifyreceipt', label: 'Enable auto completion of E-Mail addresses'}),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: 'Forward E-Mails as:'}),
                                        this.createRadioButton({property: 'mail-compose-forwardas', label: 'Inline', name: 'mail-compose-forwardas', value: true}),
                                        this.createRadioButton({property: 'mail-compose-forwardas', label: 'Attachment', name: 'mail-compose-forwardas', value: false})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: 'When "Reply all":'}),
                                        this.createRadioButton({property: 'mail-compose-whenreplyall', label: 'Add sender and recipients to "To", Cc to "Cc"', name: 'mail-compose-whenreplyall', value: 'fields'}),
                                        this.createRadioButton({property: 'mail-compose-whenreplyall', label: 'Add sender to "To", recipients to "Cc"', name: 'mail-compose-whenreplyall', value: 'cc'})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: 'Format E-Mails as:'}),
                                        this.createRadioButton({property: 'mail-compose-emailformat', label: 'HTML', name: 'mail-compose-emailformat', value: 'html'}),
                                        this.createRadioButton({property: 'mail-compose-emailformat', label: 'Plain text', name: 'mail-compose-emailformat', value: 'plain'}),
                                        this.createRadioButton({property: 'mail-compose-emailformat', label: 'HTML and Plain text', name: 'mail-compose-emailformat', value: 'both'})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({ property: 'mail-testselect', label: 'Editor feature set', items: {'Enhanced': 'enhanced', 'Default': 'default'}})
                                    ).addClass('expertmode'),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'mail-compose-font', label: 'Default E-Mail font:', items: {'Default': 'default', 'Andale Mono': 'andale_mono', 'Arial': 'arial', 'Arial Black': 'arial_black', 'Book Antiqua': 'book_antiqua'}})
                                    ).addClass('expertmode'),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'mail-compose-fontsize', label: 'Default E-Mail font size:', items: {'Default': 'default', '1 (8pt)': '8_pt', '2 (10pt)': '10_pt'}})
                                    ).addClass('expertmode'),
                                util.createSectionGroup()
                                    .append(
                                        this.createText({ text: 'Line wrap when sending text mails after: ' }),
                                        this.createTextField({ property: 'mail-compose-linewarpafter'}).css({ width: '30px', display: 'inline-block'}),
                                        this.createText({ text: ' characters' })
                                    ),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'mail-compose-defaultsender', label: 'Default sender address:', items: { 'mario@sourcegarden.de': 'mario@sourcegarden.de', 'mario@sourcegarden.com': 'mario@sourcegarden.com', 'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com' }})
                                    ),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'mail-compose-savedraftsinterval', label: 'Auto-save Email drafts?', items: {'Disabled': 'disabled', '1 Minute': '1_minute', '3 Minutes': '3_minutes', '5 Minutes': '5_minutes', '10 Minutes': '10_minutes' }})
                                    )
                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_display',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Display')}),
                        util.createSectionContent()
                            .append(
                                this.createCheckbox({property: 'mail-display-allowhtml', label: 'Allow html formatted E-Mails'}),
                                this.createCheckbox({property: 'mail-display-blockimgs', label: 'Block pre-loading of externally linked images'}),
                                this.createCheckbox({property: 'mail-display-emotionicons', label: 'Display emoticons as graphics in text E-Mails'}),
                                this.createCheckbox({property: 'mail-display-colorquotes', label: 'Color quoted lines'}),
                                this.createCheckbox({property: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields'})
                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_signatures',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Signatures')}),
                        util.createSectionContent(),
                        util.createSectionDelimiter()
                    )
            );
        }
    });
    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_filter',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Filter')}),
                        util.createSectionContent(),
                        util.createSectionDelimiter()
                    )
            );
        }
    });
    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_vacation_notice',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Vacation Notice')}),
                        util.createSectionContent(),
                        util.createSectionDelimiter()
                    )
            );
        }
    });
    var MailSettingsView = View.extend({
        draw: function (data) {
            var self = this;
            self.node.append(util.createSettingsHead(data));
            ext.point('io.ox/mail/settings/detail/section').invoke('draw', self);
            return self;
        }
    });


    // created on/by
    ext.point('io.ox/mail/settings/detail').extend({
        index: 200,
        id: 'mailsettings',
        draw: function (data) {
            var myModel = new MailSettingsModel({data: settings}),
                myView = new MailSettingsView({model: myModel});

            this.append(myView.draw(data).node);
            return myView.node;
        },
        save: function () {
            settings.save().done(function () {
                console.log('saved for email');
            });
        }
    });

    return {}; //whoa return nothing at first
});
