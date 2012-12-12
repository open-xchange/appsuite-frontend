/* REMOVE THIS AS SOON AS POSSIBLE:
 * This is a holder for all portal-related settings. These are supposed to be in each portal
 * plugin (where they belong), but it is not possible to put them there yet, because we cannot
 * ensure they are loaded at the proper time. Cisco and Vic are working on this right now.
 */
define('io.ox/settings/accounts/settings/extpoints', ['io.ox/core/extensions', 'gettext!io.ox/portal', 'less!io.ox/settings/style.css'], function (ext, gt) {
    'use strict';

    function generateGUID() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    /* * * * * * * *
     * REDDIT
     */
    ext.point('io.ox/portal/settings/add').extend({
        index: 100,
        id: 'settings-portal-reddit-add-action',
        description: gt('Reddit'),
        action: function (args) {
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs', 'less!plugins/portal/reddit/style.css'], function (settings, gt, dialogs) {
                var subreddits = settings.get('widgets/user'),
                    dialog = new dialogs.ModalDialog({
                        easyOut: true,
                        async: true
                    }),
                    $subreddit = $('<input>').attr({type: 'text', id: 'add_subreddit', placeholder: 'r/'}),
                    $mode = $('<select>').append(
                        $('<option>').attr('value', 'hot').text(gt('hot')),
                        $('<option>').attr('value', 'new').text(gt('new'))
                    ),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a Subreddit')))
                    .append($subreddit)
                    .append($mode)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    $error.hide();

                    var subreddit = String($.trim($subreddit.val())),
                        deferred = $.Deferred();

                    // No dot and url does not end with tumblr.com? Append it!
                    if (subreddit.match(/^r\//)) {
                        subreddit = subreddit.substring(2);
                    }

                    // TODO Check if mode is OK
                    if (subreddit.length === 0) {
                        $error.text(gt('Please enter a subreddit.'));
                        deferred.reject();
                    } else {
                        $.ajax({
                            url: 'http://www.reddit.com/r/' + subreddit + '/.json?jsonp=testcallback',
                            type: 'HEAD',
                            dataType: 'jsonp',
                            jsonp: false,
                            jsonpCallback: 'testcallback',
                            success: function () {
                                deferred.resolve();
                            },
                            error: function () {
                                $error.text(gt('Unknown error while checking subreddit.'));
                                deferred.reject();
                            }
                        });
                    }

                    deferred.done(function () {
                        subreddits.push({subreddit: subreddit, mode: $mode.val()});
                        settings.set('subreddits', subreddits);
                        settings.save();

                        var extId = 'reddit-' + subreddit.replace(/[^a-z0-9]/g, '_') + '-' + $mode.val();
                        ext.point("io.ox/portal/widget").enable(extId);

                        require(['plugins/portal/reddit/register'], function (reddit) {
                            reddit.reload();
                            that.trigger('redraw');
                            ox.trigger("refresh^");
                            dialog.close();
                        });
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            });
        }
    });
    ext.point('io.ox/portal/settings/detail/reddit').extend({
        index: 100,
        id: 'portal-settings-reddit',
        draw: function (data) {
            var that = this;
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs', 'less!plugins/portal/reddit/style.css'], function (settings, gt, dialogs) {
                var subreddits = settings.get('subreddits'),
                staticStrings = {
                    SUBREDDITS: gt('Subreddits'),
                    ADD:        gt('Add'),
                    EDIT:       gt('Edit'),
                    DELETE:     gt('Delete')
                },
                SubredditSelectView = Backbone.View.extend({
                    _modelBinder: undefined,
                    initialize: function (options) {
                        this._modelBinder = new Backbone.ModelBinder();
                    },
                    render: function () {
                        var self = this;
                        self.$el.empty().append(
                            $('<div class="io-ox-settings-item io-ox-reddit-setting">')
                            .data({subreddit: this.model.get('subreddit'), mode: this.model.get('mode'), key: data.key}).append(
                                $('<div class="io-ox-setting-description">').append(
                                    $('<span data-property="subreddit" class="io-ox-reddit-name">'),
                                    $('<span data-property="mode" class="io-ox-reddit-mode">')
                                ),
                                $('<i class="action-edit icon-edit">'),
                                $('<i class="action-remove icon-remove">')
                            )
                        );

                        var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                        self._modelBinder.bind(self.model, self.el, defaultBindings);

                        return self;
                    },
                    events: {
                        'click .io-ox-reddit-setting .action-edit': 'onEdit'
                    },
                    onEdit: function (pEvent) {
                        var dialog = new dialogs.ModalDialog({
                            easyOut: true,
                            async: true
                        });

                        var oldSubreddit = $(pEvent.target).parent(),
                            oldMode = oldSubreddit.data('mode'),
                            oldName = oldSubreddit.data('subreddit');

                        if (oldSubreddit) {
                            oldSubreddit = String(oldSubreddit);
                            var $subreddit = $('<input>').attr({type: 'text', id: 'add_subreddit', placeholder: 'r/'}).val(oldName),
                                $error = $('<div>').addClass('alert alert-error').hide(),
                                that = this;

                            var $mode = $('<select>')
                                .append($('<option>').attr('value', 'hot').text(gt('hot')))
                                .append($('<option>').attr('value', 'new').text(gt('new')));

                            $mode.find('[value=' + oldMode + ']').attr({selected: 'selected'});

                            dialog.header($("<h4>").text(gt('Edit a Subreddit')))
                                .append($subreddit)
                                .append($mode)
                                .append($error)
                                .addButton('cancel', gt('Cancel'))
                                .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                                .show();

                            dialog.on('edit', function (e) {
                                $error.hide();

                                var newName = $.trim($subreddit.val()),
                                    newMode = $.trim($mode.val()),
                                    deferred = $.Deferred();

                                // No dot and url does not end with tumblr.com? Append it!
                                if (newName.match(/^r\//)) {
                                    newName = newName.substring(2);
                                }

                                // TODO Check if mode is OK

                                if (newName.length === 0) {
                                    $error.text(gt('Please enter a subreddit.'));
                                    deferred.reject();
                                } else {
                                    $.ajax({
                                        url: 'http://www.reddit.com/r/' + newName + '/.json?jsonp=testcallback',
                                        type: 'HEAD',
                                        dataType: 'jsonp',
                                        jsonp: false,
                                        jsonpCallback: 'testcallback',
                                        success: function () {
                                            deferred.resolve();
                                        },
                                        error: function () {
                                            $error.text(gt('Unknown error while checking subreddit.'));
                                            deferred.reject();
                                        }
                                    });
                                }

                                deferred.done(function () {
                                    ext.point("io.ox/portal/widget").disable('reddit-' + oldName.replace(/[^a-z0-9]/g, '_') + '-' + oldMode.replace(/[^a-z0-9]/g, '_'));

                                    subreddits = removeSubReddit(subreddits, oldName, oldMode);

                                    subreddits.push({subreddit: newName, mode: newMode});
                                    settings.set('subreddits', subreddits);
                                    settings.save();

                                    ext.point("io.ox/portal/widget").enable('reddit-' + newName.replace(/[^a-z0-9]/g, '_') + '-' + newMode.replace(/[^a-z0-9]/g, '_'));

                                    require(['plugins/portal/reddit/register'], function (reddit) {
                                        reddit.reload();
                                        that.trigger('redraw');
                                        ox.trigger("refresh^");
                                        dialog.close();
                                    });
                                });

                                deferred.fail(function () {
                                    $error.show();
                                    dialog.idle();
                                });
                            });
                        }
                    }
                });

                var removeSubReddit = function (subreddits, subreddit, mode) {
                    var newSubreddits = [];
                    _.each(subreddits, function (sub) {
                        if (sub.subreddit !== subreddit || sub.subreddit === subreddit && sub.mode !== mode) {
                            newSubreddits.push(sub);
                        }
                    });
                    return newSubreddits;
                };

                (new Backbone.Collection(subreddits)).each(function (item) {
                    $(that).append(new SubredditSelectView({model: item}).render().el);
                });

            }); //END: require
        } //END: draw
    });




    /* * * * * *
     * TUMBLR
     */
    ext.point('io.ox/portal/settings/add').extend({
        index: 200,
        id: 'settings-portal-tumblr-add-action',
        description: gt('Tumblr'),
        action: function (args) {
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs'], function (settings, gt, dialogs) {
                var dialog = new dialogs.ModalDialog({
                        easyOut: true,
                        async: true
                    }),
                    $url = $('<input>').attr({type: 'text', placeholder: '.tumblr.com'}),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a Tumblr feed')))
                    .append($url)
                    .append($description)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    $error.hide();

                    var url = $.trim($url.val()),
                        description = $.trim($description.val()),
                        deferred = $.Deferred();

                    // No dot and url does not end with tumblr.com? Append it!
                    if (url.indexOf('.') === -1 && !url.match(/\.tumblr\.com$/)) {
                        url = url + '.tumblr.com';
                    }
                    if (url.match(/http:\/\//)) {
                        url = url.substring('http://'.length);
                    }

                    if (url.length === 0) {
                        $error.text(gt('Please enter an blog url.'));
                        deferred.reject();
                    } else if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        $.ajax({
                            url: 'https://api.tumblr.com/v2/blog/' + url + '/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=&jsonp=testcallback',
                            type: 'HEAD',
                            dataType: 'jsonp',
                            jsonp: false,
                            jsonpCallback: 'testcallback',
                            success: function (data) {
                                if (data.meta && data.meta.status && data.meta.status === 200) {
                                    deferred.resolve();
                                } else {
                                    $error.text(gt('Unknown error while checking tumblr-blog.'));
                                    deferred.reject();
                                }
                            },
                            error: function () {
                                $error.text(gt('Unknown error while checking tumblr-blog.'));
                                deferred.reject();
                            }
                        });
                    }

                    deferred.done(function () {
                        var guid = 'tumblr_' + generateGUID(),
                            newTumblr = {
                                plugin: 'plugins/portal/tumblr/register',
                                color: 'orange',
                                index: 'first',
                                props: {
                                    url: url,
                                    description: description
                                }
                            };
                        settings.set('widgets/user/' + guid, newTumblr);
                        settings.save();

                        var extId = 'tumblr-' + url.replace(/[^a-zA-Z0-9]/g, '_');
                        ext.point("io.ox/portal/widget").enable(extId);

                        require(['plugins/portal/tumblr/register'], function (tumblr) {
                            ox.trigger("refresh^");
                            dialog.close();
                        });
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            });
        }
    });

    ext.point('io.ox/portal/settings/detail/tumblr').extend({
        index: 200,
        id: 'portal-settings-tumblr',
        draw : function (data) {
            var that = this;
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs'], function (settings, gt, dialogs) {
                var staticStrings = {
                    TUMBLRBLOGS: gt('Tumblr blogs'),
                    ADD:         gt('Add'),
                    EDIT:        gt('Edit'),
                    DELETE:      gt('Delete')
                },
                BlogSelectView = Backbone.View.extend({
                    _modelBinder: undefined,
                    initialize: function (options) {
                        this._modelBinder = new Backbone.ModelBinder();
                    },
                    render: function () {
                        var self = this,
                            url = data.props.url,
                            key = data.key,
                            description = data.props.description || data.key;
                        self.$el.empty().append(
                            $('<div class="io-ox-tumblr-setting io-ox-settings-item">')
                            .attr({'data-url': url,  'data-description': description, 'data-key': key, id: url}).append(
                                $('<span class="io-ox-setting-description">').text(description),
                                $('<i>').attr({'class': 'action-edit icon-edit', 'data-action': 'edit-feed', title: staticStrings.EDIT_FEED})
                            )
                        );
                        return self;
                    },
                    events: {
                        'click .io-ox-tumblr-setting .action-edit': 'onEdit'
                    },
                    onEdit: function (pEvent) {
                        var dialog = new dialogs.ModalDialog({
                            easyOut: true,
                            async: true
                        });
                        var $myNode = $(pEvent.target).parent(),
                            oldUrl = $myNode.data('url'),
                            oldDescription = $myNode.data('description'),
                            key = $myNode.data('key');

                        if (oldUrl) {
                            var $url = $('<input>').attr({type: 'text', placeholder: '.tumblr.com'}).val(oldUrl),
                            $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}).val(oldDescription),
                            $error = $('<div>').addClass('alert alert-error').hide(),
                            that = this;

                            dialog.header($("<h4>").text(gt('Edit a blog')))
                            .append($url)
                            .append($description)
                            .append($error)
                            .addButton('cancel', gt('Cancel'))
                            .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                            .show();

                            dialog.on('edit', function (e) {
                                $error.hide();

                                var url = $.trim($url.val()),
                                description = $.trim($description.val()),
                                deferred = $.Deferred();

                                // No dot and url does not end with tumblr.com? Append it!
                                if (url.indexOf('.') === -1 && !url.match(/\.tumblr\.com$/)) {
                                    url = url + '.tumblr.com';
                                }
                                if (url.match(/http:\/\//)) {
                                    url = url.substring('http://'.length);
                                }

                                if (url.length === 0) {
                                    $error.text(gt('Please enter an blog url.'));
                                    deferred.reject();
                                } else if (description.length === 0) {
                                    $error.text(gt('Please enter a description.'));
                                    deferred.reject();
                                } else {
                                    $.ajax({
                                        url: 'https://api.tumblr.com/v2/blog/' + url + '/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=&jsonp=testcallback',
                                        type: 'HEAD',
                                        dataType: 'jsonp',
                                        jsonp: false,
                                        jsonpCallback: 'testcallback',
                                        success: function (data) {
                                            if (data.meta && data.meta.status && data.meta.status === 200) {
                                                $myNode.data({url: url, description: description});
                                                deferred.resolve();
                                            } else {
                                                $error.text(gt('Unknown error while checking tumblr blog.'));
                                                deferred.reject();
                                            }
                                        },
                                        error: function () {
                                            $error.text(gt('Unknown error while checking tumblr blog.'));
                                            deferred.reject();
                                        }
                                    });
                                }

                                deferred.done(function () {
                                    ext.point("io.ox/portal/widget").disable('tumblr-' + oldUrl.replace(/[^a-zA-Z0-9]/g, '_'));

                                    settings.set('widgets/user/' + key + '/props/url', url);
                                    settings.set('widgets/user/' + key + '/props/description', description);
                                    settings.save();

                                    ext.point("io.ox/portal/widget").enable('tumblr-' + url.replace(/[^a-zA-Z0-9]/g, '_'));

                                    dialog.close();
                                });

                                deferred.fail(function () {
                                    $error.show();
                                    dialog.idle();
                                });
                            });
                        }
                    }
                });

                $(that).append(new BlogSelectView().render().el);
            }); //END: require
        } //END: draw
    }); //END: extend



    /* * * * * *
     * FLICKR
     */
    ext.point('io.ox/portal/settings/add').extend({
        index: 300,
        id: 'settings-portal-flickr-add-action',
        description: gt('Flickr'),
        action: function (args) {
            var getFlickrNsid = function (username, $error) { //TODO: Duplicate. Refactor once this has moved to plugin
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
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs'], function (settings, gt, dialogs) {
                var dialog = new dialogs.ModalDialog({
                        easyOut: true,
                        async: true
                    }),
                    $q = $('<input>').attr({type: 'text', placeholder: gt('Search')}),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $method = $('<select>').append(
                        $('<option>').attr('value', 'flickr.photos.search').text(gt('flickr.photos.search')),
                        $('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('flickr.people.getPublicPhotos'))
                    );

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
                            var newStream = {
                                plugin: 'plugins/portal/flickr/register',
                                color: 'pink', //TODO
                                index: 6, //TODO
                                props: {
                                    method: method,
                                    query: q,
                                    description: description
                                }
                            };
                            if (nsid) {
                                newStream.props.nsid = nsid;
                            }

                            settings.set('widgets/user/flickr_' +  generateGUID, newStream);
                            settings.save();

                            var extId = 'flickr-' + q.replace(/[^a-z0-9]/g, '_') + '-' + method.replace(/[^a-z0-9]/g, '_');
                            ext.point("io.ox/portal/widget").enable(extId);

                            require(['plugins/portal/flickr/register'], function (flickr) {
                                flickr.reload();
                                dialog.close();
                                //TODO refresh
                            });
                        }
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            });
        }
    });

    ext.point('io.ox/portal/settings/detail/flickr').extend({
        index: 300,
        id: 'portal-settings-flickr',
        draw : function (data) {
            var that = this;
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs'], function (settings, gt, dialogs) {
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

                var staticStrings = {
                        STREAMS:    gt('Flickr streams'),
                        ADD:        gt('Add'),
                        EDIT:       gt('Edit'),
                        DELETE:     gt('Delete')
                    },

                    StreamSelectView = Backbone.View.extend({
                        _modelBinder: undefined,
                        initialize: function (options) {
                            this._modelBinder = new Backbone.ModelBinder();
                        },
                        render: function () {
                            var self = this,
                                key = data.key,
                                description = data.props.description || data.key,
                                method = data.props.method,
                                query = data.props.query;

                            self.$el.empty().append(
                                $('<div class="io-ox-portal-flickr-setting io-ox-settings-item">')
                                .data({query: query, method: method, description: description, key: key}).append(
                                    $('<span class="io-ox-setting-description">').text(description),
                                    $('<i class="icon-edit action-edit">')
                                )
                            );

                            return self;
                        },
                        events: {
                            'click .io-ox-portal-flickr-setting .icon-edit': 'onEdit'
                        },
                        onEdit: function (pEvent) {
                            var dialog = new dialogs.ModalDialog({
                                easyOut: true,
                                async: true
                            }),
                                $myNode = $(pEvent.target).parent(),
                                oldQ = $myNode.data('query'),
                                oldMethod = $myNode.data('method'),
                                oldDescription = $myNode.data('description'),
                                key = $myNode.data('key');

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
                                            $error.text(gt('Please enter a search query.'));
                                            $error.show();
                                            dialog.idle();
                                        } else if (description.length === 0) {
                                            $error.text(gt('Please enter a description.'));
                                            $error.show();
                                            dialog.idle();
                                        } else {
                                            ext.point("io.ox/portal/widget").disable('flickr-' + oldQ.replace(/[^a-z0-9]/g, '_') + '-' + oldMethod.replace(/[^a-z0-9]/g, '_'));

                                            var path = 'widgets/user/' + key + '/props/';
                                            settings.set(path + 'query', q);
                                            settings.set(path + 'method', method);
                                            settings.set(path + 'description', description);

                                            if (nsid) {
                                                settings.set(path + 'nsid', nsid);
                                            }

                                            settings.save();

                                            ext.point("io.ox/portal/widget").enable('flickr-' + q.replace(/[^a-z0-9]/g, '_') + '-' + method.replace(/[^a-z0-9]/g, '_'));

                                            dialog.close();
                                            //TODO refresh
                                        }
                                    });

                                    deferred.fail(function () {
                                        $error.show();
                                        dialog.idle();
                                    });
                                });
                            }
                        }
                    });

                $(that).append(new StreamSelectView().render().el);

            }); //END: require
        } //END: draw
    }); //END: extend


    /* * * * * *
     * RSS
     */
    ext.point('io.ox/portal/settings/add').extend({
        index: 400,
        id: 'settings-portal-rss-add-action',
        description: gt('RSS'),
        action: function (args) {
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs', 'io.ox/core/strings'], function (settings, gt, dialogs, strings) {
                var feedgroups = _(settings.get('widgets/user')).chain().map(function (elem, key) { return {key: key, data: elem}; }).filter(function (elem) { return elem.data.plugin === 'plugins/portal/rss/register'; }).value(),
                    feedgroupSelect =  function () {
                        var $select = $('<select>');

                        _(feedgroups).each(function (feedgroup, index) {
                            var $option = $('<option>').text(feedgroup.data.description).attr('value', index);
                            $select.append($option);
                        });

                        $select.append($('<option>').attr({value: 'Default group'}).text('Default group'));

                        return $select;
                    };
                var dialog = new dialogs.ModalDialog({ easyOut: true, async: true }),
                    $url = $('<input>').attr({type: 'text', placeholder: gt('http://')}),
                    $group = feedgroupSelect(),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a feed')))
                    .append($url)
                    .append($group)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    var url = $.trim($url.val()),
                        index = $.trim($group.val()),
                        deferred = $.Deferred();

                    $error.hide();

                    if (url.length === 0) {
                        $error.text(gt('Please enter a feed url.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of feed
                        deferred.resolve();
                    }

                    deferred.done(function () { //TODO
                        var selectedGroup = feedgroups[index];
                        selectedGroup.data.props.url.push(url);

                        settings.set('widgets/user/' + selectedGroup.key, selectedGroup.data);
                        settings.save();

                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            });
        }
    });

    ext.point('io.ox/portal/settings/add').extend({
        index: 410,
        id: 'settings-portal-rss-addgroup-action',
        description: gt('RSS group'),
        action: function (args) {
            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs', 'io.ox/core/strings'], function (settings, gt, dialogs, strings) {
                var dialog = new dialogs.ModalDialog({ easyOut: true, async: true }),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a new group for your feeds')))
                    .append($description)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    var description = $.trim($description.val()),
                        deferred = $.Deferred();

                    $error.hide();

                    if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of group name
                        deferred.resolve();
                    }

                    deferred.done(function () { //TODO
                        settings.set('widgets/user/rss_' + generateGUID(), {
                            plugin: 'plugins/portal/rss/register',
                            color: 'lightblue', //TODO
                            index: 'first',
                            description: description,
                            props: {
                                url: []
                            }
                        });
                        settings.save();

                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            });
        }
    });

    ext.point('io.ox/portal/settings/detail/rss').extend({
        index: 400,
        id: 'portal-settings-rss',
        draw : function (data) {
            var that = this,
                key = data.key;

            require(['settings!io.ox/portal', 'gettext!io.ox/portal', 'io.ox/core/tk/dialogs', 'io.ox/core/strings'], function (settings, gt, dialogs, strings) {
                var staticStrings = {
                        RSS: gt('RSS'),
                        ADD_FEED: gt('Add feed'),
                        EDIT_FEED: gt('Edit feed'),
                        DELETE_FEED: gt('Delete feed')
                    };
                var FeedGroupView = Backbone.View.extend({
                        render: function () {
                            console.log("MYDATA2:", data);
                            var self = this,
                                feeds = data.props.url;

                            self.$el.empty().append(
                                $('<div class="io-ox-portal-rss-settings-members">').data('feeds', feeds).append(_(feeds).map(function (url) {
                                    return $('<div class="io-ox-portal-rss-settings-member io-ox-settings-item">')
                                    .data({url: url, key: key})
                                    .append(
                                        $('<span class="io-ox-setting-title io-ox-setting-description">').text(strings.shortenUri(url, 30)),
                                        $('<i>').attr({'class': 'icon-edit action-edit', 'data-action': 'edit-feed', title: staticStrings.EDIT_FEED}),
                                        $('<i>').attr({'class': 'icon-remove action-remove', 'data-action': 'del-feed', title: staticStrings.DELETE_FEED})
                                    );
                                }))
                            );

                            return self;
                        },
                        events: {
                            'click [data-action="edit-feed"]': 'onEditFeed',
                            'click [data-action="del-feed"]': 'onDeleteFeed'
                        },

                        onEditFeed: function (pEvent) {
                            var dialog = new dialogs.ModalDialog({easyOut: true, async: true }),
                                $changed = $(pEvent.target).parent(),
                                oldUrl = $changed.data('url'),
                                urls = $changed.parent().data('feeds');

                            if (!oldUrl || !urls) {
                                console.log("Missing either url to delete or all urls", oldUrl, urls);
                                return;
                            }
                            var $url = $('<input>').css({width: '95%'}).attr({type: 'text'}).val(oldUrl),
                                $error = $('<div>').addClass('alert alert-error').hide(),
                                that = this;

                            dialog.header($("<h4>").text(gt('Edit a feed')))
                                .append($url)
                                .append($error)
                                .addButton('cancel', gt('Cancel'))
                                .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                                .show();

                            dialog.on('edit', function (e) {
                                $error.hide();

                                var url = $.trim($url.val()),
                                    deferred = $.Deferred();

                                if (url.length === 0) {
                                    $error.text(gt('Please enter a feed url.'));
                                    deferred.reject();
                                } else {
                                    //TODO add test for existence of feed
                                    deferred.resolve();
                                }

                                deferred.done(function () {
                                    var urls = [url];

                                    settings.set('widgets/user/' + key + '/props/url', urls);
                                    settings.save();

                                    dialog.close();
                                });

                                deferred.fail(function () {
                                    $error.show();
                                    dialog.idle();
                                });
                            });
                        },

                        onDeleteFeed: function (pEvent) {
                            var dialog = new dialogs.ModalDialog({
                                easyOut: true
                            });
                            var deleteme = $(pEvent.target).parent(),
                                urls = deleteme.parent().data('feeds'),
                                url = deleteme.data('url');
                            console.log("DELETEME", urls, deleteme.data());
                            if (!url) {
                                return;
                            }
                            var that = this;

                            dialog.header($("<h4>").text(gt('Delete a feed')))
                                .append($('<span>').text(gt('Do you really want to delete the following feed?')))
                                .append($('<ul>').append($('<li>').text(url)))
                                .addButton('cancel', gt('Cancel'))
                                .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                                .show()
                                .done(function (action) {
                                    if (action === 'delete') {
                                        settings.set('widgets/user/' + key + '/props/url', _(urls).difference(url));
                                        settings.save();

                                        dialog.close();
                                    }
                                    return false;
                                });
                        }
                    });

                $(that).append(new FeedGroupView().render().el);

            }); //END: require
        } //END: draw
    }); //END: extend
});