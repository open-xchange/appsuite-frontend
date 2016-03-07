---
title: Extension points
description:  
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points_for_tasks
---

# misc

- io.ox/tasks/attachment/links
- io.ox/tasks/detail-attach
- io.ox/tasks/detail-inline
- io.ox/tasks/links/inline
- io.ox/tasks/model/validation
- io.ox/tasks/settings/detail
- io.ox/tasks/vgrid/toolbar
- io.ox/settings/accounts/mail/settings/detail

# Customize

## Add a new settings link

By default, the folderview in settings contains four sections. 
If you want to add a link to a section, you have to find out the ID of the section. 
The extension point you are looking for has the name

```javascript
'io.ox/settings/pane/' + sectionID
```

For example, if you want to have a setting in the section external (this is where you should usually put your settings) you can use the following code:

```javascript
ext.point('io.ox/settings/pane/external').extend({
    title: gt('Title'),
    index: 350,
    id: 'myUniqueID',
    ref: 'reference/to/settings/page'
});
```

## Create a subsetting link

Let's say you have a setting and you want to add a subsetting beyond that. 
To do this, you have to know the name and ID of the parent extension point.
Then you simply have to extend the extension point with the name:

```javascript
parentName + '/' + parentID
```

The following code example creates a subsetting for the setting created above:

```javascript
ext.point('io.ox/settings/pane/external/myUniqueID').extend({
   title: gt('Title of Subsetting'),
   index: 100,
   id: 'myOtherUniqueID',
   ref: 'reference/to/other/settings/page'
});
```

## Create a new settingsgroup

If you have several settings that should be provided in a seperate section, you can extend the following extension point:

```javascript
ext.point('io.ox/settings/pane').extend({
    id: 'mySectionID',
    index: 500,
    subgroup: 'io.ox/settings/pane/mySectionID'
});
```

You have to provide a unique sectionID and a unique subgroupID to create a section. If you want to add links to this section, you just have to extend the extension point:

```javascript
'io.ox/settings/pane/mySectionId'
```

an use sever setting 'io.ox/mail//vgrid/sort='

_option: by date_

sort: 610

_option: by from_

sort: 603

_option: by subject_

sort: 607

_option: by label_

sort: 102

\_option: show threads (if threadview is enabled), sort by date (if threadview are disabled)\_\_

sort: 'thread'

# io.ox/mail/vgrid/toolbar

The point for extending the vgrid toolbar in the mail app.

# io.ox/mail/write/toolbar

The point for inserting inline buttons on top of the mail write view.

# io.ox/mail/write/actions/send

The point for the action related to the send button. The baton is available.

# io.ox/mail/write/autoCompleteItem

The point for extending the autocomplete items in the mail app.

# io.ox/mail/write/contactItem

The point for extending the contact list items in the mail app.

# io.ox/mail/write/contactPicture

The point for extending contact picture in autocomplete and contact list.

# io.ox/mail/write/displayName

The point for extending display name in autocomplete and contact list.

# io.ox/mail/write/emailAddress

The point for extending email address in autocomplete and contact list.

# io.ox/mail/write/actions/draft

The point for the action related to the save button. The baton is available.

# io.ox/mail/write/actions/discard

The point for the action related to the discard button. The baton is available.

phone/telephone_pager

- io.ox/contacts/edit/view/phone/telephone_primary
- io.ox/contacts/edit/view/phone/telephone_radio
- io.ox/contacts/edit/view/phone/telephone_telex
- io.ox/contacts/edit/view/phone/telephone_ttytdd
- io.ox/contacts/edit/view/phone/telephone_ip
- io.ox/contacts/edit/view/phone/telephone_assistant
- io.ox/contacts/edit/view/phone/telephone_callback

# io.ox/contacts/edit/view/home_address

The point for the home address section in the contact edit form. It is followed by points for each attribute:

- io.ox/contacts/edit/view/home_address/street_home
- io.ox/contacts/edit/view/home_address/city_home
- io.ox/contacts/edit/view/home_address/state_home
- io.ox/contacts/edit/view/home_address/country_home

# io.ox/contacts/edit/view/business_address

The point for the business address section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/business_address/street_business
- io.ox/contacts/edit/view/business_address/city_business
- io.ox/contacts/edit/view/business_address/state_business
- io.ox/contacts/edit/view/business_address/country_business

# io.ox/contacts/edit/view/other_address

The point for the other address section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/other_address/street_other
- io.ox/contacts/edit/view/other_address/city_other
- io.ox/contacts/edit/view/other_address/state_other
- io.ox/contacts/edit/view/other_address/country_other

# io.ox/contacts/edit/view/job

The point for the job section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/job/profession
- io.ox/contacts/edit/view/job/position
- io.ox/contacts/edit/view/job/department
- io.ox/contacts/edit/view/job/company
- io.ox/contacts/edit/view/job/room_number
- io.ox/contacts/edit/view/job/employee_type
- io.ox/contacts/edit/view/job/number_of_employees
- io.ox/contacts/edit/view/job/sales_volume
- io.ox/contacts/edit/view/job/tax_id
- io.ox/contacts/edit/view/job/commercial_register
- io.ox/contacts/edit/view/job/branches
- io.ox/contacts/edit/view/job/business_category
- io.ox/contacts/edit/view/job/info
- io.ox/contacts/edit/view/job/manager_name
- io.ox/contacts/edit/view/job/assistant_name

# io.ox/contacts/edit/view/userfields

The point for the userfields section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/userfields/userfield01
- io.ox/contacts/edit/view/userfields/userfield02
- io.ox/contacts/edit/view/userfields/userfield03
- io.ox/contacts/edit/view/userfields/userfield04
- io.ox/contacts/edit/view/userfields/userfield05
- io.ox/contacts/edit/view/userfields/userfield06
- io.ox/contacts/edit/view/userfields/userfield07
- io.ox/contacts/edit/view/userfields/userfield08
- io.ox/contacts/edit/view/userfields/userfield09
- io.ox/contacts/edit/view/userfields/userfield10
- io.ox/contacts/edit/view/userfields/userfield11
- io.ox/contacts/edit/view/userfields/userfield12
- io.ox/contacts/edit/view/userfields/userfield13
- io.ox/contacts/edit/view/userfields/userfield14
- io.ox/contacts/edit/view/userfields/userfield15
- io.ox/contacts/edit/view/userfields/userfield16
- io.ox/contacts/edit/view/userfields/userfield17
- io.ox/contacts/edit/view/userfields/userfield18
- io.ox/contacts/edit/view/userfields/userfield19
- io.ox/contacts/edit/view/userfields/userfield20

# io.ox/contacts/edit/view/comment

The point for the comment section in the contact edit form. 
It is followed by a point for the attribute:

- io.ox/contacts/edit/view/comment/note

# io.ox/contacts/edit/view/misc

The point for the misc section in the contact edit form. 
It is followed by a point for the attribute:

- io.ox/contacts/edit/view/misc/private_flag

# io.ox/contacts/edit/main/model

The point for adding additional functions to the model of a contact.

# io.ox/contacts/model/validation/distribution_list

The point for adding additional validation to the distribution_list array.
