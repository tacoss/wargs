'use strict';

const reValueWithSpaces = / ((?!-)[\w.]+)([=:]["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.]+)[=\s](["'][^"']+["']) /g;
const reMatchKeyValue = /^[\w.-]+=/;
const reTrimDashes = /^-+/g;

const reEscapeChars = [/\\"/g, /\\'/g, /\\ /g];
const reQuotedChars = ['__QUOTE__', '__APOS__', '__SPA__'];

const reUnescapeChars = [/__QUOTE__/g, /__APOS__/g, /__SPA__/g];
const reSpecialChars = ['"', "'", ' '];

module.exports = (value, opts, cb) => {
  const data = {};
  const flags = {};
  const params = {};

  /* istanbul ignore else */
  if (Array.isArray(value)) {
    value = value.reduce((prev, x) => {
      const offset = x.indexOf('=');

      let val = offset > -1 ? x.substr(offset + 1) : x;

      /* istanbul ignore else */
      if (offset > -1) {
        x = x.substr(0, offset);

        /* istanbul ignore else */
        if (x.charAt() === '-') {
          flags[u(x.replace(reTrimDashes, ''))] = val;
        } else {
          data[u(x)] = val;
        }
        return prev;
      }
      return prev.concat(x);
    }, []);
  }

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

  function e(val) {
    // "escape" special chars
    return reEscapeChars
      .reduce((prev, cur, i) => prev.replace(cur, reQuotedChars[i]), val);
  }

  function u(val) {
    // "unescape" quotes
    return reUnescapeChars
      .reduce((prev, cur, i) => prev.replace(cur, reSpecialChars[i]), val);
  }

  function c(val) {
    /* istanbul ignore else */
    if (typeof cb === 'function') {
      return cb(u(val));
    }
    return u(val);
  }

  function a(prev) {
    const offset = prev.indexOf(':');

    if (offset === -1) {
      data[u(prev)] = opts.default;
    } else {
      params[u(prev.substr(0, offset))] = c(prev.substr(offset + 1));
    }
  }

  /* istanbul ignore else */
  if (!Array.isArray(value)) {
    // "normalize" input
    value = ` ${e(String(value || ''))} `;

    // value="with spaces" || param:"with spaces"
    value = value.replace(reValueWithSpaces, (_, $1, $2) => {
      const v = c($2.substr(2, $2.length - 3));

      if ($2.charAt() === '=') {
        data[u($1)] = v;
      } else {
        params[u($1)] = v;
      }
      return ' - ';
    });

    // --flag "with spaces"
    value = value.replace(reFlagWithSpaces, (_, $1, $2) => {
      flags[u($1)] = c($2.substr(1, $2.length - 2));
      return ' - ';
    });

    // tokenize
    value = value.split(/\s+/);
  }

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
      const o = prev.indexOf('=');
      const k = prev.substr(0, o).replace(reTrimDashes, '');
      const v = c(prev.substr(o + 1)) || '';

      /* istanbul ignore else */
      if (prev.charAt() !== '-') {
        data[u(k)] = v;
        return cur;
      }

      flags[u(k)] = v;
      return cur;
    }

    /* istanbul ignore else */
    if (prev !== '-' && prev.charAt() === '-') {
      /* istanbul ignore else */
      if (cur !== '-' && cur.charAt() !== '-') {
        flags[key] = c(cur) || true;
        return true;
      }

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
