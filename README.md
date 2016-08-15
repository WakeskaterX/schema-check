#Schema Check

Schema Check is an object validation and checking package designed to allow you to easily restrict what can be put on certain fields on a JavaScript Object.

Uses Object.defineProperty and private fields prefixed with '__'

To Install:

```
npm install schema-check
```

###Usage
Pass in an object, schema and is_strict (can the object have additional fields?)

```javascript
var SchemaCheck = require('schema-check');

var obj = {
  name: "test",
  rating: 5
};

var schema = {
  name: {
    type: "string",
    allow_nulls: false,
    editable: false,
  },
  rating: {
    type: "number"
  }
}

var newObj = SchemaCheck(obj, schema, is_strict);

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

```

Schemas can have the following format:

```javascript
{
  field: {
    type: 'string',       //string, object, number, array -- Only String/Number working
    allow_nulls: false,   //true, false - default false - can you have nulls in this field?
    allow_delete: false,  //true, false - default false - can you delete this field?
    editable: false       //true, false - default true - is there a Setter?
  }
}
```

Working So Far:
* Number
* String
* Nested Numbers/Strings

To Do:
* Boolean
* Typed Arrays?

View the Github repo here: https://github.com/WakeskaterX/schema-check