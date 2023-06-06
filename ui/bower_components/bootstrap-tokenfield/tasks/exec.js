module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        exec: {
            git_is_clean: {
                cmd: 'test -z "$(git status --porcelain)"'
            },
            git_on_master: {
                cmd: 'test $(git symbolic-ref --short -q HEAD) = master'
            },
            git_add: {
                cmd: 'git add .'
            },
            git_commit: {
                cmd: function (m) { return f('git commit -m "%s"', m); }
            },
            git_tag: {
                cmd: function (v) { return f('git tag v%s -am "%s"', v, v); }
            },
            git_push: {
                cmd: 'git push && git push --tags'
            },
            update_docs: {
                cmd: [
                    'git checkout gh-pages',
                    'git reset master --hard',
                    'sed -i.bak \'s/%VERSION%/v<%= version %>/\' index.html',
                    'rm -rf index.html.bak',
                    'git add index.html',
                    'git commit -m "Update docs to <%= version %>"',
                    'git checkout master'
                ].join(' && ')
            },
            npm_publish: {
                cmd: 'npm publish'
            }
        }
    });
};
