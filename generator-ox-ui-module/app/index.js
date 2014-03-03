'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');

var OxUiModuleGenerator = module.exports = function OxUiModuleGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(OxUiModuleGenerator, yeoman.generators.Base);

OxUiModuleGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // have Yeoman greet the user.
  console.log(this.yeoman);

  var prompts = [{
    name: 'moduleName',
    message: 'What do you want the name of your package to be?',
    default: this.appname
  }];

  this.prompt(prompts, function (props) {
    this.moduleName = props.moduleName;

    cb();
  }.bind(this));
};

OxUiModuleGenerator.prototype.app = function app() {
  /* This method uses buildCopy, because copy will automatically try to template
   * every file. This is unwanted (would have used this.template instead), but
   * yeoman API says, it's there for backwards-compatibility. Need to wait until
   * this has been dropped by the yeoman team.
   */
  this.mkdir('apps');
  this.mkdir('grunt');
  this.mkdir('grunt/tasks');
  this.mkdir('grunt/templates');

  this.template('_package.json', 'package.json');
  this.template('_Gruntfile.js', 'Gruntfile.js');
  this.bulkCopy('local.conf.default.json', 'grunt/local.conf.default.json');

  this.template('grunt/_i18n.js', 'grunt/tasks/i18n.js');
  this.bulkCopy('grunt/i18n_module.js.tpl', 'grunt/templates/i18n_module.js.tpl');
  this.bulkCopy('grunt/clean.js', 'grunt/tasks/clean.js');
  this.bulkCopy('grunt/dist.js', 'grunt/tasks/dist.js');
  this.bulkCopy('grunt/concat.js', 'grunt/tasks/concat.js');
  this.bulkCopy('grunt/copy.js', 'grunt/tasks/copy.js');
  this.bulkCopy('grunt/jshint.js', 'grunt/tasks/jshint.js');
  this.bulkCopy('grunt/jsonlint.js', 'grunt/tasks/jsonlint.js');
  this.bulkCopy('grunt/less.js', 'grunt/tasks/less.js');
  this.bulkCopy('grunt/newer.js', 'grunt/tasks/newer.js');
  this.bulkCopy('grunt/uglify.js', 'grunt/tasks/uglify.js');
  this.bulkCopy('grunt/upload.js', 'grunt/tasks/upload.js');
  this.bulkCopy('grunt/watch.js', 'grunt/tasks/watch.js');
  this.bulkCopy('gitignore', '.gitignore');
  this.bulkCopy('lessrc', '.lessrc');
};

OxUiModuleGenerator.prototype.projectfiles = function projectfiles() {
  this.bulkCopy('jshintrc', '.jshintrc');
};
