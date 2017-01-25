'use strict';

const reValueWithSpaces = / ((?!-)[\w.]+)=(["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.]+)[=\s](["'][^"']+["']) /g;
const reTrimTrailingDashes = /^-+/g;
const reMatchKeyValue = /^[\w.-]+=(?!=)/;

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

  function u(val) {
    // "unescape" quotes
    return reUnescapeChars
      .reduce((prev, cur, i) => prev.replace(cur, reSpecialChars[i]), val);
  }

  function e(val) {
    /* istanbul ignore else */
    if (typeof cb === 'function') {
      return cb(u(val));
    }

    return u(val);
  }

  // "normalize" input
  value = ` ${Array.isArray(value) ? value.map((x) => {
    /* istanbul ignore else */
    if (x.indexOf(' ') === -1) {
      return x;
    }

    const offset = x.indexOf('=');

    /* istanbul ignore else */
    if (offset === -1) {
      return `"${x}"`;
    }

    return `${x.substr(0, offset)}="${x.substr(offset + 1)}"`;
  }).join(' - ') : value || ''} `;

  // "escape" special chars
  value = reEscapeChars
    .reduce((prev, cur, i) => prev.replace(cur, reQuotedChars[i]), value);

  // value="with spaces"
  value = value.replace(reValueWithSpaces, (_, $1, $2) => {
    data[u($1)] = e($2.substr(1, $2.length - 2));
    return ' - ';
  });

  // --flag "with spaces"
  value = value.replace(reFlagWithSpaces, (_, $1, $2) => {
    flags[u($1)] = e($2.substr(1, $2.length - 2));
    return ' - ';
  });

  value.split(/\s+/).reduce((prev, cur) => {
    // normalize key
    const key = typeof prev === 'string'
      ? u(prev.replace(reTrimTrailingDashes, '')) : null;

    /* istanbul ignore else */
    if (prev === true || !key) {
      return cur;
    }

    let offset;

    /* istanbul ignore else */
    if (reMatchKeyValue.test(prev)) {
      offset = prev.indexOf('=');

      const k = prev.substr(0, offset);
      const v = prev.substr(offset + 1);

      if (k.charAt() === '-') {
        flags[u(k.replace(reTrimTrailingDashes, ''))] = e(v);
      } else {
        data[u(k)] = e(v);
      }

      /* istanbul ignore else */
      if (prev.charAt() === '-') {
        flags[key] = true;
        return true;
      }

      return prev;
    }

    /* istanbul ignore else */
    if (prev.charAt() === '-') {
      /* istanbul ignore else */
      if (cur.charAt() !== '-') {
        flags[key] = e(cur) || true;
        return true;
      }

      flags[key] = true;
      return cur;
    }

    /* istanbul ignore else */
    if (prev) {
      if (prev.indexOf(':') === -1) {
        data[u(prev)] = opts.default;
      } else {
        offset = prev.indexOf(':');
        params[u(prev.substr(0, offset))] = e(prev.substr(offset + 1));
      }
    }

    return cur;
  }, '');

  return { data, flags, params };
};
