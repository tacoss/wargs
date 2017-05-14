'use strict';

// fake symbols
function _symbol(key) {
  return `__Symbol${new Date().getMilliseconds()}${key}__`;
}

const reMatchKeyValue = /^(?!\d)[-~+.\w]+([=:])/;
const reMatchQuotes = /(["'])(?:(?!\1).)*\1/;
const reTrimDashes = /^--?/g;
const reCamelCase = /-(\w)/g;

const __QUOTE__ = _symbol('QUOTE');
const __APOS__ = _symbol('APOS');
const __SPA__ = _symbol('SPA');

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
  function n(val) {
    if (val.indexOf('no-') === 0) {
      flags[c(val.substr(3))] = false;
    } else {
      flags[c(val)] = true;
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
      if (prop.key.indexOf('no-') === 0) {
        flags[prop.key.substr(3)] = d(prop, false);
      } else {
        flags[prop.key] = d(prop, true);
      }
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

      n(prop);
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
    if (key.indexOf(' ') > -1 || reMatchQuotes.test(key)) {
      // skip white-space | quotes
      return { value: key };
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
    return { value: key };
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

  /* istanbul ignore else */
  if (argv.indexOf('--') > -1) {
    Array.prototype.push.apply(__, argv.slice(argv.indexOf('--') + 1));

    if (argv.indexOf('--')) {
      argv = argv.slice(0, argv.indexOf('--'));
    } else {
      argv = [];
    }
  }

  // tokenize and skip complex-values
  const tokens = x(argv)
    .reduce((prev, cur) => {
      const last = prev[prev.length - 1] || {};

      if (last.type === 'flag'
        && last.boolean === false
        && typeof last.value === 'undefined' && reMatchKeyValue.test(cur)) {
        /* istanbul ignore else */
        if (last.value) {
          console.log('PUSH', last, cur);
        }

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
          p(f(cur.value));
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
        if (prev.boolean) {
          /* istanbul ignore else */
          if (typeof prev.value !== 'undefined') {
            throw new Error(`Unexpected value for '-${prev.key}' flag`);
          }

          a(cur);
          return null;
        }

        /* istanbul ignore else */
        if (!cur.type) {
          flags[prev.key] = f(cur.value);
          return null;
        }

        a(prev);
        a(cur);
        return cur;
      }

      /* istanbul ignore else */
      if (!prev.type) {
        p(f(prev.value));
        return cur;
      }

      /* istanbul ignore else */
      if (prev.boolean) {
        n(prev.key);
        return cur;
      }

      /* istanbul ignore else */
      if (!cur.type && typeof prev.value === 'undefined') {
        flags[prev.key] = f(cur.value);
        return null;
      }

      a(prev);
      return cur;
    }, null);

  return { _, raw: __, data, flags, params};
};
