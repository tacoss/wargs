# Why a wrong args parser?

> tl-dr; I didn't wrote a parser.

[![Build Status](https://travis-ci.org/pateketrueke/wargs.png?branch=next)](https://travis-ci.org/pateketrueke/wargs)
[![NPM version](https://badge.fury.io/js/wargs.png)](http://badge.fury.io/js/wargs)
[![Coverage Status](https://codecov.io/github/pateketrueke/wargs/coverage.svg?branch=next)](https://codecov.io/github/pateketrueke/wargs)

I used instead regular expressions and a reduce loop for extracting values, flags and other kind of parameters from a string or from an argv-like array.

## How it works

**wargs** _understand_ regular flags, `-short` or `--long`, `key:value` and `key=value` params, and `everything` else will be _mapped or grouped_ as an array of values, e.g.

```js
console.log(wargs('-x').flags.x); // true
console.log(wargs('--opt').flags.opt); // true
console.log(wargs('foo:bar').params.foo); // bar
console.log(wargs('foo=bar').data); // { foo: 'bar' } FIXME
console.log(wargs('foo bar').data); // { foo: true, bar: true }
```
