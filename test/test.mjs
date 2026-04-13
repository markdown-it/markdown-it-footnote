import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import markdownit from 'markdown-it'
import testgen from 'markdown-it-testgen'

import footnote from '../index.mjs'

// Most of the rest of this is inlined from generate(), but modified
// so we can pass in an `env` object
function generate (fixturePath, md, env) {
  testgen.load(fixturePath, {}, function (data) {
    data.meta = data.meta || {}

    const desc = data.meta.desc || path.relative(fixturePath, data.file);

    (data.meta.skip ? describe.skip : describe)(desc, function () {
      data.fixtures.forEach(function (fixture) {
        it('line ' + (fixture.first.range[0] - 1), function () {
          // add variant character after "↩", so we don't have to worry about
          // invisible characters in tests
          assert.strictEqual(
            md.render(fixture.first.text, Object.assign({}, env || {})),
            fixture.second.text.replace(/\u21a9(?!\ufe0e)/g, '\u21a9\ufe0e')
          )
        })
      })
    })
  })
}

describe('footnote.txt', function () {
  const md = markdownit({ linkify: true }).use(footnote)

  // Check that defaults work correctly
  generate(fileURLToPath(new URL('fixtures/footnote.txt', import.meta.url)), md)
})

describe('no backrefs', function () {
  const md = markdownit({ linkify: true }).use(footnote, { backrefs: false })

  // Check that backrefs are disabled correctly
  generate(fileURLToPath(new URL('fixtures/no-backrefs.txt', import.meta.url)), md)
})

describe('no sub-ids', function () {
  const md = markdownit({ linkify: true }).use(footnote, { sub_ids: false, backrefs: false })

  // Check that sub-ids are disabled correctly
  generate(fileURLToPath(new URL('fixtures/no-sub-ids.txt', import.meta.url)), md)
})

describe('custom docId in env', function () {
  const md = markdownit().use(footnote)

  // Now check that using `env.documentId` works to prefix IDs
  generate(fileURLToPath(new URL('fixtures/footnote-prefixed.txt', import.meta.url)), md, { docId: 'test-doc-id' })
})
