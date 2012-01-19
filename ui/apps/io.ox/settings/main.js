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
define('io.ox/settings/main',
     ['io.ox/core/tk/vgrid',
      'io.ox/core/api/apps',
      'io.ox/core/extensions',
      'io.ox/settings/utils',
      'less!io.ox/settings/style.css'], function (VGrid, appsApi, ext, utils) {
     
    'use strict';

    var tmpl = {
        main: {
            build: function () {
                var title;
                this.addClass('application')
                    .append(
                        title = $('<div>').addClass('title')
                    );
                return { title: title };
            },
            set: function (data, fields, index) {
                fields.title.text(data.title);
            }
        },
        label: {
            build: function () {
                this.addClass("settings-label");
            },
            set: function (data, fields, index) {
                this.text(data.group || '');
            }
        },
        requiresLabel: function (i, data, current) {
            return data.group !== current ? data.group : false;
        }
    };



    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 330,
        // nodes
        left,
        right,
        expertmode = false,
        currentSelection = null;

    function updateExpertMode() {
        var nodes = $('.expertmode');
        if (expertmode) {
          nodes.show();
        } else {
          nodes.hide();
        }
    }
    
    
    app.setLauncher(function () {
        app.setWindow(win = ox.ui.createWindow({
            title: 'Settings',
            toolbar: true,
            titleWidth: (GRID_WIDTH + 27) + "px",
            name: 'io.ox/settings'
        }));

        var onHideSettingsPane = function () {
            var settingsID = currentSelection.id + '/settings';
            ext.point(settingsID + '/detail').invoke('save');
        };
        win.bind('hide', onHideSettingsPane);


        

        ext.point('io.ox/settings/links/toolbar').extend({
            id: 'io.ox/settings/expertcb',
            draw: function (context) {
              var cb  = utils.createCheckbox({dataid: 'settings-expertcb', label: 'Enable Expert Mode', currentValue: expertmode});
              $(cb).find('[data-item-id="settings-expertcb"]').on('click', function () {
                  if ($(this).attr('checked')) {
                    expertmode = true;
                  } else {
                    expertmode = false;
                  }
                  updateExpertMode();
              });
              this.append(cb);
            }
        });
    

        win.addClass('io-ox-settings-main');

        left = $('<div/>')
            .addClass('leftside border-right')
            .css({
                width: GRID_WIDTH + 'px',
                overflow: 'auto'
            })
            .appendTo(win.nodes.main);

        right = $('<div/>')
            .css({ left: GRID_WIDTH + 1 + 'px', overflow: 'auto' })
            .addClass('rightside default-content-padding settings-detail-pane')
            .appendTo(win.nodes.main);

        grid = new VGrid(left);

        grid.addTemplate(tmpl.main);
        grid.addLabelTemplate(tmpl.label);

        grid.requiresLabel = tmpl.requiresLabel;

        grid.setAllRequest(function () {
            var apps = _.filter(appsApi.getInstalled(), function (item) {
                return item.settings;
            });
            return $.Deferred().resolve(apps);
        });

        var showSettings = function (obj) {
            var settingsID = obj.id + '/settings';
            right.empty().busy();
            require([ settingsID ], function (m) {
                ext.point(settingsID + '/detail').invoke('draw', right, obj);
                updateExpertMode();
                right.idle();
            });
        };
        grid.selection.bind('change', function (selection) {
            if (selection.length === 1) {
                var isOpenedTheFirstTime = (currentSelection === null);
                if (!isOpenedTheFirstTime) {
                    onHideSettingsPane();
                }
                currentSelection = selection[0];
                showSettings(currentSelection);
            } else {
                right.empty();
            }
        });


        win.bind('show', function () {
            grid.selection.keyboard(true);
        });
        win.bind('hide', function () {
            grid.selection.keyboard(false);
        });


        // go!
        win.show(function () {
            grid.paint();
        });
        grid.refresh();

    });
    return {
        getApp: app.getInstance
    };
});
