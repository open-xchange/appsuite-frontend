---
title: Backbone mini-views
description: Mini views are small backbone views which helps you to create single form elements like input fields, checkbox and so on.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:BackboneMiniViews
---

They should be used to build form pages in a DRY way. To use the mini-views simply require io.ox/backbone/mini-views in your view pane

# Benefits of using mini-views

- automatic cleanup (model & events) if the form element is removed from the DOM
- the wiring between form element and model data is handled for each mini-view via attribute name or id of the element
- DRY

# Abstract view

The abstract view is used to manage the dispose feature for all mini-views.

# Common mini-views

All mini-views provides functions for handling the common interactions between model data and form element like initial setup, update and rendering.
To provide some basic a11y the tabindex is set by default to _1_ and can be changed via ``this.options.tabindex`` to every needed value.

The 'id' option should be used to connect the view with the model data and render an id attribute. 
This can be used to connect with a label which is not surrounding the form field.

# List of form-elements included

## InputView

It draws a simple input form field.

```javascript
new InputView({ id: [attribute], model: [model] }).render().$el
```

renders the following markup

```html
<input type="text" id="text" class="form-control" name="text" tabindex="1">
```

## PasswordView

It draws a simple password form field.

```javascript
new PasswordView({ name: [attribute], model: [model] }).render().$el
```

renders the following markup

```html
<input type="password" id="password" class="form-control" autocomplete="off" autocorrect="off" name="password" tabindex="1">
```

If no password value is provided via model the field value is changed to ``********``. 
This especially is needed since already provided passwords are not delivered via the api request. 
The attributes "autocomplete" and "autocorrect" are set to "off" by default.

## TextView

It draws a simple textarea form field.


```javascript
new TextView({ name: [attribute], model: [model], rows: [rowcount] }).render().$el
```

renders the following markup

```html
<textarea id="textarea" class="form-control" name="textarea" tabindex="1" rows="4"></textarea>
```

Use this.rows to set the row attribute of the area to the needed value.

## CheckboxView

It draws a simple checkbox form field.

```javascript
new CheckboxView({ name: [attribute], model: [model] }).render().$el
```

renders the following markup

```html
<input type="checkbox" id="checkbox" name="checkbox" tabindex="1">
```

## RadioView

It draws a simple radio form field.


```javascript
new RadioView({ name: [attribute], model: [model], list: [radioOptions] }).render().$el
```

Use this.options.list to set the list of available options and labels.

```javascript
var radioOptions = var options = [
    { label: '1', value: '1'},
    { label: '2', value: '2'},
    { label: '3', value: '3'}
];
```


renders the following markup


```html
<div id="radio" class="controls">
    <div class="radio">
        <label><input type="radio" name="radio" value="1" tabindex="1">1</label>
    </div>
    <div class="radio">
        <label><input type="radio" name="radio" value="2" tabindex="1">2</label>
    </div>
    <div class="radio">
        <label><input type="radio" name="radio" value="3" tabindex="1">3</label>
    </div>
</div>
```

## SelectView

It draws a simple select form field.


```javascript
new SelectView({ name: [attribute], model: [model], list: [selectOptions] }).render().$el
```

Use this.options.list to set the list of available options and labels.

```javascript
var selectOptions = var options = [
    { label: '1', value: '1'},
    { label: '2', value: '2'},
    { label: '3', value: '3'}
];
```

renders the following markup

```html
<select id="select" class="input-xlarge form-control" name="select" tabindex="1">
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
</select>
```

## ErrorView

It draws a span with the class "help-block" to display error messages in case of a validation fault.

```html
<span class="help-block" aria-live="assertive" style="display: none;"></span>
```


It always should be placed beneath the corresponding form field.

```javascript
new ErrorView({ selector: [css selector] }).render().$el;
```

The 'selector' option is used to connect the ErrorView with an custom surrounding container for the ErrorView and the related form field. 
It returns the closest matching container. 
This container is used by the ErrorView to listen to the 'valid/invalid' events triggered by the validation.

The default selector returns the closest matching '.form-group' or '[class*="col-"]' container.

## FormView

It draws a simple form element. As a miniview, it automatically cleans up the connected model & events.

```html
<form></form>
```


```javascript
new FormView({ model: [model] }).render().$el;
```

## DateView

It draws a set of 'select' form fields to display and edit a date. Day, month and year will each be represented by a single ``<select>` item.

```javascript
new DateView({ name: [attribute], model: [model] }).render().$el
```


It renders the following markup:

```html
<div id="date" class="native-date-picker row">
    <div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">
        <select tabindex="1" name="date" title="Tag" class="form-control date">
            <option value=""></option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
                           *
                           *
                           *
            <option value="29">29</option>
            <option value="30">30</option>
            <option value="31" disabled="">31</option>
         </select>
    </div>
    <div class="col-xs-5 col-sm-5 col-md-5 col-lg-5">
        <select tabindex="1" name="month" title="Monat" class="form-control month">
            <option value=""></option>
            <option value="0">Januar</option>
            <option value="1">Februar</option>
                           *
                           *
                           *
            <option value="10">November</option>
            <option value="11">Dezember</option>
        </select>
    </div>
    <div class="col-xs-4 col-sm-4 col-md-4 col-lg-4">
        <select tabindex="1" name="year" title="Jahr" class="form-control year">
            <option value="0001"></option>
            <option value="2014">2014</option>
            <option value="2013">2013</option>
            <option value="2012">2012</option>
                           *
                           *
                           *
            <option value="1866">1866</option>
            <option value="1865">1865</option>
            <option value="1864">1864</option>
        </select>
    </div>
