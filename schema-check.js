/**
 * Schema Check - Takes an Object, a Schema and true/false and checks that the object matches the schema
 *
 * @param {object} js_object - object to modify
 * @param {object} schema - schema to apply to the object
 * @param {boolean} is_strict - are additional fields allowed?  If false - throw error for additional fields on an object
 */
function SchemaCheck(js_object, schema, is_strict, debug) {
  var new_obj = {};
  if (!isObject(js_object)) {
    if (debug) console.error('SchemaCheck - Error: Object to Check must be of type object!   Arrays, Functions and Nulls are not supported at this time.')
    throw new TypeError("Object to check must be of type 'object'!");
  }

  if (!isObject(schema)) {
    if (debug) console.error('SchemaCheck - Error: Schema Must be of type object! Arrays, Functions and Nulls are not supported at this time.');
    throw new TypeError("Schema must be of type 'object'!");
  }

  new_obj = js_object;

  for (var prop in schema) {
    if (schema.hasOwnProperty(prop)) {
      applyRestrictionsToObject(new_obj, prop, schema[prop]);
    }
  }

  return new_obj;
}

/**
 * Applies Restrictions to an Object based on the Schema Properties
 */
function applyRestrictionsToObject(obj, property, schema_setting) {
  var descriptor = {
    enumerable: true,
    configurable: false
  };

  var valid_settings = extractSettings(schema_setting);

  //If we specify allow delete - set configurable to true
  if (valid_settings.allow_delete) descriptor.configurable = true;

  //For now only modify string and number types
  if (valid_settings.type === 'string' || valid_settings.type === 'number') {
    //Create a setter only if editable (defaults to true)
    if (valid_settings.editable) descriptor.set = generateSetterFromType(valid_settings.type, property, obj, valid_settings.allow_nulls);
    if ((getType(obj[property]) === valid_settings.type) || (valid_settings.allow_nulls && obj[property] === null)) {
      //If the Object Property's Type is equal to the type specified create the getter and initialize it on the object
      descriptor.get = function () { return obj['__' + property]; }
      obj['__' + property] = obj[property];
    } else {
      throw new Error('Type Specified Does NOT Match initial property value of the object!');
    }
  }

  //TODO Array and Object Validation
  Object.defineProperty(obj, property, descriptor);

  for (var prop in schema_setting) {
    if (schema_setting.hasOwnProperty(prop)) {
      var setting = schema_setting[prop];

      //If the schema setting is an object - it's a new level of settings - recurse into it
      if (isObject(setting)) {
        if (obj.hasOwnProperty(prop)) {
          applyRestrictionsToObject(obj[prop], setting);
        } else {
          throw new Error('Invalid Schema Setting Applied to Object!  Object does not have property: ' + prop);
        }
      }
    }
  }
}

/**
 * Generate Setter from a type string
 *
 * @param {string} type - the type to check for
 * @param {string} prop_name - name of the property to set
 */
function generateSetterFromType(type, prop_name, obj, allow_nulls) {
  if (typeof type !== 'string') {
    throw new TypeError('Schema Property "type" must be of type string!');
  }

  if (typeof prop_name !== 'string') {
    throw new TypeError('Schema Property Name must be of type string!');
  }

  switch (type) {
    case 'string':
      return stringValidation(prop_name, allow_nulls).bind(obj);
    case 'number':
      return numberValidation(prop_name, allow_nulls).bind(obj);
    case 'array':
      return arrayValidation(prop_name, allow_nulls).bind(obj);
    case 'object':
      return objectValidation(prop_name, allow_nulls).bind(obj);
  }
}

/**
 * Get the Type of the Variable:  object, string, number or array or unknown
 */
function getType(varia) {
  if (isObject(varia)) return 'object';
  if (typeof varia === 'string') return 'string';
  if (typeof varia === 'number') return 'number';
  if (Array.isArray(varia)) return 'array';
  return 'unknown';
}

/**
 * Extract Schema Settings
 *
 * Pulls Valid Schema settings from the schema object
 */
function extractSettings(schema_object) {
  var return_obj = {};
  if (schema_object) {
    //Check for valid type settings
    return_obj.type = schema_object.type != null && typeof schema_object.type === "string" ? schema_object.type : "object";
    return_obj.allow_nulls = schema_object.allow_nulls != null && typeof schema_object.allow_nulls === "boolean" ? schema_object.allow_nulls : false;
    return_obj.allow_delete = schema_object.allow_delete != null && typeof schema_object.allow_delete === "boolean" ? schema_object.allow_delete : false;
    return_obj.editable = schema_object.editable != null && typeof schema_object.editable === "boolean" ? schema_object.editable : true;
  }

  return return_obj;
}

/**
 * Validation Functions
 */
function stringValidation(prop_name, allow_nulls) {
  return function (value) {
    if (allow_nulls && value === null) return this['__' + prop_name] = value;

    if (typeof value !== 'string') {
      throw new TypeError(`Property ${prop_name} must be type 'string'! Tried to set value of type '${typeof value}'`);
    }

    this['__' + prop_name] = value;
  }
}

function numberValidation(prop_name, allow_nulls) {
  return function (value) {
    if (allow_nulls && value === null) return this['__' + prop_name] = value;

    if (typeof value !== 'number') {
      throw new TypeError(`Property ${prop_name} must be type 'number'! Tried to set value of type '${typeof value}'`);
    }

    this['__' + prop_name] = value;
  }
}

function arrayValidation(prop_name, allow_nulls) {
  return function (value) {
    if (allow_nulls && value === null) return this['__' + prop_name] = value;

    if (!Array.isArray(value)) {
      throw new TypeError(`Property ${prop_name} must an array! Tried to set value of type '${typeof value}'`);
    }

    this['__' + prop_name] = value;
  }
}

function objectValidation(prop_name, allow_nulls) {
  return function (value) {
    if (allow_nulls && value === null) return this['__' + prop_name] = value;

    if (!isObject(value)) {
      throw new TypeError(`Property ${prop_name} must an object! Tried to set value of ${value}`);
    }

    this['__' + prop_name] = value;
  }
}

/**
 * IsObject Function to check if object passed in is truly an object
 * Maybe later we can support Arrays - for now I'm excluding
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isObject(obj) {
  if (obj === null) return false;
  if (Array.isArray(obj)) return false;
  if (typeof obj === 'object') return true;
  return false;
}

//TODO: Make this work in browser
module.exports = SchemaCheck;