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
    message: 'What do you want the name of your module to be?',
    default: this.appname
  }];

  this.prompt(prompts, function (props) {
    this.moduleName = props.moduleName;

    cb();
  }.bind(this));
};

OxUiModuleGenerator.prototype.app = function app() {
  this.mkdir('apps');
  this.mkdir('grunt');
  this.mkdir('grunt/tasks');
  this.mkdir('grunt/templates');

  this.template('_package.json', 'package.json');
  this.template('_Gruntfile.js', 'Gruntfile.js');

  this.copy('grunt/clean.js', 'grunt/tasks/clean.js');
  this.copy('grunt/newer.js', 'grunt/tasks/newer.js');
  this.copy('grunt/concat.js', 'grunt/tasks/concat.js');
  this.copy('grunt/jshint.js', 'grunt/tasks/jshint.js');
  this.copy('grunt/parallelize.js', 'grunt/tasks/parallelize.js');
  this.copy('grunt/jsonlint.js', 'grunt/tasks/jsonlint.js');
  this.copy('grunt/less.js', 'grunt/tasks/less.js');
  this.copy('grunt/i18n.js', 'grunt/tasks/i18n.js');
  this.copy('grunt/i18n_module.js.tpl', 'grunt/templates/i18n_module.js.tpl');
  this.copy('grunt/uglify.js', 'grunt/tasks/uglify.js');
  this.copy('gitignore', '.gitignore');
  this.copy('lessrc', '.lessrc');
};

OxUiModuleGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('jshintrc', '.jshintrc');
};
