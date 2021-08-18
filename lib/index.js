'use strict';

// fake symbols
const $$ = key => `__Symbol@@${key}__`;
const __QUOTE__ = $$('QUOTE');
const __APOS__ = $$('APOS');
const __SPA__ = $$('SPA');

const RE_CAMEL_CASE = /-(\w)/g;

const RE_MATCH_KEYVAL = /^((?!\d)[-~+./\w]+)([=:])(.+?)?$/;
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
    return cb(value);
  }

  return value;
}

// fast camelcasing
function camelcase(value) {
  return value.replace(RE_CAMEL_CASE, (_, char) => char.toUpperCase());
}

// normalize long-flags as camelCase
function autocamelcase(value, raw) {
  if (typeof value === 'string') {
    /* istanbul ignore else */
    if ((raw || value.indexOf('--') === 0) && value.indexOf('no-') === -1) {
      /* istanbul ignore else */
      if (value.indexOf('=') === -1) {
        return raw ? camelcase(value) : `--${camelcase(value.substr(2))}`;
      }

      let [key, ...val] = value.split('=');
      key = raw ? camelcase(key) : `--${camelcase(key.substr(2))}`;
      val = val.length > 1 ? val.join('=') : val[0];

      return `${key}=${val}`;
    }

    return value;
  }

  return value.map(arg => autocamelcase(arg, raw));
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
    cb = opts.format;
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

  /* istanbul ignore else */
  if (typeof opts.boolean === 'string') {
    opts.boolean = opts.boolean.split('');
  }

  /* istanbul ignore else */
  if (typeof opts.string === 'string') {
    opts.string = opts.string.split('');
  }

  /* istanbul ignore else */
  if (opts.boolean) {
    opts.boolean = autocamelcase(opts.boolean, true);
  }

  /* istanbul ignore else */
  if (opts.string) {
    opts.string = autocamelcase(opts.string, true);
  }

  /* istanbul ignore else */
  if (opts.alias) {
    Object.keys(opts.alias).forEach(key => {
      opts.alias[key] = autocamelcase(opts.alias[key], true);
    });
  }

  const _flags = getopts(autocamelcase(argv), opts);
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
      /* istanbul ignore else */
      if (_flags[opts.alias[key]]) {
        _flags[opts.alias[key].substr(3)] = false;
      }

      _flags[key] = true;
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
      } else if (_params[matches[1]]) {
        /* istanbul ignore else */
        if (!Array.isArray(_params[matches[1]])) {
          _params[matches[1]] = [_params[matches[1]]];
        }

        _params[matches[1]].push(evaluate(matches[3] || '', cb));
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
