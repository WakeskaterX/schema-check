var debug_error = require('debug')('schema:error');
var debug_warn = require('debug')('schema:warn');
var debug = require('debug')('schema:log');
/**
 * Schema Check - Takes an Object, a Schema and true/false and checks that the object matches the schema
 *
 * @param {object} js_object - object to modify
 * @param {object} schema - schema to apply to the object
 * @param {object} opt - additional options (is_strict, throw_error)
 */
function SchemaCheck(js_object, schema, opt) {
  var options = extractOptions(opt);
  var new_obj = {};
  if (!isObject(js_object)) {
    debug_error('SchemaCheck - Error: Object to Check must be of type object!   Arrays, Functions and Nulls are not supported at this time.')
    throw new TypeError("Object to check must be of type 'object'!");
  }

  if (!isObject(schema)) {
    debug_error('SchemaCheck - Error: Schema Must be of type object! Arrays, Functions and Nulls are not supported at this time.');
    throw new TypeError("Schema must be of type 'object'!");
  }

  new_obj = js_object;

  for (var prop in schema) {
    if (schema.hasOwnProperty(prop)) {
      applyRestrictionsToObject(new_obj, prop, schema[prop], options);
    }
  }

  return new_obj;
}

/**
 * Applies Restrictions to an Object based on the Schema Properties
 * @param {object} obj - to apply the restrictions to
 * @param {string} property - schema_property to check
 * @param {object} schema_setting - schema_setting to apply
 * @param {object} options - additional options for logging, etc
 */
