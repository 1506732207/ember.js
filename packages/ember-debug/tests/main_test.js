import { ENV } from 'ember-environment';
import { Object as EmberObject } from 'ember-runtime';
import { HANDLERS } from '../handlers';
import {
  registerHandler,
  missingOptionsDeprecation,
  missingOptionsIdDeprecation,
  missingOptionsUntilDeprecation
} from '../deprecate';

import {
  missingOptionsIdDeprecation as missingWarnOptionsIdDeprecation,
  missingOptionsDeprecation as missingWarnOptionsDeprecation,
  registerHandler as registerWarnHandler
} from '../warn';

import {
  deprecate,
  warn,
  assert as emberAssert
} from '../index';

let originalEnvValue;
let originalDeprecateHandler;
let originalWarnOptions;
let originalDeprecationOptions;

QUnit.module('ember-debug', {
  setup() {
    originalEnvValue = ENV.RAISE_ON_DEPRECATION;
    originalDeprecateHandler = HANDLERS.deprecate;
    originalWarnOptions = ENV._ENABLE_WARN_OPTIONS_SUPPORT;
    originalDeprecationOptions = ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT;

    ENV.RAISE_ON_DEPRECATION = true;
    ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT = true;
  },

  teardown() {
    HANDLERS.deprecate = originalDeprecateHandler;

    ENV.RAISE_ON_DEPRECATION = originalEnvValue;
    ENV._ENABLE_WARN_OPTIONS_SUPPORT = originalWarnOptions;
    ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT = originalDeprecationOptions;
  }
});

QUnit.test('Ember.deprecate does not throw if RAISE_ON_DEPRECATION is false', function(assert) {
  assert.expect(1);

  ENV.RAISE_ON_DEPRECATION = false;

  try {
    deprecate('Should not throw', false, { id: 'test', until: 'forever' });
    assert.ok(true, 'Ember.deprecate did not throw');
  } catch (e) {
    assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
  }
});

QUnit.test('Ember.deprecate resets deprecation level to RAISE if ENV.RAISE_ON_DEPRECATION is set', function(assert) {
  assert.expect(2);

  ENV.RAISE_ON_DEPRECATION = false;

  try {
    deprecate('Should not throw', false, { id: 'test', until: 'forever' });
    assert.ok(true, 'Ember.deprecate did not throw');
  } catch (e) {
    assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
  }

  ENV.RAISE_ON_DEPRECATION = true;

  assert.throws(() => {
    deprecate('Should throw', false, { id: 'test', until: 'forever' });
  }, /Should throw/);
});

QUnit.test('When ENV.RAISE_ON_DEPRECATION is true, it is still possible to silence a deprecation by id', function(assert) {
  assert.expect(3);

  ENV.RAISE_ON_DEPRECATION = true;
  registerHandler(function(message, options, next) {
    if (!options || options.id !== 'my-deprecation') {
      next(...arguments);
    }
  });

  try {
    deprecate('should be silenced with matching id', false, { id: 'my-deprecation', until: 'forever' });
    assert.ok(true, 'Did not throw when level is set by id');
  } catch (e) {
    assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
  }

  assert.throws(() => {
    deprecate('Should throw with no matching id', false, { id: 'test', until: 'forever' });
  }, /Should throw with no matching id/);

  assert.throws(() => {
    deprecate('Should throw with non-matching id', false, { id: 'other-id', until: 'forever' });
  }, /Should throw with non-matching id/);
});

QUnit.test('Ember.deprecate throws deprecation if second argument is falsy', function() {
  expect(3);

  throws(() => deprecate('Deprecation is thrown', false, { id: 'test', until: 'forever' }));
  throws(() => deprecate('Deprecation is thrown', '', { id: 'test', until: 'forever' }));
  throws(() => deprecate('Deprecation is thrown', 0, { id: 'test', until: 'forever' }));
});

QUnit.test('Ember.deprecate does not invoke a function as the second argument', function() {
  expect(1);

  deprecate('Deprecation is thrown', function() {
    ok(false, 'this function should not be invoked');
  }, { id: 'test', until: 'forever' });

  ok(true, 'deprecations were not thrown');
});

