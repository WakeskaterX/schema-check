#Schema Check

Schema Check is an object validation and checking package designed to allow you to easily restrict what can be put on certain fields on a JavaScript Object.

Uses Object.defineProperty and private fields prefixed with '__'

To Install:

```
npm install schema-check
```

###Usage
Pass in an object, schema and options (additional settings for the SchemaCheck)

```javascript
var SchemaCheck = require('schema-check');

var obj = {
  name: "test",
  rating: 5,
  settings: {
    is_active: true
  }
};

var schema = {
  name: {
    type: "string",
    allow_nulls: false,
    editable: false,
  },
  rating: {
    type: "number"
  },
  settings: {
    is_active: {
      type: "boolean"
    }
  }
};

var options = {
  //Should additional fields be allowed?  Defaults to false
  is_strict: false, //TODO - this isn't working yet
  //Does adding an invalid field throw a TypeError or fail silently?  Defaults to true
  throw_error: true
};

var newObj = SchemaCheck(obj, schema, options);

//or

SchemaCheck(obj, schema);

//Examples
//Modifying Name doesn't work since editable is false
obj.name = "bob";
obj.name; //test

//Modifying Rating does work
obj.rating = 10;
obj.rating; //10

//Trying to set rating to a string throws an error
obj.rating = "10"; //Throws TypeError;

//Set a nested value
obj.settings.is_active = false;

//Throws error
obj.settings.is_active = "true";  //Throws TypeError;

```

Schemas can have the following format:

```javascript
{
  field: {
    type: 'string',       //string, number, boolean
    regex: /^test$/,      //regex - for string types only
    min: 5,               //number minimum - value must be greater than or equal to this number - number types only
    max: 5,               //number maximum - value must be less than or equal to this number - number types only
    allow_nulls: false,   //true, false - default false - can you have nulls in this field?
    allow_delete: false,  //true, false - default false - can you delete this field?
    editable: false       //true, false - default true - is there a Setter?
  }
}
```

Working So Far:
* Number
* String
* Regex: Can lock down Setter with Regex for String Types
* Boolean
* Nested Numbers/Strings
* Min/Max (Numbers Only)

To Do:
* Arrays?
* Typed Arrays?
* Make requests :)

View the Github repo here: https://github.com/WakeskaterX/schema-check

Also added [debug](https://github.com/visionmedia/debug), so if you want to view logging levels the debug strings are:
* schema:error
* schema:warn
* schema:log
* schema:test

I'll try to add more logs as well using debug