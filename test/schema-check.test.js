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
        magic: 5
      }
    };
  })

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
});