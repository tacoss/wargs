'use strict';

// fake symbols
const $$ = key => `__Symbol@@${key}__`;
const __QUOTE__ = $$('QUOTE');
const __APOS__ = $$('APOS');
const __SPA__ = $$('SPA');

const RE_CAMEL_CASE = /-(\w)/g;

const RE_MATCH_KEYVAL = /^((?!\d)[-~+.\w]+)([=:])(.+?)?$/;
const RE_MATCH_QUOTES = /(["'])(?:(?!\1).)*\1/;

const RE_SPECIAL_CHARS = ['"', "'", ' '];
const RE_ESCAPE_CHARS = [/\\"/g, /\\'/g, /\\ /g];
const RE_QUOTED_CHARS = [__QUOTE__, __APOS__, __SPA__];
const RE_UNESCAPE_CHARS = [__QUOTE__, __APOS__, __SPA__].map(_ => new RegExp(_, 'g'));

const getopts = require('getopts');

// "escape" special chars
function escape(val) {
  return RE_ESCAPE_CHARS
    .reduce((prev, cur, i) => prev.replace(cur, RE_QUOTED_CHARS[i]), val);
}

// "unescape" quotes
function unescape(val) {
  return RE_UNESCAPE_CHARS
    .reduce((prev, cur, i) => prev.replace(cur, RE_SPECIAL_CHARS[i]), val);
}

// encode special chars within quotes
function unquote(val, extra) {
  while (RE_MATCH_QUOTES.test(val)) {
    const matches = val.match(RE_MATCH_QUOTES);
    const substr = matches[0].substr(1, matches[0].length - 2);

    val = val.replace(matches[0], RE_SPECIAL_CHARS
      .reduce((prev, cur, i) => prev.replace(cur, RE_QUOTED_CHARS[i]), substr));
  }

  /* istanbul ignore else */
  if (extra) {
    while (val.indexOf(' ') > -1) {
      val = RE_SPECIAL_CHARS
        .reduce((prev, cur, i) => prev.replace(cur, RE_QUOTED_CHARS[i]), val);
    }
  }

  return val.split(/\s+/);
}

// execute given callback
function evaluate(value, cb) {
  /* istanbul ignore else */
  if (typeof cb === 'function') {
    if (typeof value !== 'object') {
      return cb(value);
    }

    Object.keys(value).forEach(k => {
      value[k] = cb(value[k], k);
    });
  }

  return value;
}

// fast camelcasing
function camelcase(value) {
  return value.replace(RE_CAMEL_CASE, (_, char) => char.toUpperCase());
}

module.exports = (argv, opts, cb) => {
  opts = opts || {};

  /* istanbul ignore else */
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  /* istanbul ignore else */
  if (opts.format) {
    cb = opts.format || cb;
    delete opts.format;
  }

  /* istanbul ignore else */
  if (!Array.isArray(argv)) {
    // "normalize" input
    argv = escape(String(argv || ''));

    let test;

    do {
      test = argv.match(RE_MATCH_QUOTES);

      /* istanbul ignore else */
      if (test) {
        argv = argv.replace(test[0], unquote(test[0], true));
      }
    } while (test);

    // tokenize
    argv = argv.trim().split(/\s+/).map(unescape).filter(x => x);
  }

  const offset = argv.indexOf('--');
  const _raw = [];

  /* istanbul ignore else */
  if (offset > -1) {
    argv.slice(offset + 1).forEach(value => {
      _raw.push(evaluate(value, cb));
    });

    argv.splice(offset + 1, argv.length);
  }

  const _flags = getopts(argv, opts);
  const _extra = _flags._.slice();

  const _data = {};
  const _params = {};

  delete _flags._;

  Object.keys(_flags).forEach(key => {
    const value = _flags[key];

    /* istanbul ignore else */
    if (key.indexOf('-') !== -1) {
      delete _flags[key];

      key = camelcase(key);
    }

    /* istanbul ignore else */
    if (opts.alias && opts.alias[key] && opts.alias[key].indexOf('no-') === 0) {
      _flags[opts.alias[key].substr(3)] = !value;
      _flags[key] = !value;
    }

    /* istanbul ignore else */
    if (Array.isArray(value)) {
      _flags[key] = value.map(x => evaluate(x, cb));
    }

    /* istanbul ignore else */
    if (typeof value === 'string') {
      if (value.charAt() === '=') {
        _flags[key] = evaluate(value.substr(1), cb);
      } else {
        _flags[key] = evaluate(value, cb);
      }
    }
  });

  const __ = _extra.reduce((prev, cur) => {
    const matches = cur.match(RE_MATCH_KEYVAL);

    if (matches) {
      if (matches[2] === '=') {
        _data[matches[1]] = evaluate(matches[3] || '', cb);
      } else {
        _params[matches[1]] = evaluate(matches[3] || '', cb);
      }
    } else {
      prev.push(evaluate(cur, cb));
    }

    return prev;
  }, []);

  return {
    _: __,
    raw: _raw,
    data: _data,
    flags: _flags,
    params: _params,
  };
};
