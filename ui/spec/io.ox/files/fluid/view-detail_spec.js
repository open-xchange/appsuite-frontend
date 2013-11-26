/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/files/fluid/view-detail',
	'io.ox/files/api',
	'io.ox/core/extensions'], function (view, api, ext) {

    //reset tracker (lock/unlock states)
    afterEach(function () {
	api.tracker.clear();
	api.caches.versions.get.reset();
    });

    describe('files detail view', function () {
        var baton = ext.Baton.ensure({
                data: {
		    'color_label': 0,
		    'created_by': 395,
		    'creation_date': 1384934347734,
		    'current_version': true,
		    'file_md5sum': '04b384525949d824f954368319558196',
		    'file_mimetype': 'application/octet-stream',
		    'file_size': 498,
		    'filename': '2013-01-11-intro-to-aria-roles-states-and-properties.txt',
		    'folder_id': '0815',
		    'id': '4711',
		    'last_modified': 1384938624162,
		    'last_modified_utc': 1384938624162,
		    'locked_until': 0,
		    'modified_by': 9999,
		    'number_of_versions': 3,
		    'sequence_number': 1384938624162,
		    'title': '2013-01-11-intro-to-aria-roles-states-and-properties.txt',
		    'version': '3'
                }
            }),
            app = {
                getName: function () {
                    return 'testapp';
                },
                folder : {
                    set: '0815'
                }
	    },
	    //use different id for each mod
	    modified = function (data) {
		var bat = $.extend(true, {}, baton, {data: data});
		_.each(data, function (value, key) {
		    if (!value) delete bat.data[key];
		});
		api.tracker.updateFile(bat.data);
		return view.draw(bat, app);
            };

        describe('needs a baton that', function () {
            it('has to be defined', function () {
                var node = view.draw();
                expect(node).toBeJquery();
                expect(node.is(':empty')).toBeTruthy;
            });
            it('stores name of opening app', function () {
                var node = view.draw(baton, app);
                expect(baton.openedBy).toEqual('testapp');
                delete baton.openedBy;
            });
        });
        describe('creates a DOM structure', function () {
            var node = view.draw(baton);
            describe('with a container that', function () {
                it('has class file-details', function () {
                    expect(node.hasClass('file-details')).toBeTruthy;
                });
		it('use folder-id and file id as data-cid', function () {
		    expect(node.attr('data-cid')).toEqual(baton.data.folder_id + '.' + baton.data.id);
                });
            });
            describe('with action menu that', function () {
		describe('always', function () {
		    it('has some actions', function () {
			var actions = node.find('ul.io-ox-inline-links');
			expect(actions.children().length).toBeGreaterThan(0);
		    });
		    it('has a show internal link action if filename is defined', function () {
			expect(node.find('[data-action="showlink"]').length).toBeTruthy();
		    });
		    it('has a copy action', function () {
			//TODO: stub read grants
			//expect(node.find('[data-action="copy"]').length).toBeTruthy();
		    });
                });
		describe('(if', function () {
		    describe('filename or file_size are defined)', function () {
			var mod = modified({filename: undefined, file_size: undefined});
			it('has a open action', function () {
			    expect(node.find('[data-action="open"]').length).toBeTruthy();
			    expect(mod.find('[data-action="open"]').length).toBeFalsy();
			});
			it('has a download action', function () {
			    expect(node.find('[data-action="download"]').length).toBeTruthy();
			    expect(mod.find('[data-action="download"]').length).toBeFalsy();
			});
		    });
		    describe('filename is defined)', function () {
			var mod = modified({filename: undefined});
			it('has a publish action if filename is defined', function () {
			    expect(node.find('[data-action="publish"]').length).toBeTruthy();
			    expect(mod.find('[data-action="publish"]').length).toBeFalsy();
			});
		    });
		    describe('filetype is supported)', function () {
			var mod = modified({filename: 'something.jpg'});
			it('has a edit action ', function () {
			    expect(node.find('[data-action="editor"]').length).toBeTruthy();
			    expect(mod.find('[data-action="editor"]').length).toBeFalsy();
			});
		    });
		    describe('file is not locked)', function () {
			var mod = modified({id: 4712, modified_by: ox.user_id, locked_until: _.now() + (604800000 / 2)});
			it('has a rename action', function () {
			    expect(node.find('[data-action="rename"]').length).toBeTruthy();
			});
			it('has a edit-description action', function () {
			    expect(node.find('[data-action="edit-description"]').length).toBeTruthy();
			});
			it('has a move action', function () {
			    //TODO: stub read/delete grants
			    //expect(node.find('[data-action="move"]').length).toBeTruthy();
			    expect(mod.find('[data-action="move"]').length).toBeFalsy();
			});
		    });
		    describe('file is locked by myself)', function () {
			var mod = modified({id: 4713, modified_by: ox.user_id, locked_until: _.now() + (604800000 / 2)});
			it('has a rename action', function () {
			    expect(mod.find('[data-action="rename"]').length).toBeTruthy();
			});
			it('has a unlock action', function () {
			    expect(node.find('[data-action="unlock"]').length).toBeFalsy();
			    expect(mod.find('[data-action="unlock"]').length).toBeTruthy();
			});
		    });
		    describe('file is locked by another user)', function () {
			var mod = modified({id: 4714, locked_until: _.now() + (604800000 / 2)});
			it('has a rename action', function () {
			    expect(mod.find('[data-action="rename"]').length).toBeFalsy();
			});
			it('has a edit description action', function () {
			    expect(mod.find('[data-action="edit-description"]').length).toBeFalsy();
			});
			it('has a unlock action', function () {
			    expect(mod.find('[data-action="unlock"]').length).toBeFalsy();
			});
		    });
		    describe('file is unlocked)', function () {
			var mod = modified({id: 4715, locked_until: _.now() + (604800000 / 2)});
			it('has a lock action', function () {
			    expect(node.find('[data-action="lock"]').length).toBeTruthy();
			    expect(mod.find('[data-action="lock"]').length).toBeFalsy();
			});
			it('has a edit-description action if file isn not locked', function () {
			    expect(node.find('[data-action="edit-description"]').length).toBeTruthy();
			});
		    });
		});
	    });
	    describe('that contain a table with information about versions', function () {
		sinon.stub(api.caches.versions, 'get', function () {
		    return $.Deferred().resolve(
			[
			    {
				"id": "130943",
				"created_by": 395,
				"modified_by": 395,
				"creation_date": 1384934347734,
				"last_modified": 1384934347734,
				"folder_id": "14048",
				"meta": null,
				"categories": null,
				"color_label": 0,
				"title": "favicon.ico",
				"url": null,
				"filename": "favicon.ico",
				"file_mimetype": "image/vnd.microsoft.icon",
				"file_size": 318,
				"version": "1",
				"description": null,
				"locked_until": 0,
				"file_md5sum": "836e4e0a52845a3ce8153edc23c0b2ca",
				"version_comment": null,
				"current_version": false,
				"number_of_versions": 0
			    },
			    {
				"id": "130943",
				"created_by": 395,
				"modified_by": 395,
				"creation_date": 1384934652737,
				"last_modified": 1384934652688,
				"folder_id": "14048",
				"meta": null,
				"categories": null,
				"color_label": 0,
				"title": "IE9_-_Win7_simple_click.jpeg",
				"url": null,
				"filename": "IE9_-_Win7_simple_click.jpeg",
				"file_mimetype": "image/jpeg",
				"file_size": 96077,
				"version": "2",
				"description": null,
				"locked_until": 0,
				"file_md5sum": "bf01a8218d73d7c9d067b9396518574d",
				"version_comment": null,
				"current_version": true,
				"number_of_versions": 0
			    },
			    {
				"id": "130943",
				"created_by": 395,
				"modified_by": 395,
				"creation_date": 1384938624316,
				"last_modified": 1384938624162,
				"folder_id": "14048",
				"meta": null,
				"categories": null,
				"color_label": 0,
				"title": "2013-01-11-intro-to-aria-roles-states-and-properties.md",
				"url": null,
				"filename": "2013-01-11-intro-to-aria-roles-states-and-properties.md",
				"file_mimetype": "application/octet-stream",
				"file_size": 498,
				"version": "3",
				"description": null,
				"locked_until": 0,
				"file_md5sum": "04b384525949d824f954368319558196",
				"version_comment": null,
				"current_version": false,
				"number_of_versions": 0
			    }
			]
		    );
		});
		var mod = modified({id: 4717, number_of_versions: 3});
		it('when versions exist', function () {
		    var mod = modified({id: 4716, number_of_versions: 0});
		    expect(node.find('table.versiontable').length).toBeTruthy();
		    expect(mod.find('table.versiontable').length).toBeFalsy();
		});
		it('that can be collapsed', function () {
		    expect(mod.find('.versiontable').attr('style')).toBeFalsy();
		    mod.find('[data-action="history"]').trigger('click');
		    expect(mod.find('.versiontable').attr('style').trim()).toBe('display: table;');
		});
		it('that is initially collapsed', function () {
		    //TODO: initially hidden via css class; refactor
		});
		it('that shows all versions', function () {
		    expect(mod.find('.versiontable').find('tbody>tr').length).toBe(3);
		});
		it('that highlights current version by adding class "info"', function () {
		    expect(mod.find('.versiontable').find('.info .versionLabel').text()).toBe('2');
		});
	    });
	    it('that shows additional info about the folder', function () {
		expect(node.find('ul.breadcrumb').length).toBe(1);
            });
	    it('that allows uploading a new file version', function () {
		expect(node.find('.fileupload').length).toBe(1);
		expect(node.find('.fileupload.btn-file').hasClass('disabled')).toBeFalsy();
            });
        });
    });
});
