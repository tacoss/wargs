'use strict';

// fake symbols
function _symbol(key) {
  return `__Symbol${new Date().getMilliseconds()}${key}__`;
}

const reValueWithSpaces = /(?:^| )([-~+.\w]+)([\s:=]?(["'])(?:(?!\3).)*\3)(?: |$)/;
const reMatchKeyValue = /^(?!\d)[-~+.\w]+([=:])/;
const reTrimDashes = /^--?/g;
const reCamelCase = /-(\w)/g;

const __QUOTE__ = _symbol('QUOTE');
const __APOS__ = _symbol('APOS');
const __SPA__ = _symbol('SPA');

const reSpecialChars = ['"', "'", ' '];
const reEscapeChars = [/\\"/g, /\\'/g, /\\ /g];
const reQuotedChars = [__QUOTE__, __APOS__, __SPA__];
const reUnescapeChars = [__QUOTE__, __APOS__, __SPA__].map(x => new RegExp(x, 'g'));

module.exports = (value, opts, cb) => {
  const _ = [];
  const data = {};
  const flags = {};
  const params = {};

  /* istanbul ignore else */
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  // defaults
  opts = opts || {};

  cb = typeof opts.format === 'function' ? opts.format : cb;

  // "escape" special chars
  function e(val) {
    return reEscapeChars
      .reduce((prev, cur, i) => prev.replace(cur, reQuotedChars[i]), val);
  }

  // "unescape" quotes
  function u(val) {
    return reUnescapeChars
      .reduce((prev, cur, i) => prev.replace(cur, reSpecialChars[i]), val);
  }

  // apply custom function
  function f(val) {
    /* istanbul ignore else */
    if (typeof cb === 'function') {
      return cb(u(val));
    }
    return u(val);
  }

  // convert foo-bar to fooBar
  function c(val) {
    return opts.camelCase
      ? u(val).replace(reCamelCase, (_, $1) => $1.toUpperCase()) : u(val);
  }

  // normalize keys
  function p(key) {
    return c(key.replace(reTrimDashes, ''));
  }

  // consume aliased shorthands
  function l(key, value) {
    const k = p(key);

    if (key.substr(0, 2) === '--') {
      if (k.substr(0, 3) === 'no-') {
        flags[k.substr(3)] = !value;
      } else {
        flags[k] = value;
      }
    } else {
      k.split('').forEach((char, key) => {
        const val = key === k.length - 1 ? value : true;

        if (opts.aliases && typeof opts.aliases[char] !== 'undefined') {
          flags[opts.aliases[char]] = val;
        } else {
          flags[char] = val;
        }
      });
    }
  }

  // will consume all quoted values
  function q(key, value, quote) {
    const char = value.charAt();
    const first = value.indexOf(quote) + 1;
    const last = value.lastIndexOf(quote);

    value = value.substr(first, last - first);

    /* istanbul ignore else */
    if (key.charAt() === '-') {
      l(key, f(value));
      return;
    }

    /* istanbul ignore else */
    if (char === '=') {
      data[c(key)] = f(value);
      return;
    }

    /* istanbul ignore else */
    if (char === ':') {
      params[c(key)] = f(value);
      return;
    }

    /* istanbul ignore else */
    if (char === ' ') {
      _.push(f(key));
      _.push(f(value));
      return;
    }

    _.push(f(key + value));
  }

  // will consume "boolean", "k=v" or "k:v" params
  function a(prev, cur) {
    /* istanbul ignore else */
    if (reMatchKeyValue.test(prev)) {
      const char = prev.match(reMatchKeyValue)[1];
      const offset = prev.indexOf(char);

      const k = prev.substr(0, offset);
      const v = f(prev.substr(offset + 1));

      if (k.charAt() === '-') {
        l(k, v);
      } else if (char === ':') {
        params[p(k)] = v;
      } else {
        data[p(k)] = v;
      }

      /* istanbul ignore else */
      if (cur && (cur.indexOf(':') > -1 || cur.indexOf('=') > -1)) {
        a(cur);
        return;
      }

      return cur;
    }

    _.push(f(prev));
  }

  if (!Array.isArray(value)) {
    // "normalize" input
    value = e(String(value || ''));

    let test;

    do {
      test = value.match(reValueWithSpaces);

      /* istanbul ignore else */
      if (test) {
        value = value.replace(test[0], ' ');
        q(test[1], test[2], test[3]);
      }
    } while (test);

    // tokenize
    value = value.split(/\s+/);
  }

  // collect params from left-to-right
  value.concat('-').reduce((prev, cur) => {
    // normalize key
    const key = typeof prev === 'string' ? u(prev) : null;

    /* istanbul ignore else */
    if (!key) {
      return cur;
    }

    /* istanbul ignore else */
    if (key.indexOf(':') > -1 || key.indexOf('=') > -1) {
      return a(key, cur);
    }

    /* istanbul ignore else */
    if (key !== '-' && key.charAt() === '-') {
      if (reMatchKeyValue.test(cur)) {
        a(cur);
      } else if (cur !== '-' && cur.charAt() !== '-') {
        // non-flag, probably a value?
        l(key, f(cur) || true);
        return;
      }

      // consecutive flags
      l(key, true);
      return cur;
    }

    /* istanbul ignore else */
    if (key !== '-' && key.charAt() !== '-') {
      a(key);
    }

    return cur;
  }, '');

  return { _, data, flags, params};
};
