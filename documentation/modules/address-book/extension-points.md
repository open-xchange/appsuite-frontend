---
title: Extension Points
description:  
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points_for_contact
---

# io.ox/contacts/api/search

An opportunity to extend search requests. 
Extensions are called as methods on the search request object and can modify it before it is sent to the server. 
The search request as described in the HTTP API.

- this - take a look at the linked HTTP API documentation.
- query ''string'' - The search query as entered by the user.
- options ''Object'' - The options object passed to the contacts search API.

# io.ox/contacts/detail

The mainpoint for the detail view of a selected single contact. 
The baton is forwarded as argument.

baton contains:

```
app

e.g.

app.attributes - functions and infos related to the contact app
app.attributes.window - functions and infos related to the app window (e.g. addButton etc.)
app.currentContact - provides access to the folder_id and the id of the current selected contact
app.settings- provides access to the app settings
data - holds the contact data object of the current selected contact
```

# io.ox/contacts/detail/head
The Point in the contact detail view for the headregion of a single selected contact. The baton is forwarded as argument.

# io.ox/contacts/detail/actions

The mainpoint for inserting actions related to the selected contact. The contact data object (baton.data) is forwarded as argument.

# io.ox/contacts/links/inline

The Point for inserting actions like edit & delete.

# io.ox/contacts/edit/view/personal

The point for the personal section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/personal/title
- io.ox/contacts/edit/view/personal/first_name
- io.ox/contacts/edit/view/personal/last_name
- io.ox/contacts/edit/view/personal/display_name
- io.ox/contacts/edit/view/personal/second_name
- io.ox/contacts/edit/view/personal/suffix
- io.ox/contacts/edit/view/personal/nickname
- io.ox/contacts/edit/view/personal/birthday
- io.ox/contacts/edit/view/personal/marital_status
- io.ox/contacts/edit/view/personal/number_of_children
- io.ox/contacts/edit/view/personal/spouse_name
- io.ox/contacts/edit/view/personal/anniversary
- io.ox/contacts/edit/view/personal/url

# io.ox/contacts/edit/view/messaging

The point for the messaging section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/messaging/email1
- io.ox/contacts/edit/view/messaging/email2
- io.ox/contacts/edit/view/messaging/email3
- io.ox/contacts/edit/view/messaging/instant_messenger1
- io.ox/contacts/edit/view/messaging/instant_messenger2

# io.ox/contacts/edit/view/phone

The point for the phone section in the contact edit form. 
It is followed by points for each attribute:

- io.ox/contacts/edit/view/phone/cellular_telephone1
- io.ox/contacts/edit/view/phone/cellular_telephone2
- io.ox/contacts/edit/view/phone/telephone_business1
- io.ox/contacts/edit/view/phone/telephone_business2
- io.ox/contacts/edit/view/phone/telephone_home1
- io.ox/contacts/edit/view/phone/telephone_home2
- io.ox/contacts/edit/view/phone/telephone_company
- io.ox/contacts/edit/view/phone/telephone_other
- io.ox/contacts/edit/view/phone/fax_business
- io.ox/contacts/edit/view/phone/fax_home
- io.ox/contacts/edit/view/phone/fax_other
- io.ox/contacts/edit/view/phone/telephone_car
- io.ox/contacts/edit/view/phone/telephone_isdn
- io.ox/contacts/edit/view/phone/telephone_pager
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