QUnit.test('Ember.deprecate does not throw deprecations if second argument is truthy', function() {
  expect(1);

  deprecate('Deprecation is thrown', true, { id: 'test', until: 'forever' });
  deprecate('Deprecation is thrown', '1', { id: 'test', until: 'forever' });
  deprecate('Deprecation is thrown', 1, { id: 'test', until: 'forever' });

  ok(true, 'deprecations were not thrown');
});

QUnit.test('Ember.assert throws if second argument is falsy', function() {
  expect(3);

  throws(() => emberAssert('Assertion is thrown', false));
  throws(() => emberAssert('Assertion is thrown', ''));
  throws(() => emberAssert('Assertion is thrown', 0));
});

QUnit.test('Ember.assert does not throw if second argument is a function', function(assert) {
  assert.expect(1);

  emberAssert('Assertion is thrown', () => true);

  ok(true, 'assertions were not thrown');
});

QUnit.test('Ember.assert does not throw if second argument is truthy', function() {
  expect(1);

  emberAssert('Assertion is thrown', true);
  emberAssert('Assertion is thrown', '1');
  emberAssert('Assertion is thrown', 1);

  ok(true, 'assertions were not thrown');
});

QUnit.test('Ember.assert does not throw if second argument is an object', function() {
  expect(1);
  let Igor = EmberObject.extend();

  emberAssert('is truthy', Igor);
  emberAssert('is truthy', Igor.create());

  ok(true, 'assertions were not thrown');
});

QUnit.test('Ember.deprecate does not throw a deprecation at log and silence levels', function() {
  expect(4);
  let id = 'ABC';
  let until = 'forever';
  let shouldThrow = false;

  registerHandler(function(message, options, next) {
    if (options && options.id === id) {
      if (shouldThrow) {
        throw new Error(message);
      }
    }
  });

  try {
    deprecate('Deprecation for testing purposes', false, { id, until });
    ok(true, 'Deprecation did not throw');
  } catch (e) {
    ok(false, 'Deprecation was thrown despite being added to blacklist');
  }

  try {
    deprecate('Deprecation for testing purposes', false, { id, until });
    ok(true, 'Deprecation did not throw');
  } catch (e) {
    ok(false, 'Deprecation was thrown despite being added to blacklist');
  }

  shouldThrow = true;

  throws(function() {
    deprecate('Deprecation is thrown', false, { id, until });
  });

  throws(function() {
    deprecate('Deprecation is thrown', false, { id, until });
  });
});

QUnit.test('Ember.deprecate without options triggers a deprecation', function(assert) {
  assert.expect(4);

  registerHandler(function(message) {
    if (message === missingOptionsDeprecation) {
      assert.ok(true, 'proper deprecation is triggered when options is missing');
    } else if (message === 'foo') {
      assert.ok(true, 'original deprecation is still triggered');
    }
  });

  deprecate('foo');
  deprecate('foo', false, { });
});

QUnit.test('Ember.deprecate without options triggers an assertion', function(assert) {
  expect(2);
  ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT = false;

  assert.throws(
    () => deprecate('foo'),
    new RegExp(missingOptionsDeprecation),
    'proper assertion is triggered when options is missing'
  );

  assert.throws(
    () => deprecate('foo', false, { }),
    new RegExp(missingOptionsDeprecation),
    'proper assertion is triggered when options is missing'
  );
});


QUnit.test('Ember.deprecate without options.id triggers a deprecation', function(assert) {
  assert.expect(2);

  registerHandler(function(message) {
    if (message === missingOptionsIdDeprecation) {
      assert.ok(true, 'proper deprecation is triggered when options.id is missing');
    } else if (message === 'foo') {
      assert.ok(true, 'original deprecation is still triggered');
    }
  });

  deprecate('foo', false, { until: 'forever' });
});

