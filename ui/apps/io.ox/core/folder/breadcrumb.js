/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/breadcrumb',
    ['io.ox/core/folder/api',
     'io.ox/core/folder/title',
     'gettext!io.ox/core'], function (api, getFolderTitle, gt) {

    'use strict';

    /**
     * Create a Breadcrum widget for a given folder.
     *
     * This widget can be customized in different ways. You can pass an options parameter
     * containing an object with these attributes:
     *
     * @param {string} - folder id
     * @param {object} - options:
     * {
     *     exclude: {Array} - An array of folder IDs that are ignored and won't appear in the breadcrumb
     *     leaf: {DOMnode} - An extra node that is appended as last crumb
     *     last: {boolean} - true: last item should have the active class set (default)
     *                     - no relevance if subfolder option is set to true and element is 'clickable' (*)
     *                     - false: same as true if element is 'clickable' (*)
     *                     - false: a link that reacts to the function assigned to the handler option
     *     handler: {function} - a handler function, called with the id of the folder as parameter
     *     module: {string} - provide a module to limit 'clickable' attribute (*) to a specific module
     *     subfolder: {boolean} - show all subfolders of the folder as a dropdown if element is 'clickable' (*)
     *                          - default: true
     * }
     * (*) - element is defined to be clickable, if a few conditions are met:
     *         - module option equals the folder module or module option is undefined
     *         - handler function is defined
     *
     * @return {Node} - an ul element that contains the list (populated later, after path is loaded via the API (async))
     */

    var dropdown = function (li, id, title, options) {
        _.defer(function () {
            api.list(id).done(function (list) {
                if (list.length) {
                    li.addClass('dropdown').append(
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">')
                        .attr(
                            'title', title
                        ).append(
                            $.txt(gt.noI18n(getFolderTitle(title, 30))),
                            $('<b class="caret">')
                        ),
                        $('<ul class="dropdown-menu">')
                        .attr({
                            'role': 'menu',
                            'aria-haspopup': 'true',
                            'aria-label': gt.format(gt('subfolders of %s'), gt.noI18n(getFolderTitle(title, 30)))
                        }).append(
                            _(list).map(function (folder) {
                                var $a, $li = $('<li>').append(
                                    $a = $('<a href="#" tabindex="1" role="menuitem">')
                                    .attr({'data-folder-id': folder.id}).text(gt.noI18n(getFolderTitle(folder.title, 30)))
                                );
                                /**
                                 * special mobile handling due to on-the-fly bootstrap-dropdown mod on mobile
                                 *
                                 * on mobile devices the dropdowns are moved around in the down
                                 * causing the click delegate to break which is defined on the "breadcrump" element
                                 * Therfore we need to bind the handler on each dropdown href for mobile as the
                                 * handlers will stay alive after append the whole dropdown to a new
                                 * root node in the DOM.
                                 */
                                if (_.device('smartphone')) {
                                    $a.on('click', function (e) {
                                        e.preventDefault();
                                        var id = $(this).attr('data-folder-id');
                                        if (id !== undefined) {
                                            _.call(options.handler, id, $(this).data());
                                        }
                                    });
                                }
                                return $li;
                            })
                        )
                    );
                } else {
                    li.addClass('active').text(gt.noI18n(title));
                }
            });
        });
    };

    var add = function (folder, i, list, options) {

        var li = $('<li>'), elem, isLast = i === list.length - 1,
            properModule = options.module === undefined || folder.module === options.module,
            clickable = properModule && options.handler !== undefined,
            displayTitle = gt.noI18n(getFolderTitle(folder.title, 30));

        if (isLast && options.subfolder && clickable) {
            dropdown(elem = li, folder.id, folder.title, options);
        } else if (isLast && options.last) {
            elem = li.addClass('active').text(displayTitle);
        } else {
            if (!clickable) {
                elem = li.addClass('active').text(displayTitle);
            } else {
                li.append(elem = $('<a href="#" tabindex="1" role="menuitem">').attr('title', folder.title).text(displayTitle));
            }
        }

        elem.attr('data-folder-id', folder.id).data(folder);
        this.append(li);
    };

    var draw = function (list, ul, options) {
        var exclude = _(options.exclude);
        _(list).each(function (o, i, list) {
            if (!exclude.contains(o.id)) {
                add.call(ul, o, i, list, options);
            }
        });
        ul = null;
    };

    return function getBreadcrumb(id, options) {
        var ul;
        options = _.extend({ subfolder: true, last: true, exclude: [] }, options);
        try {
            ul = $('<ul class="breadcrumb">')
                .attr({
                    'role': 'menubar'
                })
                .on('click', 'a', function (e) {
                    e.preventDefault();
                    var id = $(this).attr('data-folder-id');
                    if (id !== undefined) {
                        _.call(options.handler, id, $(this).data());
                    }
                });
            if (options.prefix) {
                ul.append($('<li class="prefix">').append(
                    $.txt(options.prefix)
                ));
            }
            return ul;
        }
        finally {
            api.getPath(id).then(
                function success(list) {
                    draw(list, ul, options);
                },
                function fail() {
                    api.get(id).then(
                        function (folder) {
                            draw([folder], ul, options);
                        },
                        function () {
                            // cannot show breadcrumb, for example due to disabled GAB
                            ul.remove();
                            ul = null;
                        }
                    );
                }
            );
        }
    };
});
