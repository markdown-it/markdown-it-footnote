'use strict';


var path     = require('path');
var generate = require('markdown-it-testgen');

/*eslint-env mocha*/

describe('markdown-it-footnote', function () {
  var md = require('markdown-it')()
              .use(require('../'));

  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
});

describe('custom footnote ids and labels', function () {
  var md = require('markdown-it')({
    footnoteId: function(n, token) {
      if (token.meta.label) {
        return '-' + token.meta.label;
      }
      return n;
    },

    footnoteCaption: function(n, token) {
      return '{' + (token.meta.label || n) + '}';
    }
  }).use(require('../'));

  generate(path.join(__dirname, 'fixtures/custom-footnotes.txt'), md);
});
