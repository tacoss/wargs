# Why a wrong args parser?

> tl-dr; I didn't wrote a parser.

[![Build Status](https://travis-ci.org/pateketrueke/wargs.png)](https://travis-ci.org/pateketrueke/wargs)
[![NPM version](https://badge.fury.io/js/wargs.png)](http://badge.fury.io/js/wargs)
[![Coverage Status](https://codecov.io/github/pateketrueke/wargs/coverage.svg)](https://codecov.io/github/pateketrueke/wargs)

Instead, I used regular expressions for extracting values, flags and other kind of parameters from a string or from an argv-like array.

I've tried commander, minimist, yargs, etc. but no one fulfilled my exact requirements, e.g.

```js
const str = '/ _csrf=`token` --json accept:"text/plain; charset=utf8" -- x';
const argv = ['/', '_csrf=`token`', '--json', 'accept:text/plain; charset=utf8', '--', 'x'];
```

Both values are representing the same input, the former can be taken from any source while the latter is usually provided by `process.argv.slice(2)`, etc.

Most importantly: these modules will won't work with a string as input.

**wargs** will do and return: `_`, `raw`, `data`, `flags` and `params`.

```js
{
  _: ['/'],
  raw: ['x'],
  data: { _csrf: '`token`' },
  flags: { json: true },
  params: { accept: 'text/plain; charset=utf8' },
}
```

Hint: It suits _-and feels-_ very well on a repl for making http requests. ;-)

## How it works

**wargs** _understand_ regular flags, `-short` or `--long`, `[-|--]key:value` and `[-|--]key=value` params, and `everything` else will be collected as an array of values, e.g.

```js
wargs('-x').flags.x; // true
wargs('--x').flags.x; // true
wargs('x:y').params.x; // y
wargs('x=y').data; // { x: 'y' }
wargs('x y')._ // ['x', 'y']
wargs('--x-y', { camelCase: true }).flags; // { xY: true }
wargs('-x y', { format: v => v.toUpperCase() }).flags; // { x: 'Y' }
```

### Options

- `format` &mdash; function decorator for all values
- `arrays` &mdash; allow multiple values per single flag
- `booleans` &mdash; allow/disable values for single booleans
- `defaults` &mdash; apply default values for non-given flags
- `transform` &mdash; custom callback for token processing
- `camelCase` &mdash; normalize keys from `--camel-case` to `camelCase`

### Fun facts

- When I was looking for a name for this module I found that `xargs`, `yargs` and `zargs` already existed
- I'm totally wrong on calling this module a "parser" for command line arguments, don't be rude
- Finally, I discovered that [wargs](http://gameofthrones.wikia.com/wiki/Warg) are a thing from GoT

![OrellWarg](http://vignette2.wikia.nocookie.net/gameofthrones/images/f/fc/OrellWarg.jpg/revision/latest)
