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
      ['io.ox/core/tk/model',
       'io.ox/contacts/util',
       'io.ox/contacts/api',
       'gettext!io.ox/contacts/contacts'], function (Model, util, api, gt) {

    'use strict';


    var types = {
        string: function (val, fieldDesc, model) {
            return "ERROR: '" + fieldDesc.title + "' (" + val + ")" + " should be a string"; //if its false
        },
        pastDate: function (val, fieldDesc, model) {
            return true;
        }
    };


    var contactSchema = {
        schema: 'http://ox.io/Contact',
        id: 'http://ox.io/Contact',
        type: 'object',

        properties: {
            'display_name': { id: 500, title: gt('Display name'), validator: types.string},
            'first_name': { id: 501, title: gt('Given name'), validator: types.string, mandatory: true},
            'last_name': { id: 502, title: gt('Sur name'), validator: types.string},
            'second_name': { id: 503, title: gt('Middle name'), validator: types.string},
            'suffix': { id: 504, title: gt('Suffix'), validator: types.string},
            'title': {id: 505, title: gt('Title'), validator: types.string},
            'street_home': {id: 506, title: gt('Street Home'), validator: types.string, mandatory: true},
            'postal_code_home': {id: 507, title: gt('Postal code home'), validator: types.string},
            'city_home': {id: 508, title: gt('City home'), validator: types.string},
            'state_home': {id: 509, title: gt('State home'), validator: types.string},
            'country_home': {id: 510, title: gt('Country home'), validator: types.string},
            'birthday': {id: 511, title: gt('Birthday'), validator: types.pastDate}
        }
    };




    var ContactModel = function (data) {
    };
    ContactModel.prototype = Model.prototype;

    ContactModel.prototype.schema = contactSchema;
    ContactModel.prototype.displaynameChange =  /^(first_name|last_name|title)$/;
    ContactModel.prototype.jobDescriptionChange = /^(company|position|profession)$/;
    ContactModel.prototype.set = function (key, value) {
        this.dirty = true;
        this.data[key] = value;
        if (this.displaynameChange.test(key)) {
            this.data.display_name = util.getFullName(this.data);
            $(this).trigger('display_name.changed', this.data.display_name);
        }

        // just to fire an update event for other listeners than the view itself
        if (this.jobDescriptionChange.test(key)) {
            $(this).trigger('jobdescription.calculated.changed', util.getJob(this.data));
        }
        this.data[key] = value;
        $(this).trigger(key + '.changed', value);


        this.validateField(key);

    };
    ContactModel.prototype.validateField = function (key) {
        var val = this.get(key),
            fieldDesc = this.schema.properties[key];

        console.log('validating: ' + key);
        if (fieldDesc && fieldDesc.validator && _.isFunction(fieldDesc.validator)) {
            var ret = fieldDesc.validator.apply(this, [val, fieldDesc, this.model]);
            if (ret !== true) {
                // then ret is description
                // and it was not validated
                var err = ret;
                $(this).trigger('validation.error', [err, fieldDesc]);
            }
        }
    };
    ContactModel.prototype.save = function () {
        var self = this,
            df = new $.Deferred();
        if (!self.isDirty()) {
            return df.resolve();
        }
        var image = $('#contactUploadImage').find("input[type=file]").get(0);
        if (image.files && image.files[0]) {
            this.data.folderId = this.data.folder_id;
            this.data.timestamp = _.now();
            api.editNewImage(JSON.stringify(this.data), image.files[0])
            .done(function () {
                self.dirty = false;
                df.resolve();
            });

        } else {
            api.edit({
                id: this.data.id,
                folder: this.data.folder_id,
                timestamp: _.now(),
                data: this.data
            }).done(function () {
                self.dirty = false;
                df.resolve();
            });
        }
        return df;
    };

    return ContactModel;
});
