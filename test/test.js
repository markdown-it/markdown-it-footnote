'use strict';


var _        = require('lodash');
var assert   = require('assert');
var testgen  = require('markdown-it-testgen');
var path     = require('path');

/*eslint-env mocha*/

// Most of the rest of this is inlined from generate(), but modified
// so we can pass in an `env` object
function generate(fixturePath, md, env) {
  testgen.load(fixturePath, {}, function (data) {
    data.meta = data.meta || {};

    var desc = data.meta.desc || path.relative(fixturePath, data.file);

    (data.meta.skip ? describe.skip : describe)(desc, function () {
      data.fixtures.forEach(function (fixture) {
        it('line ' + (fixture.first.range[0] - 1), function () {
          // add variant character after "↩", so we don't have to worry about
          // invisible characters in tests
          assert.strictEqual(
            md.render(fixture.first.text, _.clone(env || {})),
            fixture.second.text.replace(/\u21a9(?!\ufe0e)/g, '\u21a9\ufe0e')
          );
        });
      });
    });
  });
}


describe('markdown-it-footnote', function () {
  var md = require('markdown-it')()
              .use(require('../'));

  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
});
