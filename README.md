# Insomnia plugin - OtherRequest
[![Npm Version](https://img.shields.io/npm/v/insomnia-plugin-otherrequest.svg)](https://www.npmjs.com/package/insomnia-plugin-otherrequest)

Reference other requests attributes in [Insomnia](https://insomnia.rest/).

Build/tested for insomnia 6.0.x

## Types
### Request -> Formfield
Choose one of the active form fields of the selected request.

Enter one the choices shown in the preview as attribute name.

### Request -> Query
Choose one of the active query fields of the selected request.

Enter one the choices shown in the preview as attribute name.

## Examples
Reference a formfield attribute
![example_form](example_form.png)

Reference a query attribute
![example_query](example_query.png)

If no match was found, the avaiable fields will be displayed
![error](error.png)