</div>
```

## Dropdown

The Dropdown mini view provides an easy solution to create a drop down.
Multiple settings and / or links may be provided to the user in a single drop-down view. 
To use the dropdown mini view simply require io.ox/backbone/mini-views/dropdown in your view pane.

Use this.option to fill the drop down with a single selectable option.
_arguments: [attribute], [value], [text used for labeling]_

Use this.link to provide a simple link with a callback.
_arguments: [value for attribute "data-name"], [text for link], [callback]_

Use this.header to build logical groups in the drop down while setting headers between the options.
_arguments: [text for header]_

Use this.divider to provide a visual devider between groups.


```javascript
var dropdown = new Dropdown({ model: model, label: gt('Dropdown'), tagName: 'li' })
    .header(gt('Options'))
    .option('options', 'firstOption', gt('first option'))
    .option('options', 'secondOption', gt('second option'))
    .divider()
    .header(gt('Choices'))
    .option(‚'choice', 'firstChoice', gt('first choice'))
    .option('choice', 'secondChoice', gt('second choice'))
    .divider()
    .link('link', gt('link'), function () { console.log('clicked'); }
);

dropdown.render().$el;
```


It renders the following markup:

```html
<li class="dropdown">
    <a href="#" tabindex="1" role="menuitem" aria-haspopup="true" aria-label="" data-toggle="dropdown" aria-expanded="false">
        <span class="dropdown-label">Dropdown</span>
    </a>
    <ul class="dropdown-menu" role="menu">
        <li class="dropdown-header" role="presentation" aria-hidden="true">Options</li>
        <li role="presentation">
            <a href="#" role="menuitemcheckbox" aria-checked="true" data-name="dropdownOptions" data-value="firstOption" data-toggle="false">
                <i class="fa fa-fw fa-check" aria-hidden="true"></i>
                <span>first option</span>
            </a>
        </li>
        <li role="presentation">
            <a href="#" role="menuitemcheckbox" aria-checked="false" data-name="dropdownOptions" data-value="secondOption" data-toggle="false">
                <i class="fa fa-fw fa-none" aria-hidden="true"></i>
                <span>second option</span>
            </a>
        </li>
        <li class="divider" role="presentation"></li>
        <li class="dropdown-header" role="presentation" aria-hidden="true">Choices</li>
        <li role="presentation">
            <a href="#" role="menuitemcheckbox" aria-checked="true" data-name="dropdownChoice" data-value="firstChoice" data-toggle="false">
                <i class="fa fa-fw fa-check" aria-hidden="true"></i>
                <span>first choice</span>
            </a>
        </li>
        <li role="presentation">
            <a href="#" role="menuitemcheckbox" aria-checked="false" data-name="dropdownChoice" data-value="secondChoice" data-toggle="false">
                <i class="fa fa-fw fa-none" aria-hidden="true"></i>
                <span>second choice</span>
            </a>
        </li>
        <li class="divider" role="presentation"></li>
        <li role="presentation">
            <a href="#" role="menuitem" tabindex="-1">link</a>
        </li>
    </ul>
</li>
```


## Dropdown Link

It draws a link which opens a dropdown. The link text always shows the selected option.


```javascript
new DropdownLinkView({ name: [attribute], model: [model], values: [dropdownOptions] }).render().$el
```

Use this.options.values to set the list of available values and labels.


```javascript
var dropdownOptions = { 
    'value1': 'Dropdownlink 1',
    'value2': 'Dropdownlink 2',
    'value3': 'Dropdownlink 3'
};
```

It renders the following markup:

```html
<div class="dropdownlink">
    <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">label1</a>
    <ul class="dropdown-menu" role="menu">
        <li><a href="#" data-action="change-value" data-value="value1" tabindex="1">Dropdownlink 1</a></li>
        <li><a href="#" data-action="change-value" data-value="value2" tabindex="1">Dropdownlink 2</a></li>
        <li><a href="#" data-action="change-value" data-value="value3" tabindex="1">Dropdownlink 3</a></li>
    </ul>
