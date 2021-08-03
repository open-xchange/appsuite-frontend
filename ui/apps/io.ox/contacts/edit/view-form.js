/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/contacts/edit/view-form', [
    'io.ox/contacts/model',
    'io.ox/backbone/views',
    'io.ox/backbone/views/actions/util',
    // 'io.ox/contacts/widgets/pictureUpload',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/attachments',
    'gettext!io.ox/contacts',
    'io.ox/core/folder/api',
    'io.ox/core/folder/util',
    'settings!io.ox/core',
    'less!io.ox/contacts/edit/view-form'
], function (model, views, actionsUtil, api, util, capabilities, ext, mini, attachmentViews, gt, folderApi, folderUtils, settings) {

    'use strict';

    var meta = {
        sections: {
            personal: [
                // no 'display_name' used cause end-users don't understand it (bug 27260)
                'title', 'first_name', 'last_name',
                'second_name', 'suffix', 'nickname', 'birthday',
                'marital_status', 'number_of_children', 'spouse_name',
                'anniversary', 'url'
            ],
            job: [
                'profession', 'position', 'department', 'company', 'room_number',
                'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                'commercial_register', 'branches', 'business_category', 'info',
                'manager_name', 'assistant_name'
            ],
            messaging: ['email1', 'email2', 'email3', 'instant_messenger1', 'instant_messenger2'],
            phone: [
                'cellular_telephone1', 'cellular_telephone2',
                'telephone_business1', 'telephone_business2',
                'telephone_home1', 'telephone_home2',
                'telephone_company', 'telephone_other',
                'fax_business', 'fax_home', 'fax_other',
                'telephone_car', 'telephone_isdn', 'telephone_pager',
                'telephone_primary', 'telephone_radio',
                'telephone_telex', 'telephone_ttytdd',
                'telephone_ip', 'telephone_assistant', 'telephone_callback'
            ],
            home_address: [
                'street_home', 'postal_code_home', 'city_home',
                'state_home', 'country_home'
            ],
            business_address: [
                'street_business', 'postal_code_business',
                'city_business', 'state_business',
                'country_business'
            ],
            other_address: [
                'street_other', 'postal_code_other', 'city_other',
                'state_other', 'country_other'
            ],

            comment: ['note'],

            userfields: [
                'userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05',
                'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
                'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
                'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'
            ],

            attachments: ['attachments_list'],

            advanced: ['toggle']
        },

        rare: [
            'nickname', 'marital_status', 'number_of_children', 'spouse_name', 'anniversary',
            // phones
            'telephone_company', 'fax_other',
            'telephone_car', 'telephone_isdn', 'telephone_pager', 'telephone_primary',
            'telephone_radio', 'telephone_telex', 'telephone_ttytdd', 'telephone_assistant',
            'telephone_callback', 'telephone_ip',
            // job
            'number_of_employees', 'sales_volume', 'tax_id', 'commercial_register', 'branches',
            'business_category', 'info', 'manager_name', 'assistant_name', 'employee_type'
            // optional
            // 'userfield04', 'userfield05',
            // 'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
            // 'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
            // 'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'
        ],

        alwaysVisible: [
            'title', 'first_name', 'last_name', 'birthday',
            'position', 'department', 'company',
            'email1', 'email2', 'instant_messenger1',
            'cellular_telephone1', 'telephone_home1',
            'street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home',
            'note',
            'attachments_list'
        ],

        input_type: {
            'email1': 'email',
            'email2': 'email',
            'email3': 'email'
        },

        i18n: {
            personal: gt('Personal information'),
            messaging: gt('Messaging'),
            phone: gt('Phone & fax numbers'),
            home_address: gt('Home address'),
            business_address: gt('Business address'),
            other_address: gt('Other address'),
            job: gt('Job description'),
            comment: gt('Comment'),
            advanced: gt('Advanced'),
            userfields: gt('User fields'),
            attachments: gt('Attachments')
        },

        maxlength: {
            // most fields have a maxlength of 64
            128: 'first_name last_name position department tax_id',
            256: 'url profession street_home street_other street_business',
            512: 'email1 email2 email3 company',
            5680: 'note'
        }
    };

    // is part of footer otherwise
    if (_.device('smartphone')) meta.alwaysVisible.push('toggle');

    // process maxlength
    _(meta.maxlength).keys().forEach(function (size) {
        meta.maxlength[size].split(' ').forEach(function (field) {
            meta.maxlength[field] = size;
        });
    });

    // Remove attachment handling when infostore is not present
    if (!settings.get('features/PIMAttachments', capabilities.has('filestore'))) {
        delete meta.sections.attachments;
        delete meta.i18n.attachments;
    }

    if (capabilities.has('read_create_shared_folders')) {
        meta.sections.personal.push('private_flag');
    }

    _.each(['home', 'business', 'other'], function (type) {
        var fields = meta.sections[type + '_address'];
        meta.sections[type + '_address'] = _.compact(_.aprintf(
            //#. Format of addresses
            //#. %1$s is the street
            //#. %2$s is the postal code
            //#. %3$s is the city
            //#. %4$s is the state
            //#. %5$s is the country
            gt('%1$s\n%2$s %3$s\n%4$s\n%5$s'),
            function (i) { return fields[i]; }, $.noop)
        );
    });

    function createContactEdit(ref) {
        var isMyContactData = ref === 'io.ox/core/user';

        if (isMyContactData) {
            // Remove attachment handling if view is used with user data instead of contact data
            delete meta.sections.attachments;
            delete meta.i18n.attachments;
            meta.sections.personal = _.without(meta.sections.personal, 'private_flag');
        }

        var point = views.point(ref + '/edit'),

            ContactEditView = point.createView({
                tagName: 'div',
                className: 'edit-contact compact' + (isMyContactData ? '' : ' container'),
                render: function () {
                    this.point.invoke.apply(this.point, ['draw', this.$el].concat(this.extensionOptions ? this.extensionOptions() : [this.baton]));
                    return this;
                },
                init: function (o) {
                    if (isMyContactData) return;
                    // see Bug 36592
                    if (o && o.model.get('folder_id')) {
                        folderApi.get(o.model.get('folder_id')).done(function (folderData) {
                            if (folderUtils.is('public', folderData)) {
                                ext.point(ref + '/edit/personal').disable('private_flag');
                            } else {
                                ext.point(ref + '/edit/personal').enable('private_flag');
                            }
                        });
                    } else {
                        ext.point(ref + '/edit/personal').enable('private_flag');
                    }
                }
            });

        // point.extend(new PictureUpload({
        //     id: ref + '/edit/picture',
        //     index: 100,
        //     customizeNode: function () {
        //         // before 7.4.2 (?) we had to check if global address book is available
        //         // apparently the user API has been improved and handles the contact image as well
        //         // so we just go on here
        //         this.$el.addClass('contact-picture-upload f6-target');
        //     }
        // }));

        point.basicExtend({
            id: 'header',
            index: 10,
            draw: function (baton) {
                baton.parentView.toggle = toggle;
                if (baton.app) {
                    var row = $('<div class="header">');
                    ext.point(ref + '/edit/buttons').invoke('draw', row, baton);

                    var pos = _.device('!desktop') ? 'top' : settings.get('features/windowHeaderPosition', 'bottom');
                    // set header apparently means "append to" header. So let's empty it, to avoid redraw issues
                    if (pos === 'top') {
                        baton.app.getWindow().nodes.header.empty();
                    } else {
                        baton.app.getWindow().nodes.footer.empty();
                    }
                    baton.app.getWindow().nodes.header.empty();
                    baton.app.getWindow().setHeader(row);
                }
            }
        });

        // buttons
        ext.point(ref + '/edit/buttons').extend({
            index: 100,
            id: 'save',
            draw: function (baton) {
                this.append($('<button type="button" class="btn btn-primary save" data-action="save">')
                    .text(gt('Save'))
                    .on('click', function () {
                        actionsUtil.invoke(ref + '/actions/edit/save', baton);
                    })
                );

            }
        });

        ext.point(ref + '/edit/buttons').extend({
            index: 200,
            id: 'discard',
            draw: function (baton) {
                this.append($('<button type="button" class="btn btn-default discard" data-action="discard">')
                    .text(gt('Discard'))
                    .on('click', function () {
                        baton.$discardButton = $(this);
                        actionsUtil.invoke(ref + '/actions/edit/discard', baton);
                    })
                );
            }
        });

        ext.point(ref + '/edit/buttons').extend({
            index: 100,
            id: 'metrics',
            draw: function () {
                var self = this;
                require(['io.ox/metrics/main'], function (metrics) {
                    if (!metrics.isEnabled()) return;
                    // buttons
                    self.on('mousedown', '[data-action]', function (e) {
                        var node =  $(e.target);
                        metrics.trackEvent({
                            app: 'contacts',
                            target: 'edit/contact/toolbar',
                            type: 'click',
                            action: node.attr('data-action') || node.attr('data-name'),
                            detail: node.attr('data-value')
                        });
                    });
                });
            }
        });

        point.basicExtend({
            id: 'autoExpand',
            index: 1000000000000,
            draw: function (baton) {
                baton.parentView.on('restore', function () {
                    var diff = _.chain(baton.model.changed)
                        .keys().without('id', 'folder', 'display_name')
                        .difference(meta.alwaysVisible)
                        .value()
                        .length;
                    if (diff > 0) {
                        toggle.call(this.$el);
                    }
                });
            }
        });

        function toggle() {
            //make sure this works for links in head and body
            var node = $(this).closest('.edit-contact').toggleClass('compact'),
                isCompact = node.hasClass('compact');

            // update "has-content" class
            node.find('.field input[type="text"]').each(function () {
                var input = $(this),
                    field = input.closest('.field'),
                    hasContent = $.trim(input.val()) !== '';
                field.toggleClass('has-content', hasContent);
            });

            // update hidden
            node.find('.block').each(function () {
                var block = $(this),
                    // hide completely empty blocks or blocks with no content when in compact mode
                    hidden = (block.find('div.row.field > *').length === 0 && block.children('div.always').length === 0) || (isCompact && block.children('div.has-content, div.always').length === 0);

                block.removeClass('odd even hidden');
                if (hidden) block.addClass('hidden');
            });

            // update odd/even
            node.find('.block:not(.hidden)').each(function (index) {
                var block = $(this);
                block.addClass(index % 2 ? 'even' : 'odd');
            });
        }

        var FullnameView = mini.AbstractView.extend({
            tagName: 'h1',
            className: 'name',
            setup: function () {
                this.listenTo(this.model, 'change:display_name', this.render);
            },
            render: function () {
                var mod = this.model.toJSON();
                delete mod.display_name;

                // A11y: Added id as this is referenced via aria-labelledby when this view is used in a modal dialog.
                // e.g. My contact data
                // This should be considered for refactoring
                this.$el.attr('id', 'dialog-title');

                var text = util.getFullName(mod);
                this.$el.toggle(!!text).text(text);
                //fix top margin if picture upload was removed
                if (isMyContactData && !capabilities.has('gab')) {
                    this.$el.css('margin-top', '0px');
                }
                return this;
            }
        });

        var JobView = mini.AbstractView.extend({
            tagName: 'h2',
            className: 'job',
            setup: function () {
                this.listenTo(this.model, 'change:position change:department change:company', this.render);
            },
            render: function () {
                var text = util.getJob(this.model.toJSON());
                this.$el.toggle(!!text).text(text);
                return this;
            }
        });

        point.basicExtend({
            id: 'summary',
            index: 150,
            draw: function (baton) {

                this.append(
                    new FullnameView({ model: baton.model }).render().$el,
                    new JobView({ model: baton.model }).render().$el,
                    $('<div class="clearfix">')
                );
            }
        });

        point.basicExtend({
            id: 'final',
            index: 1000000000000,
            draw: function (baton) {
                //check if all non rare non attachment fields are filled
                var inputs = this.find('.field').not('.rare,[data-field="attachments_list"]').not('.has-content');

                // wrap userfields in a row
                this.find('[data-id="userfields"] > div').wrapAll($('<div class="row">'));
                //if all fields are filled the link must be compact view, not extend view
                if (inputs.length === 0) {
                    baton.parentView.toggle();
                }
            }
        });

        point.basicExtend({
            id: 'final_metrics',
            index: 1000000000001,
            draw: function (baton) {
                require(['io.ox/metrics/main'], function (metrics) {
                    if (!metrics.isEnabled()) return;
                    baton.$.form.find('.file-input')
                        .on('change', function track() {
                        // metrics
                            metrics.trackEvent({
                                app: 'contacts',
                                target: 'edit/contacts',
                                type: 'click',
                                action: 'add-attachment'
                            });
                        });
                });
            }
        });


        // attachment Drag & Drop
        ext.point('io.ox/contacts/edit/dnd/actions').extend({
            id: 'attachment',
            index: 100,
            label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
            multiple: function (files, app) {
                // get attachmentList view
                var attachmentList = app.view.$el.find('.attachment-list').data('view');
                _(files).each(function (fileData) {
                    attachmentList.addFile(fileData);
                });
            }
        });

        var Action = actionsUtil.Action;

        // Edit Actions
        new Action(ref + '/actions/edit/save', {
            action: function (baton) {

                // check if attachments are changed
                var view = baton.parentView.$el.find('.attachment-list').data('view');
                if (view && view.isDirty()) {
                    // set temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                    view.model.set('tempAttachmentIndicator', true);
                }

                baton.parentView.trigger('save:start');

                baton.model.save().then(
                    function success(e) {
                        baton.parentView.trigger('save:success', e);
                    },
                    function fail(e) {
                        baton.parentView.trigger('save:fail', e);
                    }
                );
            }
        });

        new Action(ref + '/actions/edit/discard', {
            action: function (baton) {
                baton.$discardButton.trigger('controller:quit');
            }
        });

        new Action(ref + '/actions/edit/reset-image', {
            action: function (baton) {
                baton.model.set('image1', '', { validate: true });
                var imageUrl = api.getFallbackImage();
                baton.parentView.$el.find('.picture-uploader').css('background-image', 'url(' + imageUrl + ')');
            }
        });

        function drawDefault(options, model) {
            var input;
            var guid = _.uniqueId('contacts-' + options.field + '-');
            this.append(
                $('<label class="control-label col-xs-12">').attr('for', guid).append(
                    $.txt(options.label),
                    input = new mini.InputView({ id: guid, name: options.field, model: model, maxlength: meta.maxlength[options.field] || 64 }).render().$el,
                    new mini.ErrorView({ selector: '.row' }).render().$el
                )
            );

            // trigger change event on keyup for view updates
            if (_.indexOf(['title', 'first_name', 'last_name'], options.field) >= 0) {
                input.on('keyup', function () {
                    // update model value silinet
                    model.set(options.field, $(this).val(), { silent: true });
                    if (model.changed.display_name) return;
                    var mod = model.toJSON();
                    delete mod.display_name;
                    model.set('display_name', util.getFullName(mod));
                });
            }
        }

        function drawTextarea(options, model) {
            var guid = _.uniqueId('contacts-' + options.field + '-');
            this.append(
                $('<label>').attr('for', guid).addClass('control-label col-xs-12').text(meta.i18n.comment),
                new mini.TextView({ id: guid, name: options.field, model: model, maxlength: meta.maxlength[options.field] || 64 }).render().$el
            );
        }

        function drawDate(options, model) {
            var label,
                guid = _.uniqueId('contacts-' + options.field + '-');
            this.append(
                $('<fieldset class="col-lg-12 form-group birthdate">').append(
                    label = $('<legend class="simple">').attr('id', guid).text(options.label),
                    // don't wrap the date control with a label (see bug #27559)
                    new mini.DateSelectView({ name: options.field, model: model, label: label }).render().$el
                )
            );
        }

        function drawCheckbox(options, model) {
            var guid = _.uniqueId('contacts-' + options.field + '-');
            this.append(
                $('<div class="col-lg-12 checkbox">').append(
                    $('<label>').attr('for', guid).append(
                        new mini.CheckboxView({ id: guid, name: options.field, model: model }).render().$el,
                        $.txt(' '),
                        $.txt(options.label)
                    )
                )
            );
        }

        function propagateAttachmentChange(model, id, errors) {

            id = model.get('id') || id;

            var folder_id = model.get('folder_id'),
                upload = api.uploadInProgress(_.ecid({ folder: folder_id, id: id }));

            //if there are errors show them
            if (errors.length > 0) {
                require(['io.ox/core/notifications'], function (notifications) {
                    _(errors).each(function (error) {
                        notifications.yell('error', error.error);
                    });
                });
            }

            return api.get({ id: id, folder: folder_id }, !upload)
                .then(function (data) {
                    if (upload) {
                        // don't delete caches if there is no upload
                        return $.when(
                            api.caches.get.add(data),
                            api.caches.all.grepRemove(folder_id + api.DELIM),
                            api.caches.list.remove({ id: id, folder: folder_id }),
                            api.clearFetchCache()
                        )
                        .done(function () {
                            // to make the detailview remove the busy animation:
                            api.removeFromUploadList(_.ecid(data));
                            api.trigger('refresh.list');
                        });
                    }
                    return $.when();
                });
        }

        function drawAttachments(options, model, baton) {
            this.append(
                baton.$.form = $('<form>').append(
                    new attachmentViews.ListView({
                        model: model,
                        module: 7,
                        changeCallback: propagateAttachmentChange
                    }).render().$el,
                    new attachmentViews.UploadView({ model: model }).render().$el.addClass('col-xs-12')
                )
            );
        }

        var index = 400,
            draw = {
                birthday: drawDate,
                anniversary: drawDate,
                note: drawTextarea,
                private_flag: drawCheckbox,
                attachments_list: drawAttachments
            };

        // loop over all sections (personal, messaging, phone etc.)
        // to get list of relevant fields per section
        _(meta.sections).each(function (fields, id) {
            // create new "block" extension
            ext.point(ref + '/edit').extend({
                id: id,
                index: index += 100,
                draw: function (baton) {

                    // a block has a fixed width and floats left
                    var guid = _.uniqueId('group-'),
                        block = id === 'comment' ? $('<fieldset class="block" role="presentation">').attr({ 'data-id': id }) :
                            $('<fieldset class="block" role="group">')
                            .attr({ 'data-id': id, 'aria-labelledby': guid })
                            .append(
                                $('<legend class="group">').append(
                                    $('<h2>').attr('id', guid).text(meta.i18n[id])
                                )
                            );

                    if (id === 'attachments') {
                        block.addClass('col-lg-12');
                        this.append($('<div class="clearfix">'));
                    } else if (id === 'userfields') {
                        block.addClass('col-lg-12');
                    } else {
                        block.addClass('col-sm-6');
                    }

                    // draw fields inside block
                    ext.point(ref + '/edit/' + id).invoke('draw', block, baton);

                    this.append(block);

                    // hide block if block contains no paragraph with content
                    if (block.children('div.has-content, div.always').length === 0) {
                        block.addClass('hidden');
                    } else if (this.find('fieldset.block').length % 2) {
                        block.addClass('odd');
                    } else {
                        block.addClass('even');
                        this.append($('<div class="clearfix">'));
                    }
                }
            });

            // create extensions for each field
            _(fields).each(function (field, index) {

                ext.point(ref + '/edit/' + id).extend({
                    id: field,
                    index: 100 + index * 100,
                    draw: function (baton) {

                        var value = baton.model.get(field),
                            isAlwaysVisible = _(meta.alwaysVisible).indexOf(field) > -1,
                            isRare = _(meta.rare).indexOf(field) > -1,
                            // anniversary is a date so timestamp 0 aka 1.1.1970 is valid
                            hasContent = (field === 'anniversary' ? _.isNumber(value) : !!value),
                            node,
                            options = {
                                index: index,
                                field: field,
                                label: model.fields[field],
                                value: value
                            };

                        node = $('<div>')
                            .attr('data-field', field)
                            .addClass(
                                'row ' +
                                'field' +
                                (isAlwaysVisible ? ' always' : '') +
                                (hasContent ? ' has-content' : '') +
                                (isRare ? ' rare' : '')
                            );

                        // call requires "draw" method
                        (draw[field] || drawDefault).call(node, options, baton.model, baton);

                        if (baton.model.get('folder_id') === 6 && field === 'email1') {
                            node.find('input').prop('disabled', true);
                        }
                        if (id === 'userfields') {
                            this.append($('<div class="col-sm-6">').append(node));
                        } else {
                            this.append(node);
                        }

                    }
                });
            });
        });
        return ContactEditView;
    }

    var ContactEditView = createContactEdit('io.ox/contacts');

    return {
        ContactEditView: ContactEditView,
        protectedMethods: {
            createContactEdit: createContactEdit
        }
    };

});
