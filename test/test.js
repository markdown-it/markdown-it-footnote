'use strict';


var path     = require('path');
var generate = require('markdown-it-testgen');
var assert   = require('chai').assert;
var _        = require('lodash');

/*eslint-env mocha*/

// Most of the rest of this is inlined from generate(), but modified
// so we can pass in an `env` object
function generateWithEnvironment(fixturePath, md, env) {
  generate.load(fixturePath, {}, function (data) {
    data.meta = data.meta || {};

    var desc = data.meta.desc || path.relative(fixturePath, data.file);

    (data.meta.skip ? describe.skip : describe)(desc, function () {
      data.fixtures.forEach(function (fixture) {
        it('line ' + (fixture.first.range[0] - 1), function () {
          assert.strictEqual(md.render(fixture.first.text, _.clone(env)), fixture.second.text);
        });
      });
    });
  });
}

describe('markdown-it-footnote', function () {
  // Check that defaults work correctly
  var md = require('markdown-it')().use(require('../'));
  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);

  // Now check that using `env.documentId` works to prefix IDs
  generateWithEnvironment(path.join(__dirname, 'fixtures/footnote-prefixed.txt'), md, { documentId: 'test-doc-id' });
});
