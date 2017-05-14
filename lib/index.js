'use strict';

const reMatchKeyValue = /^(?!\d)[-~+.\w]+([=:])/;
const reMatchQuotes = /(["'])(?:(?!\1).)*\1/;
const reTrimDashes = /^--?/g;
const reCamelCase = /-(\w)/g;

// fake symbols
const $$ = key => `__Symbol@@${key}__`;
const __QUOTE__ = $$('QUOTE');
const __APOS__ = $$('APOS');
const __SPA__ = $$('SPA');

const reSpecialChars = ['"', "'", ' '];
const reEscapeChars = [/\\"/g, /\\'/g, /\\ /g];
const reQuotedChars = [__QUOTE__, __APOS__, __SPA__];
const reUnescapeChars = [__QUOTE__, __APOS__, __SPA__].map(x => new RegExp(x, 'g'));

module.exports = (argv, opts, cb) => {
  const _ = [];
  const __ = [];
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

  opts.aliases = opts.aliases || {};
  opts.defaults = opts.defaults || {};

  opts.arrays = (typeof opts.arrays === 'string' ? opts.arrays.split('') : (opts.arrays || []))
    .map(shorthand => opts.aliases[shorthand] || shorthand);

  opts.booleans = (typeof opts.booleans === 'string' ? opts.booleans.split('') : (opts.booleans || []))
    .map(shorthand => opts.aliases[shorthand] || shorthand);

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

  // encode special chars within quotes
  function z(val, extra) {
    while (reMatchQuotes.test(val)) {
      const matches = val.match(reMatchQuotes);
      const substr = matches[0].substr(1, matches[0].length - 2);

      val = val.replace(matches[0], reSpecialChars
        .reduce((prev, cur, i) => prev.replace(cur, reQuotedChars[i]), substr));
    }

    /* istanbul ignore else */
    if (extra) {
      while (val.indexOf(' ') > -1) {
        val = reSpecialChars
          .reduce((prev, cur, i) => prev.replace(cur, reQuotedChars[i]), val);
      }
    }

    return val.split(/\s+/);
  }

  // convert foo-bar to fooBar
  function c(val) {
    return opts.camelCase
      ? val.replace(reCamelCase, (_, $1) => $1.toUpperCase()) : val;
  }

  // apply custom function
  function f(val) {
    /* istanbul ignore else */
    if (typeof cb === 'function') {
      return cb(u(val));
    }
    return u(val);
  }

  // push data
  function p(val) {
    /* istanbul ignore else */
    if (typeof val === 'string' && val.length) {
      _.push(val);
    }
  }

  // decode values
  function x(val) {
    return val.map(u);
  }

  // append flags
  function n(val, def) {
    val = val.indexOf('no-') === 0
      ? c(val.substr(3))
      : c(val);

    if (opts.arrays.indexOf(val) > -1) {
      flags[val] = Array.isArray(flags[val]) ? flags[val] : [];

      /* istanbul ignore else */
      if (typeof def !== 'boolean') {
        flags[val].push(def);
      }
    } else {
      flags[val] = def;
    }
  }

  // defaults
  function d(prop, def) {
    let value = typeof prop.value === 'string'
      ? f(prop.value)
      : undefined;

    /* istanbul ignore else */
    if (typeof value === 'undefined') {
      value = opts.defaults[prop.key];
    }

    return typeof value !== 'undefined' ? value : def;
  }

  // append data
  function a(prop) {
    if (prop.type === 'flag') {
      n(prop.key, d(prop, prop.key.indexOf('no-') === 0 ? false : true));
    } else if (prop.type === 'param') {
      params[prop.key] = f(prop.value);
    } else if (prop.type === 'data') {
      data[prop.key] = f(prop.value);
    }
  }

  // single flags
  function s(key, value) {
    key = key.replace(reTrimDashes, '').split('');

    const d = {
      key: key.pop(),
      type: 'flag',
    };

    d.key = opts.aliases[d.key] || d.key;
    d.boolean = opts.booleans.indexOf(d.key) > -1;

    // check if residual flags are booleans!
    key.forEach(char => {
      const prop = opts.aliases[char] || char;

      /* istanbul ignore else */
      if (value !== true && opts.booleans.indexOf(prop) === -1) {
        throw new Error(`Missing value for '-${char}' flag`);
      }

      n(prop, true);
    });

    return d;
  }

  // parse token
  function l(key) {
    // k:v | k=v | -k=y | --k=v
    const m = key.match(reMatchKeyValue);

    /* istanbul ignore else */
    if (m) {
      /* istanbul ignore else */
      if (m[1] === '=' && m[0].indexOf('--') === 0) {
        key = (m[0].substr(0, m[0].length - 1)).replace(reTrimDashes, '');

        // long flags with values --x=y
        return {
          key,
          type: 'flag',
          value: m.input.substr(m[0].length),
          boolean: opts.booleans.indexOf(opts.aliases[key] || key) > -1
        };
      }

      /* istanbul ignore else */
      if (m[0].charAt() === '-') {
        const d = s(m[0].substr(0, m[0].length - 1), true);

        /* istanbul ignore else */
        if (opts.booleans.indexOf(d.key) > -1) {
          throw new Error(`Unexpected value for '-${d.key}' flag`);
        }

        // short flags with values -a=b
        d.value = m.input.substr(m[0].length);

        return d;
      }

      return {
        key: m[0].substr(0, m[0].length - 1),
        type: m[1] === '=' ? 'data' : 'param',
        value: m.input.substr(m[0].length),
      };
    }

    /* istanbul ignore else */
    if (key.indexOf(__SPA__) > -1 || key.indexOf(__QUOTE__) > -1) {
      // skip white-space | quotes
      return { value: f(key) };
    }

    /* istanbul ignore else */
    if (key.indexOf('--') === 0) {
      key = key.substr(2);

      // long flags
      return {
        key,
        type: 'flag',
        boolean: opts.booleans.indexOf(opts.aliases[key] || key) > -1
      };
    }

    /* istanbul ignore else */
    if (key.charAt() === '-') {
      // short flags
      return s(key);
    }

    // regular value (?)
    return { value: f(key) };
  }

  /* istanbul ignore else */
  if (!Array.isArray(argv)) {
    // "normalize" input
    argv = e(String(argv || ''));

    /* istanbul ignore else */
    if (argv.indexOf(' -- ') > -1) {
      Array.prototype.push.apply(__, x(z(argv.substr(argv.indexOf(' -- ') + 4))));
      argv = argv.substr(0, argv.indexOf(' -- '));
    }

    let test;

    do {
      test = argv.match(reMatchQuotes);

      /* istanbul ignore else */
      if (test) {
        argv = argv.replace(test[0], z(test[0], true));
      }
    } while (test);

    // tokenize
    argv = argv.split(/\s+/);
  }

  const offset = argv.indexOf('--');

  /* istanbul ignore else */
  if (offset > -1) {
    Array.prototype.push.apply(__, argv.slice(offset + 1));

    if (offset) {
      argv = argv.slice(0, offset);
    } else {
      argv = [];
    }
  }

  // tokenize and skip complex-values
  const tokens = argv
    .reduce((prev, cur) => {
      const last = prev[prev.length - 1];

      if (last
        && last.type === 'flag'
        && last.boolean === false
        && typeof last.value === 'undefined' && reMatchKeyValue.test(cur)
      ) {
        last.value = cur;
      } else {
        prev.push(l(cur));
      }

      return prev;
    }, []);

  // collect params from left-to-right
  tokens
    .reduce((prev, cur) => {
      /* istanbul ignore else */
      if (!prev) {
        /* istanbul ignore else */
        if (!cur.type) {
          p(cur.value);
          return null;
        }

        a(cur);
        return cur;
      }

      /* istanbul ignore else */
      if (prev.type === 'data' || prev.type === 'param') {
        a(prev);
        a(cur);
        return cur;
      }

      /* istanbul ignore else */
      if (prev.type === 'flag') {
        /* istanbul ignore else */
        if (!cur.type) {
          n(prev.key, cur.value);
          return null;
        }

        a(prev);
        a(cur);
        return cur;
      }

      /* istanbul ignore else */
      if (!prev.type) {
        p(prev.value);
        return cur;
      }
    }, null);

  return { _, raw: __, data, flags, params};
};
