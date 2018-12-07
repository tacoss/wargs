const { expect } = require('chai');
const wargs = require('../lib');

/* global describe, it */

describe('wargs()', () => {
  it('can receive nothing', () => {
    expect(wargs()).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
  });

  it('can receive a string', () => {
    expect(wargs('')).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });

    const argv = '-x y m "n o" i=j --foo "baz buzz" o:"p q" bazzinga -a=b --m=n p:q a="b c" -- extra';

    expect(wargs(argv)._).to.eql(['m', 'n o', 'bazzinga']);
    expect(wargs(argv).raw).to.eql(['extra']);
    expect(wargs(argv).data).to.eql({
      a: 'b c',
      i: 'j',
    });
    expect(wargs(argv).flags).to.eql({
      x: 'y',
      foo: 'baz buzz',
      a: 'b',
      m: 'n',
    });
    expect(wargs(argv).params).to.eql({
      o: 'p q',
      p: 'q',
    });
  });

  it('can receive nested quotes', () => {
    expect(wargs('-a\'-b "c d"\'').flags.a).to.eql('-b "c d"');
  });

  it('can receive an array (argv-like)', () => {
    expect(wargs([])).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });

    const argv = ['-x', 'y', 'm', 'n o', 'i=j', '--foo', 'baz buzz', 'o:p q', 'bazzinga', '-a=b', '--m=n', 'p:q', 'a=b c'];

    expect(wargs(argv)._).to.eql(['m', 'n o', 'bazzinga']);
    expect(wargs(argv).data).to.eql({
      a: 'b c',
      i: 'j',
    });
    expect(wargs(argv).flags).to.eql({
      x: 'y',
      foo: 'baz buzz',
      a: 'b',
      m: 'n',
    });
    expect(wargs(argv).params).to.eql({
      o: 'p q',
      p: 'q',
    });

    const a = wargs('/ _csrf=`token` --json accept:"text/plain; charset=utf8"', {
      boolean: ['json'],
    });

    const b = wargs(['/', '_csrf=`token`', '--json', 'accept:text/plain; charset=utf8'], {
      boolean: ['json'],
    });

    const c = {
      _: ['/'],
      raw: [],
      data: {
        _csrf: '`token`',
      },
      flags: {
        json: true,
      },
      params: {
        accept: 'text/plain; charset=utf8',
      },
    };

    expect(a).to.eql(b);
    expect(a).to.eql(c);
  });

  it('can receive even almost anything (fallback)', () => {
    expect(wargs(NaN)).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs({})).to.eql({
      _: ['[object', 'Object]'],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs(-1)).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {
        1: true,
      },
      params: {},
    });
    expect(wargs(420)).to.eql({
      _: ['420'],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs(null)).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs('00:00:00')._).to.eql(['00:00:00']);
    expect(wargs(undefined)).to.eql({
      _: [],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs(Infinity)).to.eql({
      _: ['Infinity'],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs(JSON.stringify({
      foo: 'bar',
    }))).to.eql({
      _: ['{foo:bar}'],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
    expect(wargs(JSON.stringify(['foo', 'bar']))).to.eql({
      _: ['[foo,bar]'],
      raw: [],
      data: {},
      flags: {},
      params: {},
    });
  });

  it('supports single `-x` flags', () => {
    expect(wargs('-x').flags.x).to.eql(true);
    expect(wargs('-x y').flags.x).to.eql('y');
    expect(wargs('-x -y').flags.x).to.eql(true);
    expect(wargs('-x -y').flags.y).to.eql(true);
    expect(wargs('-x -y z').flags.y).to.eql('z');
  });

  it('supports single `-xy z` flags', () => {
    expect(wargs('-xy z', {
      boolean: 'x',
    }).flags).to.eql({
      x: true,
      y: 'z',
    });
  });

  it('supports single `-x=y` flags', () => {
    expect(wargs('-x=').flags.x).to.eql('');
    expect(wargs('-x=y').flags.x).to.eql('y');
  });

  it('supports quoted `-y "foo bar"` flags', () => {
    expect(wargs('-y "foo bar"').flags.y).to.eql('foo bar');
  });

  it('supports double `--x` flags', () => {
    expect(wargs('--x').flags.x).to.eql(true);
    expect(wargs('--x y').flags.x).to.eql('y');
    expect(wargs('--x --y').flags.x).to.eql(true);
    expect(wargs('--x --y').flags.y).to.eql(true);
    expect(wargs('--x --y z').flags.y).to.eql('z');
  });

  it('supports quoted `--y "foo bar"` flags', () => {
    expect(wargs('--y "foo bar"').flags.y).to.eql('foo bar');
  });

  it('supports single `key=value` params', () => {
    expect(wargs('x=').data.x).to.eql('');
    expect(wargs('x=y').data.x).to.eql('y');
  });

  it('supports single `--key=value` flags', () => {
    expect(wargs('--key=').flags.key).to.eql('');
    expect(wargs('--key=value').flags.key).to.eql('value');
  });

  it('supports quoted `key="foo bar"` params', () => {
    expect(wargs('key="foo bar"').data.key).to.eql('foo bar');
  });

  it('supports scaped `key="baz \\"buzz\\" bazzinga"` params', () => {
    expect(wargs('key="baz \\"buzz\\" bazzinga"').data.key).to.eql('baz "buzz" bazzinga');
  });

  it('supports single `key:value` params', () => {
    expect(wargs('x:').params.x).to.eql('');
    expect(wargs('x:y').params.x).to.eql('y');
  });

  it('supports escaped `key:foo\\ bar` params', () => {
    expect(wargs('key:foo\\ bar').params.key).to.eql('foo bar');
  });

  it('supports everything else as data values (see spec)', () => {
    expect(wargs('x')._).to.eql(['x']);
    expect(wargs('x y')._).to.eql(['x', 'y']);
    expect(wargs('x\\ y z')._).to.eql(['x y', 'z']);
    expect(wargs('\\ ')._).to.eql([' ']);
    expect(wargs('~"bar baz"')._).to.eql(['~bar baz']);
    expect(wargs('foo"bar baz"')._).to.eql(['foobar baz']);
    expect(wargs('foo "bar baz"')._).to.eql(['foo', 'bar baz']);
    expect(wargs(['~bar baz'])._).to.eql(['~bar baz']);
    expect(wargs(['foobar baz'])._).to.eql(['foobar baz']);
    expect(wargs(['foo', 'bar baz'])._).to.eql(['foo', 'bar baz']);
  });

  it('will use a custom formatting function', () => {
    expect(wargs('-x y', s => s.toUpperCase()).flags.x).to.eql('Y');
    expect(wargs('-x y', {
      format(s) {
        return s.toUpperCase();
      },
    }).flags.x).to.eql('Y');
  });

  it('will set all keys as camelCase when enabled', () => {
    expect(wargs('--foo-bar "baz buzz"', {
      camelCase: true,
    }).flags).to.eql({
      fooBar: 'baz buzz',
    });
  });

  it('will negate no-flag values by default', () => {
    expect(wargs('--no-foo').flags).to.eql({
      foo: false,
    });
  });

  it('will accept custom aliases', () => {
    expect(wargs('-x', {
      alias: {
        x: 'foo',
      },
    }).flags).to.eql({
      x: true,
      foo: true,
    });
    expect(wargs('-abc d', {
      alias: {
        a: 'foo',
        b: 'bar',
      },
      boolean: ['a', 'b'],
    }).flags).to.eql({
      a: true,
      b: true,
      foo: true,
      bar: true,
      c: 'd',
    });
    expect(wargs('-fI', {
      alias: {
        f: 'force',
        I: 'no-install',
      },
      boolean: ['f'],
    }).flags).to.eql({
      f: true,
      force: true,
      I: false,
      install: false,
    });
  });

  it('will capture all arguments after --', () => {
    expect(wargs('-- b').raw).to.eql(['b']);
    expect(wargs('a -- b').raw).to.eql(['b']);
    expect(wargs('a -- b c').raw).to.eql(['b', 'c']);
    expect(wargs('a -- b c -- d').raw).to.eql(['b', 'c', '--', 'd']);
    expect(wargs(['--', 'b']).raw).to.eql(['b']);
    expect(wargs(['a', '--', 'b']).raw).to.eql(['b']);
    expect(wargs(['a', '--', 'b', 'c']).raw).to.eql(['b', 'c']);
    expect(wargs(['a', '--', 'b', 'c', '--', 'd']).raw).to.eql(['b', 'c', '--', 'd']);
    expect(wargs('-x -- echo ok --a "b c"').raw).to.eql(['echo', 'ok', '--a', 'b c']);
    expect(wargs(['-x', '--', 'echo', 'ok', '--a', 'b c']).raw).to.eql(['echo', 'ok', '--a', 'b c']);
  });

  it('will handle boolean flags', () => {
    expect(wargs('-ab').flags).to.eql({
      a: true,
      b: true,
    });
    expect(wargs('-a=b').flags).to.eql({
      a: 'b',
    });
    expect(wargs('-a b').flags).to.eql({
      a: 'b',
    });
    expect(wargs('-x foo:bar').flags).to.eql({
      x: 'foo:bar',
    });
    expect(wargs(['--long', 'foo:bar']).flags).to.eql({
      long: 'foo:bar',
    });
    expect(wargs('-x foo:bar', {
      boolean: ['x'],
    }).flags).to.eql({
      x: true,
    });
    expect(wargs('-x foo:bar', {
      boolean: ['x'],
    }).params).to.eql({
      foo: 'bar',
    });
    expect(wargs(['--long', 'foo:bar'], {
      boolean: ['long'],
    }).flags).to.eql({
      long: true,
    });
    expect(wargs(['--long', 'foo:bar'], {
      boolean: ['long'],
    }).params).to.eql({
      foo: 'bar',
    });
    expect(wargs('-abc d:e', {
      boolean: 'ab',
    }).flags).to.eql({
      a: true,
      b: true,
      c: 'd:e',
    });
    expect(wargs(['-abc', 'd:e'], {
      boolean: 'abc',
    }).flags).to.eql({
      a: true,
      b: true,
      c: true,
    });
    expect(wargs(['-abc', 'd:e'], {
      boolean: 'abc',
    }).params).to.eql({
      d: 'e',
    });
  });

  it('will short-circuit boolean flags', () => {
    const a = wargs('-x BAZ=buzz', {
      boolean: 'x',
      alias: {
        x: 'large',
      },
    });

    const b = wargs('--large BAZ=buzz', {
      boolean: 'x',
      alias: {
        x: 'large',
      },
    });

    expect(wargs('-=').flags).to.eql({
      '=': true,
    });
    expect(wargs('--=').flags).to.eql({
      '': '',
    });
    expect(a.flags.large).to.eql(true);
    expect(a.data.BAZ).to.eql('buzz');
    expect(a).to.eql(b);
  });

  it('will allow consecutive array flags', () => {
    expect(wargs('-a 1 -a 2 -a 3').flags.a.map(String)).to.eql(['1', '2', '3']);
    expect(wargs('-a 0 -a 0 -a 0 -a 0').flags.a.map(String)).to.eql(['0', '0', '0', '0']);
    expect(wargs('-a b=c -a d=e', {
      alias: {
        a: 'add',
      },
    }).flags.add).to.eql(['b=c', 'd=e']);
    expect(wargs('-S "{x,y,z}/**" -S _', {
      alias: {
        S: 'sources',
      },
    }).flags.sources).to.eql(['{x,y,z}/**', '_']);

    const opts = {
      boolean: 'crudjtm',
      alias: {
        c: 'post',
        r: 'get',
        u: 'put',
        d: 'delete',
        j: 'json',
        t: 'text',
        a: 'attach',
        m: 'multipart',
      },
    };

    expect(wargs('/x -m -a b=c -a d=e', opts)).to.eql({
      _: ['/x'],
      raw: [],
      data: {},
      params: {},
      flags: {
        m: true,
        multipart: true,
        a: ['b=c', 'd=e'],
        attach: ['b=c', 'd=e'],
      },
    });
  });

  it('will handle shortands without no- prefixes', () => {
    const a = wargs('-aBc', {
      alias: {
        B: 'no-baz',
        c: 'buzz',
      },
      boolean: 'aBc'.split(''),
    });

    const b = wargs('-acB', {
      alias: {
        B: 'no-baz',
        c: 'buzz',
      },
      boolean: 'aBc'.split(''),
    });

    expect(a).to.eql(b);
    expect(wargs('-acB y', {
      alias: {
        B: 'no-baz',
        c: 'buzz',
      },
      boolean: 'aBc'.split(''),
    })).to.eql({
      _: ['y'],
      raw: [],
      data: {},
      flags: {
        a: true,
        c: true,
        buzz: true,
        B: false,
        baz: false,
      },
      params: {},
    });
  });
});
