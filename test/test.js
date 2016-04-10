'use strict';


var path     = require('path');
var generate = require('markdown-it-testgen');
var assert   = require('assert');
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


var md = require('markdown-it')().use(require('../'));

describe('footnote.txt', function () {
  // Check that defaults work correctly
  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
});

describe('footnote-prefixed.txt', function () {
  // Now check that using `env.documentId` works to prefix IDs
  generateWithEnvironment(path.join(__dirname, 'fixtures/footnote-prefixed.txt'), md, { docId: 'test-doc-id' });
});
