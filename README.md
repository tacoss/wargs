# Why a wrong args parser?

> tl-dr; I didn't wrote a parser.

[![Build Status](https://travis-ci.org/pateketrueke/wargs.png?branch=next)](https://travis-ci.org/pateketrueke/wargs)
[![NPM version](https://badge.fury.io/js/wargs.png)](http://badge.fury.io/js/wargs)
[![Coverage Status](https://codecov.io/github/pateketrueke/wargs/coverage.svg?branch=next)](https://codecov.io/github/pateketrueke/wargs)

Instead, I used regular expressions for extracting values, flags and other kind of parameters from a string or from an argv-like array.

I've tried commander, minimist, yargs, etc. but no one fulfilled my exact requirements, e.g.

```js
const str = '/ _csrf=`token` --json accept:"text/plain; charset=utf8"';
const argv = ['/', '_csrf=`token`', '--json', 'accept:text/plain; charset=utf8'];
```

Both values are representing the same input, the former can be taken from any source while the latter is usually provided by `process.argv.slice(2)`, etc.

Most importantly: these modules will won't work with a string as input.

**wargs** will do and return: `data`, `flags` and `params`.

```js
{
  data: { '/': true, _csrf: '`token`' },
  flags: { json: true },
  params: { accept: 'text/plain; charset=utf8' },
}
```

It suits _-and feels-_ very well on a repl for making http requests. ;-)

## How it works

**wargs** _understand_ regular flags, `-short` or `--long`, `key:value` and `key=value` params, and `everything` else will be _mapped or grouped_ as an array of values, e.g.

```js
wargs('-x').flags.x; // true
wargs('--x').flags.x; // true
wargs('x:y').params.x; // y
wargs('x=y').data; // { x: 'y' }
wargs('x y').data; // { x true, y true }
wargs('x', { asBool: 'yes' }).data; // { x: 'yes' }
wargs('x y', { asArray: true }).data; // ['x', 'y']
wargs('-x y', { format: v => v.toUpperCase() }).flags; // { x: 'Y' }
```

### Options

- `format` &mdash; function decorator for all values
- `asBool` &mdash; used as default value for single args
- `asArray` &mdash; output data as an array of values instead
- `camelCase` &mdash; normalize keys from `--camel-case` to `camelCase`
