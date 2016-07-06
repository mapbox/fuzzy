'use strict';

/*
 * Fuzzy
 * https://github.com/myork/fuzzy
 *
 * Copyright (c) 2012 Matt York
 * Licensed under the MIT license.
 */
var fuzzy = {};

// Return all elements of `array` that have a fuzzy
// match against `pattern`.
fuzzy.simpleFilter = function(pattern, array) {
  return array.filter(function(val) {
    return fuzzy.test(pattern, val);
  });
};

// Does `pattern` fuzzy match `val`?
fuzzy.test = function(pattern, val) {
  return fuzzy.match(pattern, val) !== null;
};

// If `pattern` matches `val`, wrap each matching character
// in `opts.pre` and `opts.post`. If no match, return null
fuzzy.match = function(pattern, val, opts) {
  opts = opts || {};
  var patternIdx = 0
    , result = []
    , len = val.toString().length
    , originalValType = typeof val
    , totalScore = 0
    , currScore = 0
  // prefix
    , pre = opts.pre || ''
    // suffix
    , post = opts.post || ''
    // val to compare against. This might be a lowercase version of the
    // raw val
    , compareVal = opts.caseSensitive && val.toString() || val.toString().toLowerCase()
    , ch;

  val = val.toString();
  pattern = opts.caseSensitive && pattern.toString() || pattern.toString().toLowerCase();

  // For each character in the val, either add it to the result
  // or wrap in template if it's the next val in the pattern
  for(var idx = 0; idx < len; idx++) {
    ch = val[idx];
    if(compareVal[idx] === pattern[patternIdx]) {
      ch = pre + ch + post;
      patternIdx += 1;

      // consecutive characters should increase the score more than linearly
      currScore += 1 + currScore;
    } else {
      currScore = 0;
    }
    totalScore += currScore;
    result[result.length] = ch;
  }

  // return rendered val if we have a match for every char
  if(patternIdx === pattern.length) {
    return {
      rendered: originalValType === 'number' ? Number(result.join('')) : result.join(''),
      score: totalScore};
  }

  return null;
};

// The normal entry point. Filters `arr` for matches against `pattern`.
// It returns an array with matching values of the type:
//
//     [{
//         val:   '<b>lah' // The rendered val
//       , index:    2        // The index of the element in `arr`
//       , original: 'blah'   // The original element in `arr`
//     }]
//
// `opts` is an optional argument bag. Details:
//
//    opts = {
//        // val to put before a matching character
//        pre:     '<b>'
//
//        // val to put after matching character
//      , post:    '</b>'
//
//        // Optional function. Input is an entry in the given arr`,
//        // output should be the val to test `pattern` against.
//        // In this example, if `arr = [{crying: 'koala'}]` we would return
//        // 'koala'.
//      , extract: function(arg) { return arg.crying; }
//    }
fuzzy.filter = function(pattern, arr, opts) {
  opts = opts || {};
  return arr
    .reduce(function(prev, element, idx) {
      var str = element;
      if(opts.extract) {
        str = opts.extract(element);
      }
      var rendered = fuzzy.match(pattern, str, opts);
      if(rendered != null) {
        prev[prev.length] = {
            val: rendered.rendered
          , score: rendered.score
          , index: idx
          , original: element
        };
      }
      return prev;
    }, [])

    // Sort by score. Browsers are inconsistent wrt stable/unstable
    // sorting, so force stable by using the index in the case of tie.
    // See http://ofb.net/~sethml/is-sort-stable.html
    .sort(function(a, b) {
      var compare = b.score - a.score;
      if(compare) return compare;
      return a.index - b.index;
    });
};

module.exports = fuzzy;
