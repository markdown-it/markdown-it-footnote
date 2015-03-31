'use strict';


var path     = require('path');
var generate = require('markdown-it-testgen');

/*eslint-env mocha*/

describe('markdown-it-footnote', function () {
  var md = require('markdown-it')()
              .use(require('../'));

  generate(path.join(__dirname, 'fixtures/footnote.txt'), md);
});

describe('markdown-it-footnote-labels', function () {
  var md = require('markdown-it')()
              .use(require('../')( 
                {
                    'labels_in_link': true
                })
              );

  generate(path.join(__dirname, 'fixtures/footnote_labels.txt'), md);
});