</div>
```

# Playground

Simply copy/paste the code beneath in to your browser console while being logged in. 
This creates an playground for the mentioned mini views.


```javascript
require(['io.ox/backbone/mini-views', 'io.ox/backbone/mini-views/dropdown'], function(mini, Dropdown) {
    
    var model = window.model = new Backbone.Model({
        text: 'text',
        radio: '1',
        password: 'password',
        textarea: 'textarea',
        checkbox: true,
        select: '1',
        date: 1411023212550,
        dropdownOptions: 'firstOption',
        dropdownChoice: 'firstChoice',
        dropdownLink: 'value1'
    });

    var form = new mini.FormView({ model: model });

    // use listenTo to benefit from automatic clean-up
    form.listenTo(model, 'change', function () {
        console.log(this.model.toJSON());
    });

    var options = [
        { label: '1', value: '1'},
        { label: '2', value: '2'},
        { label: '3', value: '3'}
    ];
    
    var dropdownOptions = { 
        'value1': 'Dropdownlink 1',
        'value2': 'Dropdownlink 2',
        'value3': 'Dropdownlink 3'
    };

    var dropdown = new Dropdown({ model: model, label: 'Dropdown' })
        .header('Options')
        .option('dropdownOptions', 'firstOption', 'first option')
        .option('dropdownOptions', 'secondOption', 'second option')
        .divider()
        .header('Choices')
        .option('dropdownChoice', 'firstChoice', 'first choice')
        .option('dropdownChoice', 'secondChoice', 'second choice')
        .divider()
        .link('link', 'link', function () { console.log('clicked'); }
    );

    form.$el.append(
        $('<fieldset>').append(
            $('<div class="row form-group">').append(
                $('<label for="text" class="control-label col-sm-4">').text('Text'),
                $('<div class="col-sm-8">').append(
                    new mini.InputView({ id: 'text', model: model }).render().$el
                )
            ),
            $('<div class="row form-group">').append(
                $('<div class="col-sm-8 col-sm-offset-4">').append(
                    dropdown.render().$el
                )
            ),
            $('<div class="row form-group">').append(
                $('<label class="control-label col-sm-4">').text('Radio'),
                $('<div class="col-sm-8">').append(
                    new mini.RadioView({
                        list: options,
                        id: 'radio',
                        model: model
                    }).render().$el
                )
           ),
           $('<div class="row form-group">').append(
               $('<label for="password" class="control-label col-sm-4">').text('Password'),
               $('<div class="col-sm-8">').append(
                   new mini.PasswordView({ id: 'password', model: model }).render().$el,
                   new mini.ErrorView({ selector: '.row' }).render().$el
               )
           ),
           $('<div class="row form-group">').append(
               $('<label for="textarea" class="control-label col-sm-4">').text('Textarea'),
               $('<div class="col-sm-8">').append(
                   new mini.TextView({ id: 'textarea', rows: '4', model: model }).render().$el
               )
           ),
           $('<div class="row form-group">').append(
               $('<div class="col-sm-8 col-sm-offset-4">').append(
                   $('<label class="checkbox">').append(
                       new mini.CheckboxView({ id: 'checkbox', model: model }).render().$el,
                       document.createTextNode('Checkbox')
                   )
               )
           ),
           $('<div class="row form-group">').append(
               $('<label for="select" class="control-label col-sm-4">').text('Select'),
               $('<div class="col-sm-8">').append(
                   new mini.SelectView({
                       list: options,
                       id: 'select',
                       model: model
                   }).render().$el
               )
           ),
           $('<div class="row form-group">').append(
               $('<label class="control-label col-sm-4">').text('Date'),
               $('<div class="col-sm-8">').append(
                   new mini.DateView({ id: 'date', model: model }).render().$el,
                   new mini.ErrorView({ selector: '.row' }).render().$el
               )
           ),
           $('<div class="row form-group">').append(
               $('<div class="col-sm-8 col-sm-offset-4">').append(
                   new mini.DropdownLinkView({ id: 'dropdownLink', model: model, values: dropdownOptions }).render().$el
               )
           )
        )
    );

    // add button to close playground
    form.$el.prepend(
        button = $('<button type="button" class="close">').append(
            $('<span aria-hidden="true">×</span><span class="sr-only">Close</span>')
        )
        .css({
            position: 'absolute',
            top: '4px',
            right: '8px',
            margin: '3px'
        })
        .on('click', function () {
            form.remove();
        })
    );

    form.$el.css({
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '50%',
        padding: '40px',
        backgroundColor: '#fff',
        boxShadow: '0 0 30px #888',
        zIndex: 11,
        overflowX: 'hidden',
        overflowY: 'auto'
    });

    $('body').append(form.render().$el);
});
```

You can copy/paste the following examples in your browser console to make changes to the data in the playground.

__to modify values via console__

```javascript
window.model.set('password', 'new password');
// window.model.set([attribute], [new value]);
```

__to trigger an validation fault__

```javascript
window.model.trigger('invalid:password', 'something is wrong here'); 
// window.model.trigger('invalid:' + [attribute], [Error Message]); 
```

__to remove an validation fault__

```javascript
window.model.trigger('valid:password');
// window.model.trigger('valid:' + [attribute]);
```

