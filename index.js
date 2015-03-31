// Process footnotes
//
'use strict';

module.exports = function(md) {
  ////////////////////////////////////////////////////////////////////////////////
  // Plugin default options
  var sub_plugin_options;

  ////////////////////////////////////////////////////////////////////////////////
  // Renderer partials

  function _footnote_ref(tokens, idx) {
    var n = Number(tokens[idx].meta.id + 1).toString(),
        href = '#fn' + n,
        id = 'fnref' + n,
        label = tokens[idx].meta.label,
        linkText = '[' + n  + ']',
        isInlineFootnote;
    if (tokens[idx].meta.subId > 0) {
      id += ':' + tokens[idx].meta.subId;
    }
    if (sub_plugin_options.labels_in_link) {
      isInlineFootnote = typeof label !== 'string';
      if (isInlineFootnote) {
        label = n;
      }
      id += ':' + label;
      href += ':' + label;
    }
    if (sub_plugin_options.plain_links) {
      linkText = n;
    }
    return '<sup class="footnote-ref"><a href="' + href + '" id="' + id + '">' + linkText + '</a></sup>';
  }
  function _footnote_block_open(tokens, idx, options) {
    return (options.xhtmlOut ? '<hr class="footnotes-sep" />\n' : '<hr class="footnotes-sep">\n') +
           '<section class="footnotes">\n' +
           '<ol class="footnotes-list">\n';
  }
  function _footnote_block_close() {
    return '</ol>\n</section>\n';
  }
  function _footnote_open(tokens, idx) {
    var id = Number(tokens[idx].meta.id + 1).toString(),
        label = tokens[idx].meta.label,
        isInlineFootnote;
    if (sub_plugin_options.labels_in_link) {
      isInlineFootnote = typeof label !== 'string';
      if (isInlineFootnote) {
        label = id;
      }
      id += ':' + label;
    }
    return '<li id="fn' + id + '"  class="footnote-item">';
  }
  function _footnote_close() {
    return '</li>\n';
  }
  function _footnote_anchor(tokens, idx) {
    var n = Number(tokens[idx].meta.id + 1).toString(),
        id = 'fnref' + n,
        label = tokens[idx].meta.label,
        isInlineFootnote;
    if (tokens[idx].meta.subId > 0) {
      id += ':' + tokens[idx].meta.subId;
    }
    if (sub_plugin_options.labels_in_link) {
      isInlineFootnote = typeof label !== 'string';
      if (isInlineFootnote) {
        label = n;
      }
      id += ':' + label;
    }
    return ' <a href="#' + id + '" class="footnote-backref">\u21a9</a>'; /* ↩ */
  }

  ////////////////////////////////////////////////////////////////////////////////

  function sub_plugin(md) {

    var parseLinkLabel = md.helpers.parseLinkLabel;

    md.renderer.rules.footnote_ref          = _footnote_ref;
    md.renderer.rules.footnote_block_open   = _footnote_block_open;
    md.renderer.rules.footnote_block_close  = _footnote_block_close;
    md.renderer.rules.footnote_open         = _footnote_open;
    md.renderer.rules.footnote_close        = _footnote_close;
    md.renderer.rules.footnote_anchor       = _footnote_anchor;

    // Process footnote block definition
    function footnote_def(state, startLine, endLine, silent) {
      var oldBMark, oldTShift, oldParentType, pos, label, token,
          start = state.bMarks[startLine] + state.tShift[startLine],
          max = state.eMarks[startLine];

      // line should be at least 5 chars - "[^x]:"
      if (start + 4 > max) { return false; }

      if (state.src.charCodeAt(start) !== 0x5B/* [ */) { return false; }
      if (state.src.charCodeAt(start + 1) !== 0x5E/* ^ */) { return false; }

      for (pos = start + 2; pos < max; pos++) {
        if (state.src.charCodeAt(pos) === 0x20) { return false; }
        if (state.src.charCodeAt(pos) === 0x5D /* ] */) {
          break;
        }
      }

      if (pos === start + 2) { return false; } // no empty footnote labels
      if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3A /* : */) { return false; }
      if (silent) { return true; }
      pos++;

      if (!state.env.footnotes) { state.env.footnotes = {}; }
      if (!state.env.footnotes.refs) { state.env.footnotes.refs = {}; }
      label = state.src.slice(start + 2, pos - 2);
      state.env.footnotes.refs[':' + label] = -1;

      token       = new state.Token('footnote_reference_open', '', 1);
      token.meta  = { label: label };
      token.level = state.level++;
      state.tokens.push(token);

      oldBMark = state.bMarks[startLine];
      oldTShift = state.tShift[startLine];
      oldParentType = state.parentType;
      state.tShift[startLine] = state.skipSpaces(pos) - pos;
      state.bMarks[startLine] = pos;
      state.blkIndent += 4;
      state.parentType = 'footnote';

      if (state.tShift[startLine] < state.blkIndent) {
        state.tShift[startLine] += state.blkIndent;
        state.bMarks[startLine] -= state.blkIndent;
      }

      state.md.block.tokenize(state, startLine, endLine, true);

      state.parentType = oldParentType;
      state.blkIndent -= 4;
      state.tShift[startLine] = oldTShift;
      state.bMarks[startLine] = oldBMark;

      token       = new state.Token('footnote_reference_close', '', -1);
      token.level = --state.level;
      state.tokens.push(token);

      return true;
    }

    // Process inline footnotes (^[...])
    function footnote_inline(state, silent) {
      var labelStart,
          labelEnd,
          footnoteId,
          oldLength,
          token,
          max = state.posMax,
          start = state.pos;

      if (start + 2 >= max) { return false; }
      if (state.src.charCodeAt(start) !== 0x5E/* ^ */) { return false; }
      if (state.src.charCodeAt(start + 1) !== 0x5B/* [ */) { return false; }

      labelStart = start + 2;
      labelEnd = parseLinkLabel(state, start + 1);

      // parser failed to find ']', so it's not a valid note
      if (labelEnd < 0) { return false; }

      // We found the end of the link, and know for a fact it's a valid link;
      // so all that's left to do is to call tokenizer.
      //
      if (!silent) {
        if (!state.env.footnotes) { state.env.footnotes = {}; }
        if (!state.env.footnotes.list) { state.env.footnotes.list = []; }
        footnoteId = state.env.footnotes.list.length;

        state.pos = labelStart;
        state.posMax = labelEnd;

        token      = state.push('footnote_ref', '', 0);
        token.meta = { id: footnoteId };

        oldLength = state.tokens.length;
        state.md.inline.tokenize(state);
        state.env.footnotes.list[footnoteId] = { tokens: state.tokens.splice(oldLength) };
        token.meta.label = state.env.footnotes.list[footnoteId].tokens;
      }

      state.pos = labelEnd + 1;
      state.posMax = max;
      return true;
    }

    // Process footnote references ([^...])
    function footnote_ref(state, silent) {
      var label,
          pos,
          footnoteId,
          footnoteSubId,
          token,
          max = state.posMax,
          start = state.pos;

      // should be at least 4 chars - "[^x]"
      if (start + 3 > max) { return false; }

      if (!state.env.footnotes || !state.env.footnotes.refs) { return false; }
      if (state.src.charCodeAt(start) !== 0x5B/* [ */) { return false; }
      if (state.src.charCodeAt(start + 1) !== 0x5E/* ^ */) { return false; }

      for (pos = start + 2; pos < max; pos++) {
        if (state.src.charCodeAt(pos) === 0x20) { return false; }
        if (state.src.charCodeAt(pos) === 0x0A) { return false; }
        if (state.src.charCodeAt(pos) === 0x5D /* ] */) {
          break;
        }
      }

      if (pos === start + 2) { return false; } // no empty footnote labels
      if (pos >= max) { return false; }
      pos++;

      label = state.src.slice(start + 2, pos - 1);
      if (typeof state.env.footnotes.refs[':' + label] === 'undefined') { return false; }

      if (!silent) {
        if (!state.env.footnotes.list) { state.env.footnotes.list = []; }

        if (state.env.footnotes.refs[':' + label] < 0) {
          footnoteId = state.env.footnotes.list.length;
          state.env.footnotes.list[footnoteId] = { label: label, count: 0 };
          state.env.footnotes.refs[':' + label] = footnoteId;
        } else {
          footnoteId = state.env.footnotes.refs[':' + label];
        }

        footnoteSubId = state.env.footnotes.list[footnoteId].count;
        state.env.footnotes.list[footnoteId].count++;

        token      = state.push('footnote_ref', '', 0);
        token.meta = { id: footnoteId, subId: footnoteSubId, label: label };
      }

      state.pos = pos;
      state.posMax = max;
      return true;
    }

    // Glue footnote tokens to end of token stream
    function footnote_tail(state) {
      var i, l, j, t, lastParagraph, list, token, tokens, current, currentLabel,
          insideRef = false,
          refTokens = {};

      if (!state.env.footnotes) { return; }

      state.tokens = state.tokens.filter(function(tok) {
        if (tok.type === 'footnote_reference_open') {
          insideRef = true;
          current = [];
          currentLabel = tok.meta.label;
          return false;
        }
        if (tok.type === 'footnote_reference_close') {
          insideRef = false;
          // prepend ':' to avoid conflict with Object.prototype members
          refTokens[':' + currentLabel] = current;
          return false;
        }
        if (insideRef) { current.push(tok); }
        return !insideRef;
      });

      if (!state.env.footnotes.list) { return; }
      list = state.env.footnotes.list;

      token = new state.Token('footnote_block_open', '', 1);
      state.tokens.push(token);

      for (i = 0, l = list.length; i < l; i++) {
        token      = new state.Token('footnote_open', '', 1);
        token.meta = { id: i, label: list[i].label };
        state.tokens.push(token);

        if (list[i].tokens) {
          tokens = [];

          token          = new state.Token('paragraph_open', 'p', 1);
          token.block    = true;
          tokens.push(token);

          token          = new state.Token('inline', '', 0);
          token.children = list[i].tokens;
          token.content  = '';
          tokens.push(token);

          token          = new state.Token('paragraph_close', 'p', -1);
          token.block    = true;
          tokens.push(token);

        } else if (list[i].label) {
          tokens = refTokens[':' + list[i].label];
        }

        state.tokens = state.tokens.concat(tokens);
        if (state.tokens[state.tokens.length - 1].type === 'paragraph_close') {
          lastParagraph = state.tokens.pop();
        } else {
          lastParagraph = null;
        }

        t = list[i].count > 0 ? list[i].count : 1;
        for (j = 0; j < t; j++) {
          token      = new state.Token('footnote_anchor', '', 0);
          token.meta = { id: i, subId: j, label: list[i].label };
          state.tokens.push(token);
        }

        if (lastParagraph) {
          state.tokens.push(lastParagraph);
        }

        token = new state.Token('footnote_close', '', -1);
        state.tokens.push(token);
      }

      token = new state.Token('footnote_block_close', '', -1);
      state.tokens.push(token);
    }

    md.block.ruler.before('reference', 'footnote_def', footnote_def, { alt: [ 'paragraph', 'reference' ] });
    md.inline.ruler.after('image', 'footnote_inline', footnote_inline);
    md.inline.ruler.after('footnote_inline', 'footnote_ref', footnote_ref);
    md.core.ruler.after('inline', 'footnote_tail', footnote_tail);
  }

  var isOldCall = md instanceof require('markdown-it');
  sub_plugin_options = {
    'plain_links': false,
    'labels_in_link': false
  };
  if (isOldCall) {
    return sub_plugin(md);
  }
  if (md) {
    sub_plugin_options = require('merge')(sub_plugin_options, md);
  }
  return sub_plugin;
};
