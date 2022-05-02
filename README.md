# RockClient
Rock RMS JavaScript Client

...additional documentation coming soon!

Example Usage:
```javascript
var client = window.DTS.RockClient()
var people = await client.request('People')
    .filter('IsActive eq true')
    .skip(1)
    .top(5)
    .orderBy(['LastName', 'FirstName'])
    .select(['Id', 'FirstName', 'LastName', 'Email'])
    .get()

var currentPerson = await client.Lava.render('{{ CurrentPerson | ToJSON }}')

var serverDateTime = await client.Utility.RockDateTime.now()
```