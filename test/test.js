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


describe('footnote.txt', function () {
  var md = require('markdown-it')().use(require('../'));

  // Check that defaults work correctly
  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
});

describe('custom docId in env', function () {
  var md = require('markdown-it')().use(require('../'));

  // Now check that using `env.documentId` works to prefix IDs
  generateWithEnvironment(path.join(__dirname, 'fixtures/footnote-prefixed.txt'), md, { docId: 'test-doc-id' });
});

describe('custom footnote ids and labels', function () {
  var md = require('markdown-it')().use(require('../'), {
    anchor: function (n, token) {
      if (token.meta.label) {
        return '-' + token.meta.label;
      }
      return n;
    },

    caption: function (n, token) {
      return '{' + (token.meta.label || n) + '}';
    }
  });

  generate(path.join(__dirname, 'fixtures/custom-footnotes.txt'), md);
});
