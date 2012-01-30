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
       'io.ox/contacts/api'], function (Model, util, api) {

    'use strict';

    var ContactModel = function (data) {
    };
    ContactModel.prototype = _.clone(Model.prototype);
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
