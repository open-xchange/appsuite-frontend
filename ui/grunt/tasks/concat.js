/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

'use strict';

module.exports = function (grunt) {

    grunt.config.merge({
        concat: {
            bootjs: {
                options: {
                    banner: 'if (typeof dependencies === "undefined") dependencies = {};\n'
                },
                files: [
                    {
                        src: [
                            'node_modules/jquery/dist/jquery.js',
                            //'node_modules/jquery-migrate/dist/jquery-migrate.js',
                            'node_modules/@open-xchange/jquery-touch-events/src/jquery.mobile-events.min.js',
                            'node_modules/underscore/underscore.js', // load this before require.js to keep global object
                            'build/ox.js',
                            // add backbone and dot.js may be a AMD-variant would be better
                            'node_modules/backbone/backbone.js',
                            'node_modules/backbone-validation/dist/backbone-validation.js',
                            // load moment before require, because of anonymous define
                            'build/static/3rd.party/moment/moment.js',
                            'build/static/3rd.party/moment/moment-timezone-with-data.js',
                            'build/static/3rd.party/jwt-decode.js',
                            'node_modules/velocity-animate/velocity.min.js',
                            'src/util.js',
                            'node_modules/requirejs/require.js',
                            'src/require-fix.js',
                            'lib/modernizr.js',
                            'src/lazyload.js',
                            'src/browser.js',
                            'src/plugins.js',
                            'src/jquery.plugins.js',

                            'node_modules/blankshield/blankshield.js',
                            // add bootstrap JavaScript
                            'node_modules/bootstrap/js/transition.js',
                            'node_modules/bootstrap/js/alert.js',
                            'node_modules/bootstrap/js/button.js',
                            'node_modules/bootstrap/js/carousel.js',
                            'node_modules/bootstrap/js/collapse.js',
                            'node_modules/bootstrap/js/modal.js',
                            'node_modules/bootstrap/js/tooltip.js',
                            'node_modules/bootstrap/js/popover.js',
                            'node_modules/bootstrap/js/scrollspy.js',
                            'node_modules/bootstrap/js/tab.js',
                            'node_modules/bootstrap/js/affix.js',
                            // add custom bootstrap code
                            'apps/io.ox/core/tk/dropdown.js',
                            'lib/bootstrap-a11y.js',
                            // add mandatory UI sources
                            'apps/io.ox/core/http.js',
                            'apps/io.ox/core/http_errors.js',
                            'apps/io.ox/core/uuids.js',
                            'apps/io.ox/core/session.js',
                            'apps/io.ox/core/cache.js',
                            'apps/io.ox/core/extensions.js',
                            'apps/io.ox/core/manifests.js',
                            'apps/io.ox/core/capabilities.js',
                            'apps/io.ox/core/settings.js',
                            'apps/io.ox/core/gettext.js',
                            'apps/io.ox/core/event.js',
                            'apps/io.ox/core/locale/meta.js',
                            'apps/io.ox/core/locale.js',
                            'apps/io.ox/core/cache/indexeddb.js',
                            'apps/io.ox/core/cache/localstorage.js',
                            'apps/io.ox/core/cache/simple.js',
                            'apps/plugins/halo/register.js',
                            'apps/io.ox/core/settings/defaults.js',
                            'apps/io.ox/core/moment.js',
                            'apps/io.ox/core/viewer/main.js',
                            'apps/io.ox/core/main/icons.js',
                            'apps/io.ox/core/extPatterns/stage.js',
                            'apps/io.ox/core/sockets.js',
                            // missing for signin
                            'apps/io.ox/core/boot/config.js',
                            'apps/io.ox/core/boot/fixes.js',
                            'apps/io.ox/core/boot/form.js',
                            'apps/io.ox/core/boot/i18n.js',
                            'apps/io.ox/core/boot/locale.js',
                            'apps/io.ox/core/boot/rampup.js',
                            'apps/io.ox/core/boot/load.js',
                            'apps/io.ox/core/boot/util.js',
                            'apps/io.ox/core/boot/support.js',
                            'apps/io.ox/core/boot/login/auto.js',
                            'apps/io.ox/core/boot/login/openid.js',
                            'apps/io.ox/core/boot/login/saml.js',
                            'apps/io.ox/core/boot/login/standard.js',
                            'apps/io.ox/core/boot/login/tabSession.js',
                            'apps/io.ox/core/boot/login/token.js',
                            'apps/io.ox/core/boot/warning.js',
                            'apps/io.ox/core/boot/main.js',
                            'build/apps/io.ox/core/boot.en_US.js',
                            'build/apps/io.ox/core/boot.de_DE.js',
                            'src/boot.js'
                        ],
                        dest: 'build/boot.js',
                        nonull: true
                    }
                ]
            },
            strippedbootjs: {
                options: {
                    banner: 'if (typeof dependencies === "undefined") dependencies = {};\n'
                },
                files: [
                    {
                        src: [
                            'node_modules/jquery/dist/jquery.js',
                            //'node_modules/jquery-migrate/dist/jquery-migrate.js',
                            'node_modules/@open-xchange/jquery-touch-events/src/jquery.mobile-events.min.js',
                            'node_modules/underscore/underscore.js', // load this before require.js to keep global object
                            'build/ox.js',
                            // add backbone and dot.js may be a AMD-variant would be better
                            'node_modules/backbone/backbone.js',
                            'node_modules/backbone-validation/dist/backbone-validation.js',
                            // load moment before require, because of anonymous define
                            'build/static/3rd.party/moment/moment.js',
                            'build/static/3rd.party/moment/moment-timezone-with-data.js',
                            'node_modules/velocity-animate/velocity.min.js',
                            'src/util.js',
                            'node_modules/requirejs/require.js',
                            'src/require-fix.js',
                            'lib/modernizr.js',
                            'src/lazyload.js',
                            'src/browser.js',
                            'src/plugins.js',
                            'src/jquery.plugins.js',

                            'node_modules/blankshield/blankshield.js',
                            // add bootstrap JavaScript
                            'node_modules/bootstrap/js/transition.js',
                            'node_modules/bootstrap/js/alert.js',
                            'node_modules/bootstrap/js/button.js',
                            'node_modules/bootstrap/js/carousel.js',
                            'node_modules/bootstrap/js/collapse.js',
                            'node_modules/bootstrap/js/modal.js',
                            'node_modules/bootstrap/js/tooltip.js',
                            'node_modules/bootstrap/js/popover.js',
                            'node_modules/bootstrap/js/scrollspy.js',
                            'node_modules/bootstrap/js/tab.js',
                            'node_modules/bootstrap/js/affix.js',
                            // add custom bootstrap code
                            'apps/io.ox/core/tk/dropdown.js',
                            'lib/bootstrap-a11y.js',
                            // add mandatory UI sources
                            'apps/io.ox/core/http.js',
                            'apps/io.ox/core/http_errors.js',
                            'apps/io.ox/core/uuids.js',
                            'apps/io.ox/core/session.js',
                            'apps/io.ox/core/cache.js',
                            'apps/io.ox/core/extensions.js',
                            'apps/io.ox/core/manifests.js',
                            'apps/io.ox/core/capabilities.js',
                            'apps/io.ox/core/settings.js',
                            'apps/io.ox/core/gettext.js',
                            'apps/io.ox/core/event.js',
                            'apps/io.ox/core/cache/indexeddb.js',
                            'apps/io.ox/core/cache/localstorage.js',
                            'apps/io.ox/core/cache/simple.js',
                            'apps/plugins/halo/register.js',
                            'apps/io.ox/core/settings/defaults.js',
                            'apps/io.ox/core/moment.js',
                            'apps/io.ox/core/viewer/main.js',
                            'apps/io.ox/core/main/icons.js',
                            'apps/io.ox/core/extPatterns/stage.js',
                            'apps/io.ox/core/sockets.js',
                            // missing for signin
                            'apps/io.ox/core/boot/config.js',
                            'apps/io.ox/core/boot/fixes.js',
                            'apps/io.ox/core/boot/form.js',
                            'apps/io.ox/core/boot/i18n.js',
                            'apps/io.ox/core/boot/locale.js',
                            'apps/io.ox/core/boot/load.js',
                            'apps/io.ox/core/boot/util.js',
                            'apps/io.ox/core/boot/support.js',
                            'apps/io.ox/core/boot/login/auto.js',
                            'apps/io.ox/core/boot/login/openid.js',
                            'apps/io.ox/core/boot/login/standard.js',
                            'apps/io.ox/core/boot/login/token.js',
                            'apps/io.ox/core/boot/warning.js',
                            'build/apps/io.ox/core/boot.en_US.js',
                            'build/apps/io.ox/core/boot.de_DE.js'
                        ],
                        dest: 'build/boot-stripped.js',
                        nonull: true
                    }
                ]
            },
            precore: {
                options: {
                    banner: 'define(ox.base + "/precore.js", ["io.ox/core/boot/config", "io.ox/core/manifests"], function (config) {\n\n' +
                                '"use strict";\n\n' +
                                'var def = $.Deferred();\n' +
                                'if (!ox.session) {\n' +
                                '    ox.once("login:success", function () {\n' +
                                '        config.user().then(def.resolve, def.reject);\n' +
                                '    });\n' +
                                '} else {\n' +
                                '    config.user().then(def.resolve, def.reject);\n' +
                                '}\n' +
                                'def.then(function () {\n',
                    footer: '});\n});\n' // closing the precore definition and the resolve callback for def variable
                },
                files: [
                    {
                        src: [
                            // 2nd wave
                            'apps/io.ox/find/main.js',
                            'apps/io.ox/find/view-placeholder.js',
                            'apps/io.ox/core/desktop.js',
                            'apps/io.ox/core/api/apps.js',
                            'apps/io.ox/core/yell.js',
                            'apps/io.ox/core/notifications.js',
                            'apps/io.ox/core/commons.js',
                            'apps/io.ox/core/upsell.js',
                            'apps/io.ox/core/ping.js',
                            'apps/io.ox/core/relogin.js',
                            'apps/io.ox/core/uuids.js',
                            'apps/io.ox/core/tk/wizard.js',
                            'apps/io.ox/tours/get-started.js',
                            // 3rd wave
                            'apps/io.ox/core/adaptiveLoader.js',
                            'apps/io.ox/core/a11y.js',
                            'apps/io.ox/core/tk/dialogs.js',
                            'apps/io.ox/core/tk/draghelper.js',
                            // mobile stuff
                            'apps/io.ox/core/page-controller.js',
                            'apps/io.ox/core/toolbars-mobile.js',
                            // folder support
                            'apps/io.ox/core/folder/util.js',
                            'apps/io.ox/core/folder/sort.js',
                            'apps/io.ox/core/folder/blacklist.js',
                            'apps/io.ox/core/folder/title.js',
                            'apps/io.ox/core/folder/bitmask.js',
                            'apps/io.ox/core/folder/api.js',
                            'apps/io.ox/core/folder/node.js',
                            'apps/io.ox/core/folder/selection.js',
                            'apps/io.ox/core/folder/tree.js',
                            'apps/io.ox/core/folder/favorites.js',
                            'apps/io.ox/core/folder/view.js',
                            'apps/io.ox/core/folder/extensions.js',
                            // defaults
                            'apps/io.ox/core/settings/defaults.js',
                            'apps/io.ox/core/settingOptions/settings/defaults.js',
                            'apps/io.ox/mail/settings/defaults.js',
                            'apps/io.ox/contacts/settings/defaults.js',
                            'apps/io.ox/calendar/settings/defaults.js',
                            'apps/io.ox/tasks/settings/defaults.js',
                            'apps/io.ox/files/settings/defaults.js',
                            // metrics
                            'apps/io.ox/metrics/main.js',
                            'apps/io.ox/metrics/util.js',
                            'apps/io.ox/metrics/extensions.js',
                            'apps/io.ox/metrics/adapters/default.js',
                            'apps/io.ox/metrics/adapters/console.js',
                            // 4th wave
                            'apps/io.ox/core/collection.js',
                            'apps/io.ox/core/api/account.js',
                            'apps/io.ox/core/tk/selection.js',
                            'apps/io.ox/core/tk/visibility-api-util.js',
                            'apps/io.ox/core/desktopNotifications.js',
                            // core
                            'apps/io.ox/core/main/addLauncher.js',
                            'apps/io.ox/core/main/appcontrol.js',
                            'apps/io.ox/core/main/autologout.js',
                            'apps/io.ox/core/main/debug.js',
                            'apps/io.ox/core/main/apps.js',
                            'apps/io.ox/core/main/logout.js',
                            'apps/io.ox/core/main/offline.js',
                            'apps/io.ox/core/main/refresh.js',
                            'apps/io.ox/core/main/registry.js',
                            'apps/io.ox/core/main/stages.js',
                            'apps/io.ox/core/main/topbar_right.js',
                            'apps/io.ox/core/main/warning.js',
                            'apps/io.ox/core/main.js',
                            'apps/io.ox/core/links.js',
                            'apps/io.ox/core/active.js',
                            // tracker
                            'apps/io.ox/core/count/api.js',
                            'apps/io.ox/core/count/timing.js',
                            'apps/io.ox/core/count/errors.js',
                            'apps/io.ox/core/count/eyeballtime.js',
                            'apps/io.ox/core/count/nps.js',
                            'apps/io.ox/core/count/lifetime.js',
                            'apps/io.ox/core/count/sendmail.js',
                            'apps/io.ox/core/count/appointments.js',
                            'apps/io.ox/core/count/main.js',
                            // mail app
                            'apps/io.ox/mail/util.js',
                            'apps/io.ox/mail/api.js',
                            'apps/io.ox/mail/api-legacy.js',
                            'apps/io.ox/mail/listview.js',
                            'apps/io.ox/core/tk/list-control.js',
                            'apps/io.ox/mail/threadview.js',
                            'apps/io.ox/core/toolbars-mobile.js',
                            'apps/io.ox/core/page-controller.js',
                            'apps/io.ox/mail/actions.js',
                            'apps/io.ox/mail/actions/attachmentQuota.js',
                            'apps/io.ox/mail/toolbar.js',
                            'apps/io.ox/mail/import.js',
                            'apps/io.ox/mail/folderview-extensions.js',
                            // mobile mail
                            'apps/io.ox/mail/mobile-navbar-extensions.js',
                            'apps/io.ox/mail/mobile-toolbar-actions.js',
                            // mail app - 2nd wave
                            'apps/io.ox/core/util.js',
                            'apps/io.ox/core/api/factory.js',
                            'apps/io.ox/core/api/collection-pool.js',
                            'apps/io.ox/core/api/collection-loader.js',
                            'apps/io.ox/mail/common-extensions.js',
                            'apps/io.ox/core/tk/list.js',
                            'apps/io.ox/mail/view-options.js',
                            'apps/io.ox/core/api/backbone.js',
                            'apps/io.ox/mail/detail/view.js',
                            'apps/io.ox/mail/detail/mobileView.js',
                            'apps/io.ox/core/tk/list-dnd.js',
                            'apps/io.ox/mail/mobile-toolbar-actions.js',
                            'apps/io.ox/mail/mobile-navbar-extensions.js',
                            'apps/io.ox/core/print.js',
                            'apps/io.ox/contacts/api.js',
                            'apps/io.ox/core/tk/flag-picker.js',
                            'apps/io.ox/backbone/views/disposable.js',
                            'apps/io.ox/backbone/views/extensible.js',
                            'apps/io.ox/backbone/mini-views/abstract.js',
                            'apps/io.ox/backbone/mini-views/dropdown.js',
                            'apps/io.ox/backbone/mini-views/toolbar.js',
                            'apps/io.ox/backbone/mini-views/helplink.js',
                            'apps/io.ox/backbone/mini-views/upsell.js',
                            'apps/io.ox/backbone/mini-views/quota.js',
                            'apps/io.ox/core/tk/upload.js',
                            'apps/io.ox/core/dropzone.js',
                            // mail app - 3rd wave
                            'apps/io.ox/core/strings.js',
                            'apps/io.ox/core/attachments/backbone.js',
                            'apps/io.ox/core/attachments/view.js',
                            'apps/io.ox/core/api/user.js',
                            'apps/io.ox/core/api/group.js',
                            'apps/io.ox/core/api/resource.js',
                            'apps/io.ox/core/api/quota.js',
                            'apps/io.ox/core/api/filestorage.js',
                            'apps/io.ox/contacts/util.js',
                            'apps/l10n/ja_JP/io.ox/collation.js',
                            'apps/io.ox/core/tk/list-selection.js',
                            'apps/io.ox/backbone/mini-views/abstract.js',
                            'apps/io.ox/mail/detail/content.js',
                            'apps/io.ox/mail/detail/links.js',
                            'apps/io.ox/core/download.js',
                            // mail app - main
                            'apps/io.ox/mail/main.js'
                        ],
                        dest: 'build/precore.js',
                        nonull: true
                    }
                ]
            },
            tinymce: {
                files: [
                    {
                        src: [
                            'node_modules/tinymce/tinymce.min.js',
                            'node_modules/tinymce/themes/modern/theme.min.js',
                            'node_modules/tinymce/plugins/{autoresize,autolink,code,link,paste,textcolor,lists}/plugin.min.js',
                            'node_modules/@open-xchange/tinymce/plugins/ox{image,paste,drop}/plugin.min.js'
                        ],
                        dest: 'build/apps/3rd.party/tinymce/tinymce.min.js',
                        nonull: true
                    }
                ]
            },
            compose: {
                options: {
                    // jquery-min doesn't work because it messes around with anonymous define()
                    banner: 'define("io.ox/mail/compose/bundle", [], function () {\n\n' +
                            '  "use strict";\n' +
                            '\n' +
                            '  var _amd = define.amd;\n' +
                            '  delete define.amd;\n' +
                            '\n',
                    footer: '\n' +
                            '  define.amd = _amd;\n' +
                            '});\n\n'
                },
                files: [
                    {
                        src: [
                            'apps/io.ox/mail/compose/**/*.js',
                            'apps/io.ox/mail/sender.js',
                            'apps/io.ox/backbone/mini-views/common.js',
                            'apps/io.ox/core/tk/tokenfield.js',
                            'apps/io.ox/core/tk/typeahead.js',
                            'apps/io.ox/participants/model.js',
                            'apps/io.ox/participants/views.js',
                            'apps/io.ox/core/api/autocomplete.js',
                            'apps/io.ox/contacts/model.js',
                            'apps/io.ox/backbone/modelFactory.js',
                            'apps/io.ox/backbone/validation.js',
                            'apps/io.ox/backbone/basicModel.js',
                            'apps/io.ox/settings/util.js',
                            'apps/io.ox/core/api/snippets.js',
                            'apps/io.ox/core/tk/contenteditable-editor.js',
                            'apps/io.ox/core/tk/textproc.js',
                            'node_modules/tinymce/jquery.tinymce.min.js'
                        ],
                        dest: 'build/apps/io.ox/mail/compose/bundle.js',
                        nonull: true
                    }
                ]
            },
            find: {
                options: {
                    banner: 'define("io.ox/find/bundle", [], function () {\n\n' +
                                '"use strict";\n\n',
                    footer: '});\n'
                },
                files: [
                    {
                        src: [
                            'apps/io.ox/find/date/patterns.js',
                            'apps/io.ox/find/date/value-model.js',
                            'apps/io.ox/find/date/facet-model.js',
                            'apps/io.ox/find/manager/facet-collection.js',
                            'apps/io.ox/find/manager/facet-model.js',
                            'apps/io.ox/find/manager/value-collection.js',
                            'apps/io.ox/find/manager/value-model.js',
                            'apps/io.ox/find/api.js',
                            'apps/io.ox/find/apiproxy.js',
                            'apps/io.ox/find/extensions-api.js',
                            'apps/io.ox/find/extensions-facets.js',
                            'apps/io.ox/find/extensions-tokenfield.js',
                            'apps/io.ox/find/model.js',
                            'apps/io.ox/find/view-facets.js',
                            'apps/io.ox/find/view-placeholder.js',
                            'apps/io.ox/find/view-searchbox.js',
                            'apps/io.ox/find/view-token.js',
                            'apps/io.ox/find/view-tokenfield.js',
                            'apps/io.ox/find/view.js'
                        ],
                        dest: 'build/apps/io.ox/find/bundle.js',
                        nonull: true
                    }
                ]
            },
            multifactor: {
                options: {
                    banner: 'define("io.ox/multifactor/bundle", [], function () {\n\n' +
                                '"use strict";\n\nvar module = {};\n',
                    footer: '\nreturn module; \n});\n'
                },
                files: [
                    {
                        src: [
                            'apps/io.ox/multifactor/api.js',
                            'apps/io.ox/multifactor/deviceAuthenticator.js',
                            'apps/io.ox/multifactor/factorRenderer.js',
                            'apps/io.ox/multifactor/views/constants.js',
                            'apps/io.ox/multifactor/views/selectDeviceView.js',
                            'apps/io.ox/multifactor/views/smsProvider.js',
                            'apps/io.ox/multifactor/views/totpProvider.js',
                            'apps/io.ox/multifactor/views/u2fProvider.js'
                        ],
                        dest: 'build/apps/io.ox/multifactor/bundle.js',
                        nonull: true
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};
