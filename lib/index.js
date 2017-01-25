'use strict';

// fake symbols
function _symbol(key) {
  return `__Symbol${new Date().getMilliseconds()}${key}__`;
}

const reValueWithSpaces = / ((?!-)[^\s:=]+)([\s=:]?["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.-]+)[=\s](["'][^"']+["']) /g;
const reMatchKeyValue = /^(?!\d)[\w.-]+([=:])/;
const reTrimQuotes = /^["']+/g;
const reTrimDashes = /^-+/g;
const reCamelCase = /-(\w)/g;

const __QUOTE__ = _symbol('QUOTE');
const __APOS__ = _symbol('APOS');
const __SPA__ = _symbol('SPA');

const reSpecialChars = ['"', "'", ' '];
const reEscapeChars = [/\\"/g, /\\'/g, /\\ /g];
const reQuotedChars = [__QUOTE__, __APOS__, __SPA__];
const reUnescapeChars = [__QUOTE__, __APOS__, __SPA__].map(x => new RegExp(x, 'g'));

module.exports = (value, opts, cb) => {
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
  opts.asBool = typeof opts.asBool !== 'undefined'
    ? opts.asBool : true;

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

  // will consume "boolean", "k=v" or "k:v" params
  function a(prev, cur) {
    if (reMatchKeyValue.test(prev)) {
      const char = prev.match(reMatchKeyValue)[1];
      const offset = prev.indexOf(char);

      const k = c(prev.substr(0, offset).replace(reTrimDashes, ''));
      const v = f(prev.substr(offset + 1));

      if (prev.charAt() === '-') {
        flags[k] = v;
      } else if (char === ':') {
        params[k] = v;
      } else {
        data[k] = v;
      }

      /* istanbul ignore else */
      if (cur && (cur.indexOf(':') > -1 || cur.indexOf('=') > -1)) {
        a(cur);
        return;
      }

      return cur;
    } else {
      data[c(prev)] = opts.asBool;
    }
  }

  if (!Array.isArray(value)) {
    // "normalize" input
    value = ` ${e(String(value || ''))} `;

    // value="with spaces" || param:"with spaces"
    value = value.replace(reValueWithSpaces, (_, $1, $2) => {
      const v = f($2.substr(1, $2.length - 2)).replace(reTrimQuotes, '');

      if ($2.charAt() === ':') {
        params[c($1)] = v;
      } else {
        data[c($1)] = v;
      }
      return ' - ';
    });

    // --flag "with spaces"
    value = value.replace(reFlagWithSpaces, (_, $1, $2) => {
      flags[c($1)] = f($2.substr(1, $2.length - 2));
      return ' - ';
    });

    // tokenize
    value = value.split(/\s+/);
  }

  // collect params from left-to-right
  value.concat('-').reduce((prev, cur) => {
    // normalize key
    const key = typeof prev === 'string'
      ? u(prev.replace(reTrimDashes, '')) : null;

    /* istanbul ignore else */
    if (!key) {
      return cur;
    }

    /* istanbul ignore else */
    if (key.indexOf(':') > -1 || key.indexOf('=') > -1) {
      return a(prev, cur);
    }

    /* istanbul ignore else */
    if (prev !== '-' && prev.charAt() === '-') {
      if (reMatchKeyValue.test(cur)) {
        a(cur);
      } else if (cur !== '-' && cur.charAt() !== '-') {
        // non-flag, probably a value?
        flags[key] = f(cur) || true;
        return;
      }

      // consecutive flags
      flags[key] = true;
      return cur;
    }

    /* istanbul ignore else */
    if (prev !== '-' && prev.charAt() !== '-') {
      a(prev);
    }

    return cur;
  }, '');

  return { data: opts.asArray ? Object.keys(data) : data, flags, params};
};
