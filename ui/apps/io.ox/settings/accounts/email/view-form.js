/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/settings/accounts/email/view-form',
    ['io.ox/core/tk/view',
     'text!io.ox/settings/accounts/email/tpl/account_detail.html'
    ], function (View, tmpl) {

    'use strict';

    var AccountDetailView = Backbone.View.extend({
        tagName: "div",
        _modelBinder: undefined,
        initialize: function (options) {
            // create template
            this.template = doT.template(tmpl);
            this._modelBinder = new Backbone.ModelBinder();

            Backbone.Validation.bind(this, {selector: 'data-property'});
        },
        render: function () {
            var self = this;
            window.account = self.model;
            self.$el.empty().append(self.template({}));
            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            self._modelBinder.bind(self.model, self.el, defaultBindings);

            return self;
        },
        events: {
            'click .save': 'onSave'
        },
        onSave: function () {
            var self = this,
                deferedSave = $.Deferred();
            this.model.save(false, deferedSave);
            deferedSave.done(function (data) {
                self.dialog.close();
                if (self.collection) {
                    self.collection.add([data]);
                }
                if (self.model.isNew()) {
                    self.succes();
                }
            });
        }
    });


    return AccountDetailView;
});