var SchemaCheck = require('../schema-check.js');

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;

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