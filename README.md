#Schema Check

Schema Check is an object validation and checking package designed to allow you to easily restrict what can be put on certain fields on a JavaScript Object.

Uses Object.defineProperty and private fields prefixed with '__'

###Usage
Pass in an object, schema and is_strict (can the object have additional fields?)

```
var SchemaCheck = require('schema-check');

var newObj = SchemaCheck(obj, schema, is_strict);

or

SchemaCheck(obj, schema);

```

Schemas can have the following format:

```
{
  field: {
    type: 'string',       //string, object, number, array -- Only String/Number working
    allow_nulls: false,   //true, false - default false - can you have nulls in this field?
    allow_delete: false,  //true, false - default false - can you delete this field?
    editable: false       //true, false - default true - is there a Setter?
  }
}
```

Note:  Currently Only String and Number Validation is working