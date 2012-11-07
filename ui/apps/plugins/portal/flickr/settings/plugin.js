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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/flickr/settings/plugin',
       ['io.ox/core/extensions',
        'io.ox/core/tk/dialogs',
        'text!plugins/portal/flickr/settings/tpl/stream.html',
        'text!plugins/portal/flickr/settings/tpl/pluginsettings.html',
        'settings!plugins/portal/flickr',
        'gettext!io.ox/portal'
        ], function (ext, dialogs, streamSelectTemplate, pluginSettingsTemplate, settings, gt) {

    'use strict';

    var getFlickrNsid = function (username, $error) {
        var callback = 'getFlickerNsid';
        var myurl = 'https://www.flickr.com/services/rest/?api_key=7fcde3ae5ad6ecf2dfc1d3128f4ead81&format=json&method=flickr.people.findByUsername&username=' + username + '&jsoncallback=' + callback;

        var deferred = $.Deferred();

        $.ajax({
            url: myurl,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: callback,
            success: function (data) {
                if (data && data.stat && data.stat === 'ok') {
                    deferred.resolve(data.user.nsid);
                } else {
                    deferred.reject();
                    $error.text(gt('Cannot find user with given name.'));
                }
            },
            error: function () {
                deferred.reject();
                $error.text(gt('Cannot find user with given name.'));
            }
        });

        return deferred;
    };

    var streams = settings.get('streams'),
        staticStrings = {
            STREAMS:    gt('Streams'),
            ADD:        gt('Add'),
            EDIT:       gt('Edit'),
            DELETE:     gt('Delete')
        },

        StreamSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this.template = doT.template(streamSelectTemplate);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;

                self.$el.empty().append(self.template({
                    q: this.model.get('q'),
                    method: this.model.get('method'),
                    description: this.model.get('description'),
                    strings: staticStrings
                }));

                // Used by jquery ui sortable
                self.$el.attr('id', this.model.get('method') + '#' + this.model.get('q'));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .sortable-item': 'onSelect'
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.sortable-item').attr('selected', 'selected');
            }
        }),

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.template = doT.template(pluginSettingsTemplate);
            },
            render: function () {
                this.$el.empty().append(this.template({
                    strings: staticStrings
                }));

                var that = this;

                function redraw() {
                    var $listbox = that.$el.find('.listbox');
                    var collection = new Backbone.Collection(streams);
                    $listbox.empty();

                    collection.each(function (item) {
                        $listbox.append(new StreamSelectView({ model: item }).render().el);
                    });

                    if (collection.length === 0) {
                        $listbox.hide();
                    } else {
                        $listbox.show();
                    }

                    $listbox.sortable({
                        axis: 'y',
                        containment: 'parent',
                        update: function (event, ui) {
                            var newStreams = [];

                            _.each($(this).sortable('toArray'), function (value) {
                                var i = value.indexOf('#');
                                var method = value.substring(0, i),
                                    q = value.substring(i + 1);

                                var oldData = _.find(streams, function (stream) { return (stream.q === q && stream.method === method); });

                                if (oldData) {
                                    newStreams.push(oldData);
                                }
                            });
                            streams = newStreams;
                            settings.set('streams', streams);
                            settings.save();

                            ox.trigger("refresh^", [true]);
                        }
                    });
                }

                redraw();

                this.on('redraw', redraw);

                return this;
            },
            events: {
                'click [data-action="add"]': 'onAdd',
                'click [data-action="edit"]': 'onEdit',
                'click [data-action="del"]': 'onDelete'
            },

            onAdd: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true,
                    async: true
                });

                var $q = $('<input>').attr({type: 'text', placeholder: gt('Search')});
                var $description = $('<input>').attr({type: 'text', placeholder: gt('Description')});
                var $method = $('<select>')
                    .append($('<option>').attr('value', 'flickr.photos.search').text(gt('flickr.photos.search')))
                    .append($('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('flickr.people.getPublicPhotos')))
                    ;

                var $error = $('<div>').addClass('alert alert-error').hide();

                var that = this;

                dialog.header($("<h4>").text(gt('Add a stream')))
                    .append($q)
                    .append($description)
                    .append($method)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    $error.hide();

                    var q = String($.trim($q.val())),
                        method = $.trim($method.val()),
                        description = $.trim($description.val()),
                        deferred;

                    if (method === 'flickr.people.getPublicPhotos') {
                        deferred = getFlickrNsid(q, $error);
                    } else {
                        deferred = $.Deferred();
                        deferred.resolve();
                    }

                    deferred.done(function (nsid) {
                        if (q.length === 0) {
                            $error.text(gt('Please enter a search-query.'));
                            $error.show();
                            dialog.idle();
                        } else if (description.length === 0) {
                            $error.text(gt('Please enter a description.'));
                            $error.show();
                            dialog.idle();
                        } else {
                            var newStream = {q: q, method: method, description: description};

                            if (nsid) {
                                newStream.nsid = nsid;
                            }

                            streams.push(newStream);
                            settings.set('streams', streams);
                            settings.save();

                            var extId = 'flickr-' + q.replace(/[^a-z0-9]/g, '_') + '-' + method.replace(/[^a-z0-9]/g, '_');
                            ext.point("io.ox/portal/widget").enable(extId);

                            require(['plugins/portal/flickr/register'], function (flickr) {
                                flickr.reload();
                                that.trigger('redraw');
                                ox.trigger("refresh^");
                                dialog.close();
                            });
                        }
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },
            onEdit: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true,
                    async: true
                });

                var oldQ = this.$el.find('[selected]').data('q'),
                    oldMethod = this.$el.find('[selected]').data('method'),
                    oldDescription = this.$el.find('[selected]').data('description');

                if (oldQ && oldMethod) {
                    oldQ = String(oldQ);
                    var $q = $('<input>').attr({type: 'text', placeholder: gt('Search')}).val(oldQ);
                    var $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}).val(oldDescription);
                    var $method = $('<select>')
                        .append($('<option>').attr('value', 'flickr.photos.search').text(gt('flickr.photos.search')))
                        .append($('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('flickr.people.getPublicPhotos')))
                        .val(oldMethod);
                    var $error = $('<div>').addClass('alert alert-error').hide();

                    var that = this;

                    dialog.header($("<h4>").text(gt('Edit a stream')))
                        .append($q)
                        .append($description)
                        .append($method)
                        .append($error)
                        .addButton('cancel', gt('Cancel'))
                        .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                        .show();

                    dialog.on('edit', function (e) {
                        $error.hide();

                        var q = String($.trim($q.val())),
                            method = $.trim($method.val()),
                            description = $.trim($description.val()),
                            deferred;

                        if (method === 'flickr.people.getPublicPhotos') {
                            deferred = getFlickrNsid(q, $error);
                        } else {
                            deferred = $.Deferred();
                            deferred.resolve();
                        }

                        deferred.done(function (nsid) {
                            if (q.length === 0) {
                                $error.text(gt('Please enter a search-query.'));
                                $error.show();
                                dialog.idle();
                            } else if (description.length === 0) {
                                $error.text(gt('Please enter a description.'));
                                $error.show();
                                dialog.idle();
                            } else {
                                ext.point("io.ox/portal/widget").disable('flickr-' + oldQ.replace(/[^a-z0-9]/g, '_') + '-' + oldMethod.replace(/[^a-z0-9]/g, '_'));
                                streams = removeStream(streams, oldQ, oldMethod);

                                var newStream = {q: q, method: method, description: description};

                                if (nsid) {
                                    newStream.nsid = nsid;
                                }

                                streams.push(newStream);
                                settings.set('streams', streams);
                                settings.save();

                                ext.point("io.ox/portal/widget").enable('flickr-' + q.replace(/[^a-z0-9]/g, '_') + '-' + method.replace(/[^a-z0-9]/g, '_'));

                                require(['plugins/portal/flickr/register'], function (flickr) {
                                    flickr.reload();
                                    that.trigger('redraw');
                                    ox.trigger("refresh^");
                                    dialog.close();
                                });
                            }
                        });

                        deferred.fail(function () {
                            $error.show();
                            dialog.idle();
                        });
                    });
                }
            },
            onDelete: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });

                var q = this.$el.find('[selected]').data('q'),
                    method = this.$el.find('[selected]').data('method');

                if (q && method) {
                    q = String(q);
                    var that = this;

                    dialog.header($("<h4>").text(gt('Delete a stream')))
                        .append($('<span>').text(gt('Do you really want to delete the following stream(s)?')))
                        .append($('<ul>').append($('<li>').text(q + " (" + method + ")")))
                        .addButton('cancel', gt('Cancel'))
                        .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                var newStreams = [];
                                _.each(streams, function (sub) {
                                    if (sub.q !== q || sub.q === q && sub.method !== method) {
                                        newStreams.push(sub);
                                    }
                                });

                                streams = removeStream(streams, q, method);
                                settings.set('streams', streams);
                                settings.save();

                                var extId = 'flickr-' + q.replace(/[^a-z0-9]/g, '_') + '-' + method.replace(/[^a-z0-9]/g, '_');

                                ext.point("io.ox/portal/widget").disable(extId);

                                require(['plugins/portal/flickr/register'], function (flickr) {
                                    flickr.reload();
                                    that.trigger('redraw');
                                    ox.trigger("refresh^");
                                });
                            }
                            return false;
                        });
                }
            }
        }),

        removeStream = function (streams, q, method) {
            var newStreams = [];

            _.each(streams, function (sub) {
                if (sub.q !== q || sub.q === q && sub.method !== method) {
                    newStreams.push(sub);
                }
            });
            return newStreams;
        },

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});