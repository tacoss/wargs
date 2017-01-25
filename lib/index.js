'use strict';

const reValueWithSpaces = / ((?!-)[\w.]+)([=:]["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.-]+)[=\s](["'][^"']+["']) /g;
const reMatchKeyValue = /^[\w.-]+=/;
const reTrimDashes = /^-+/g;
const reCamelCase = /-(\w)/g;

const reEscapeChars = [/\\"/g, /\\'/g, /\\ /g];
const reQuotedChars = ['__QUOTE__', '__APOS__', '__SPA__'];

const reUnescapeChars = [/__QUOTE__/g, /__APOS__/g, /__SPA__/g];
const reSpecialChars = ['"', "'", ' '];

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
  opts.default = typeof opts.default !== 'undefined'
    ? opts.default : true;

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
    return opts.camelize
      ? u(val).replace(reCamelCase, (_, $1) => $1.toUpperCase()) : u(val);
  }

  // will consume "boolean" or "k:v" params
  function a(prev) {
    const offset = prev.indexOf(':');

    if (offset === -1) {
      data[c(prev)] = opts.default;
    } else {
      params[c(prev.substr(0, offset))] = f(prev.substr(offset + 1));
    }
  }

  if (Array.isArray(value)) {
    // discard possible data/flags
    value = value.reduce((prev, x) => {
      const offset = x.indexOf('=');

      let val = offset > -1 ? x.substr(offset + 1) : x;

      /* istanbul ignore else */
      if (offset > -1) {
        x = x.substr(0, offset);

        /* istanbul ignore else */
        if (x.charAt() === '-') {
          flags[c(x.replace(reTrimDashes, ''))] = val;
        } else {
          data[c(x)] = val;
        }
        return prev;
      }
      return prev.concat(x);
    }, []);
  } else {
    // "normalize" input
    value = ` ${e(String(value || ''))} `;

    // value="with spaces" || param:"with spaces"
    value = value.replace(reValueWithSpaces, (_, $1, $2) => {
      const v = f($2.substr(2, $2.length - 3));

      if ($2.charAt() === '=') {
        data[c($1)] = v;
      } else {
        params[c($1)] = v;
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
  value.reduce((prev, cur) => {
    // normalize key
    const key = typeof prev === 'string'
      ? u(prev.replace(reTrimDashes, '')) : null;

    /* istanbul ignore else */
    if (prev === true || !key) {
      return cur;
    }

    /* istanbul ignore else */
    if (reMatchKeyValue.test(prev)) {
      // key=value || --key=value || -k=v
      const o = prev.indexOf('=');
      const k = prev.substr(0, o).replace(reTrimDashes, '');
      const v = f(prev.substr(o + 1)) || '';

      /* istanbul ignore else */
      if (prev.charAt() !== '-') {
        // not a flag, param
        data[c(k)] = v;
        return cur;
      }

      flags[c(k)] = v;
      return cur;
    }

    /* istanbul ignore else */
    if (prev !== '-' && prev.charAt() === '-') {
      /* istanbul ignore else */
      if (cur !== '-' && cur.charAt() !== '-') {
        // non-flag, probably a value?
        flags[key] = f(cur) || true;
        return true;
      }

      // consecutive flags
      flags[key] = true;
      return cur;
    }

    /* istanbul ignore else */
    if (prev && prev.charAt() !== '-') {
      a(prev);
    }

    /* istanbul ignore else */
    if (cur && cur.charAt() !== '-') {
      a(cur);
    }

    return cur;
  }, '');

  return { data, flags, params };
};