QUnit.test('Ember.deprecate without options.id triggers an assertion', function(assert) {
  expect(1);
  ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT = false;

  assert.throws(
    () => deprecate('foo', false, { until: 'forever' }),
    new RegExp(missingOptionsIdDeprecation),
    'proper assertion is triggered when options.id is missing'
  );
});

QUnit.test('Ember.deprecate without options.until triggers a deprecation', function(assert) {
  assert.expect(2);

  registerHandler(function(message) {
    if (message === missingOptionsUntilDeprecation) {
      assert.ok(true, 'proper deprecation is triggered when options.until is missing');
    } else if (message === 'foo') {
      assert.ok(true, 'original deprecation is still triggered');
    }
  });

  deprecate('foo', false, { id: 'test' });
});

QUnit.test('Ember.deprecate without options.until triggers an assertion', function(assert) {
  expect(1);
  ENV._ENABLE_DEPRECATION_OPTIONS_SUPPORT = false;

  assert.throws(
    () => deprecate('foo', false, { id: 'test' }),
    new RegExp(missingOptionsUntilDeprecation),
    'proper assertion is triggered when options.until is missing'
  );
});

QUnit.test('warn without options triggers a deprecation', function(assert) {
  assert.expect(2);

  ENV._ENABLE_WARN_OPTIONS_SUPPORT = true;

  registerHandler(function(message) {
    assert.equal(message, missingWarnOptionsDeprecation, 'deprecation is triggered when options is missing');
  });

  registerWarnHandler(function(message) {
    assert.equal(message, 'foo', 'original warning is triggered');
  });

  warn('foo');
});

QUnit.test('warn without options triggers an assert', function(assert) {
  assert.expect(1);

  assert.throws(
    () => warn('foo'),
    new RegExp(missingWarnOptionsDeprecation),
    'deprecation is triggered when options is missing'
  );
});

QUnit.test('warn without options.id triggers a deprecation', function(assert) {
  assert.expect(2);

  ENV._ENABLE_WARN_OPTIONS_SUPPORT = true;

  registerHandler(function(message) {
    assert.equal(message, missingWarnOptionsIdDeprecation, 'deprecation is triggered when options is missing');
  });

  registerWarnHandler(function(message) {
    assert.equal(message, 'foo', 'original warning is triggered');
  });

  warn('foo', false, { });
});

QUnit.test('warn without options.id triggers an assertion', function(assert) {
  assert.expect(1);

  assert.throws(
    () => warn('foo', false, { }),
    new RegExp(missingWarnOptionsIdDeprecation),
    'deprecation is triggered when options is missing'
  );
});

QUnit.test('warn without options.id nor test triggers a deprecation', function(assert) {
  assert.expect(2);

  ENV._ENABLE_WARN_OPTIONS_SUPPORT = true;

  registerHandler(function(message) {
    assert.equal(message, missingWarnOptionsIdDeprecation, 'deprecation is triggered when options is missing');
  });

  registerWarnHandler(function(message) {
    assert.equal(message, 'foo', 'original warning is triggered');
  });

  warn('foo', { });
});

QUnit.test('warn without options.id nor test triggers an assertion', function(assert) {
  assert.expect(1);

  assert.throws(
    () =>   warn('foo', { }),
    new RegExp(missingWarnOptionsIdDeprecation),
    'deprecation is triggered when options is missing'
  );
});

QUnit.test('warn without test but with options does not trigger a deprecation', function(assert) {
  assert.expect(1);

  ENV._ENABLE_WARN_OPTIONS_SUPPORT = true;

  registerHandler(function(message) {
    assert.ok(false, `there should be no deprecation ${message}`);
  });

  registerWarnHandler(function(message) {
    assert.equal(message, 'foo', 'warning was triggered');
  });

  warn('foo', { id: 'ember-debug.do-not-raise' });
});

QUnit.test('warn without test but with options does not trigger an assertion', function(assert) {
  assert.expect(1);

  registerWarnHandler(function(message) {
    assert.equal(message, 'foo', 'warning was triggered');
  });

  warn('foo', { id: 'ember-debug.do-not-raise' });
});