function applyRestrictionsToObject(obj, property, schema_setting, options) {
  var descriptor = {
    enumerable: true,
    configurable: false
  };

  var valid_settings = extractSettings(schema_setting);

  //If we specify allow delete - set configurable to true
  if (valid_settings.allow_delete) descriptor.configurable = true;

  //Modifications to string/number/boolean types
  if (['string', 'boolean', 'number'].indexOf(valid_settings.type) > -1) {
    //Create a setter only if editable (defaults to true)
    if (valid_settings.editable) descriptor.set = generateSetterFromType(valid_settings, property, obj, options);
    if ((getType(obj[property]) === valid_settings.type) || (valid_settings.allow_nulls && obj[property] === null)) {
      //If the Object Property's Type is equal to the type specified create the getter and initialize it on the object
      descriptor.get = function () { return obj['__' + property]; }
      obj['__' + property] = obj[property];
    } else {
      debug_error('Initial property on the object: ' + property + ' does not match the type specified by the schema');
      throw new TypeError('Type Specified Does NOT Match initial property value of the object!');
    }
  }

  //TODO Array Validation - figure out push/pull/pop/etc...

  //TODO Array and Object Validation
  Object.defineProperty(obj, property, descriptor);

  for (var prop in schema_setting) {
    if (schema_setting.hasOwnProperty(prop)) {
      var setting = schema_setting[prop];

      //If the schema setting is an object (and not a regex) - it's a new level of settings - recurse into it
      if (isObject(setting) && setting !== 'regex') {
        if (obj.hasOwnProperty(property)) {
          applyRestrictionsToObject(obj[property], prop, setting, options);
        } else {
          debug_error('Invalid Schema applied to the object!  Object does not have property: ' + prop);
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
function generateSetterFromType(settings, prop_name, obj, options) {
  var allow_nulls = settings.allow_nulls;
  var type = settings.type;
  if (typeof type !== 'string') {
    if (options.throw_error) throw new TypeError('Schema Property "type" must be of type string!');
  }

  if (typeof prop_name !== 'string') {
    if (options.throw_error) throw new TypeError('Schema Property Name must be of type string!');
  }

  switch (type) {
    case 'string':
      return stringValidation(prop_name, settings, options).bind(obj);
    case 'number':
      return numberValidation(prop_name, settings, options).bind(obj);
    case 'boolean':
      return booleanValidation(prop_name, settings, options).bind(obj);
    case 'array':
      return arrayValidation(prop_name, settings, options).bind(obj);
    case 'object':
      return objectValidation(prop_name, settings, options).bind(obj);
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
  if (typeof varia === 'boolean') return 'boolean';
  return 'unknown';
}

/**
 * Extracts Options Object from options passed in
 */
function extractOptions(opt) {
  var options = {};
  options.is_strict = opt && opt.is_strict != null && typeof opt.is_strict === 'boolean' ? opt.is_strict : false;
  options.throw_error = opt && opt.throw_error != null && typeof opt.throw_error === 'boolean' ? opt.throw_error : true;
  return options;
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

    if (schema_object.type === "number") {
      if (!isNil(schema_object.min) && typeof schema_object.min === "number") return_obj.min = schema_object.min;
      if (!isNil(schema_object.max) && typeof schema_object.max === "number") return_obj.max = schema_object.max;
    }

    if (schema_object.type === "string" && schema_object.regex) {
      if (schema_object.regex instanceof RegExp) return_obj.regex = schema_object.regex;
      else debug_warn('schema field regex was specified but was not an instance of RegExp!  Ignoring regex!');
    }
  }

  return return_obj;
}

/**
 * Validation Functions
 */
function stringValidation(prop_name, settings, options) {
  return function (value) {
    if (settings.allow_nulls && value === null) return this['__' + prop_name] = value;

    if (typeof value !== 'string') {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be type "string"! Tried to set value of type ' + (typeof value));
      debug('Invalid Type specified, silently failing!  Type required: string, Type passed: ' + (typeof value));
      return;
    }

    if (settings.regex && !settings.regex.test(value)) {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' was type "string" but did not pass the RegExp specified!  Value: ' + value + " - RegExp: " + settings.regex.toString());
      debug('Value submitted Failed RegExp requirement for this field!  Silently failing to set value!  Value: ' + value + ' - RegExp: ' + settings.regex.toString());
      return;
    }

    this['__' + prop_name] = value;
  }
}

function numberValidation(prop_name, settings, options) {
  return function (value) {
    if (settings.allow_nulls && value === null) return this['__' + prop_name] = value;

    if (typeof value !== 'number') {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be type "number"! Tried to set value of type ' + (typeof value));
      debug('Invalid Type specified, silently failing!  Type required: number, Type passed: ' + (typeof value));
      return;
    }

    if (!isNil(settings.min) && value < settings.min) {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be at least: ' + settings.min + ', Tried to set value of: ' + value);
      debug('Invalid Value Specified!  silently failing!  Minimum Value: ' + settings.min + ', Value passed: ' + value);
      return;
    }

    if (!isNil(settings.max) && value > settings.max) {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be at most: ' + settings.max + ', Tried to set value of: ' + value);
      debug('Invalid Value Specified!  silently failing!  Maximum Value: ' + settings.max + ', Value passed: ' + value);
      return;
    }

    this['__' + prop_name] = value;
  }
}

function booleanValidation(prop_name, settings, options) {
  return function (value) {
    if (settings.allow_nulls && value === null) return this['__' + prop_name] = value;

    if (typeof value !== 'boolean') {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be type "boolean"! Tried to set value of type ' + (typeof value));
      debug('Invalid Type specified, silently failing!  Type required: boolean, Type passed: ' + (typeof value));
      return;
    }

    this['__' + prop_name] = value;
  }
}

function arrayValidation(prop_name, settings, options) {
  return function (value) {
    if (settings.allow_nulls && value === null) return this['__' + prop_name] = value;

    if (!Array.isArray(value)) {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be type "array"! Tried to set value of type ' + (typeof value));
      debug('Invalid Type specified, silently failing!  Type required: array, Type passed: ' + (typeof value));
      return;
    }

    this['__' + prop_name] = value;
  }
}

function objectValidation(prop_name, settings, options) {
  return function (value) {
    if (settings.allow_nulls && value === null) return this['__' + prop_name] = value;

    if (!isObject(value)) {
      if (options.throw_error) throw new TypeError('Property ' + prop_name + ' must be an object! Tried to set value of type ' + (typeof value));
      debug('Invalid Type specified, silently failing!  Type required: object, Type passed: ' + (typeof value));
      return;
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
  if (obj instanceof RegExp) return false;
  if (typeof obj === 'object') return true;
  return false;
}

/**
 * Is Nil
 *
 * Returns if the value is undefined or null
 * @oaram {any} value
 * @returns boolean
 */
function isNil(value) {
  return value === undefined || value === null;
}

//TODO: Make this work in browser
module.exports = SchemaCheck;