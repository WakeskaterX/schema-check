var SchemaCheck = require('../schema-check.js');

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;
var debug = require('debug')('schema:test');

describe('Schema Check Tests', function() {
  var mcTesty = {};

  beforeEach(function() {
    mcTesty = {
      name: 'test',
      life: 5,
      bags: [
        "cheese",
        "sandwich"
      ],
      skills: {
        sword: 5,
        magic: 5,
        specialization: 'magic'
      },
      is_alive: true
    };
  });

  describe('String Fields', function() {
    it('should return the original string if not updated', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string' }
      });

      validateOne('name', null, 'test', false);
    });

    it('should let you update a string field with a string', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string' }
      });

      validateOne('name', 'bob', 'bob', false);
    });

    it('should reject an update that does not match the schema', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string' }
      });

      validateOne('name', 5, null, true);
    });

    it('should use regex.test if a regex is specified to limit the string input', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string', regex: /^(jim|jan)$/}
      });

      validateOne('name', 'jan', 'jan', false);
    });

    it('should reject a string that does not match a specified regex', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string', regex: /^(jim|jan)$/}
      });

      validateOne('name', 'joe', null, true);
    });

    it('should ignore an attempt to update a non-editable field', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string', editable: false }
      });

      validateOne('name', 'bob', 'test', false);
    });

    it('should let you modify fields not in the schema', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string' }
      });

      validateOne('life', 32, 32, false);
    });

    it('should not throw an error and fail silently if options.throw_error is set to false', function() {
      SchemaCheck(mcTesty, {
        name: { type: 'string' }
      }, {
        throw_error: false
      });

      validateOne('name', 32, 'test', false);
    })
  });

  describe('Number Fields', function() {
    it('should return the original number if not updated', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number' }
      });

      validateOne('life', null, 5, false);
    });

    it('should let you update a number field with a number', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number' }
      });

      validateOne('life', 10, 10, false);
    });

    it('should reject an update that does not match the schema', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number' }
      });

      validateOne('life', '100', null, true);
    });

    it('should ignore an attempt to update a non-editable field', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', editable: false }
      });

      validateOne('life', 20, 5, false);
    });

    it('should let you modify fields not in the schema', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number' }
      });

      validateOne('name', 'bob', 'bob', false);
    });

    it('should let you specify a minimum number and error if below', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', min: 5 }
      });

      validateOne('life', 4, null, true);
    });

    it('should let you specify a minimum number accept a value greater or equal', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', min: 5 }
      });

      validateOne('life', 5, 5, false);
    });

    it('should let you specify a maximum number and error if above', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', max: 10 }
      });

      validateOne('life', 11, null, true);
    });

    it('should let you specify a maximum number accept a value less than or equal', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', max: 10 }
      });

      validateOne('life', 6, 6, false);
    });

    it('should let you specify a minimum and maximum number and accept a value in between', function() {
      SchemaCheck(mcTesty, {
        life: { type: 'number', min: 5, max: 10 }
      });

      validateOne('life', 6, 6, false);
    });
  });

  describe('Boolean Fields', function() {
    it('should return the original value if not update', function() {
      SchemaCheck(mcTesty, {
        is_alive: { type: 'boolean' }
      });

      validateOne('is_alive', null, true, false);
    });

    it('should let you update a boolean field with a boolean', function() {
      SchemaCheck(mcTesty, {
        is_alive: { type: 'boolean' }
      });

      validateOne('is_alive', false, false, false);
    });

    it('should reject an update that does not match the schema', function() {
      SchemaCheck(mcTesty, {
        is_alive: { type: 'boolean' }
      });

      validateOne('is_alive', 'false', null, true);
    });
  });

  describe('Nested & Multiple Fields', function() {
    it('should let you update multiple fields and return the correct fields', function() {
      var result = nestedSetUp('john', 7, 10, 'sword');

      should.not.exist(result);
      mcTesty.name.should.equal('john');
      mcTesty.life.should.equal(7);
      mcTesty.skills.sword.should.equal(10);
      mcTesty.skills.specialization.should.equal('sword');
    });

    it('throws an error if a nested field is given an invalid type', function() {
      var result = nestedSetUp('john', 7, '10', 'sword');
      should.exist(result);
      assert(result instanceof TypeError);
    });
  });

  /**
   * VALIDATION FUNCTIONS
   */
  function validateOne(field, value_to_set, value_to_test, does_err) {
    var err;
    try {
      if (value_to_set != null) mcTesty[field] = value_to_set;
    } catch (e) {
      err = e;
    }

    if (err) debug(err);

    if (does_err) should.exist(err);
    else should.not.exist(err);

    if (value_to_test != null) expect(mcTesty[field]).to.equal(value_to_test);
  }

  function nestedSetUp(name, life, sword, spec) {
    SchemaCheck(mcTesty, {
      name: { type: 'string' },
      life: { type: 'number' },
      skills: {
        sword: { type: 'number' },
        specialization: { type: 'string' }
      }
    });

    var err;
    try {
      mcTesty.name = name;
      mcTesty.life = life;
      mcTesty.skills.sword = sword;
      mcTesty.skills.specialization = spec;
    } catch (e) {
      err = e;
    }

    return err;
  }
});