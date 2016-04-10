'use strict';


var path     = require('path');
var generate = require('markdown-it-testgen');

/*eslint-env mocha*/

describe('markdown-it-footnote', function () {
  it('Should work with default settings', function() {
    var md = require('markdown-it')().use(require('../'));
	generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
  });

  it('Should work with prefixed IDs', function () {
    var md = require('markdown-it')().use(require('../'));
    generate(path.join(__dirname, 'fixtures/footnote-prefixed.txt'), {}, { documentId: 'test-doc-id' }, md);
  });
 });
