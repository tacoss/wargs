wargs = require('../lib')

# wargs(str|arr, opts|cb, cb)
describe 'wargs()', ->
  it 'can receive nothing', ->
    expect(wargs()).toEqual { _: [], raw: [], data: {}, flags: {}, params: {} }

  it 'can receive a string', ->
    expect(wargs('')).toEqual { _: [], raw: [], data: {}, flags: {}, params: {} }

    argv = '-x y m "n o" i=j --foo "baz buzz" o:"p q" bazzinga -a=b --m=n p:q a="b c"'

    expect(wargs(argv)._).toEqual ['m', 'n o', 'bazzinga']
    expect(wargs(argv).data).toEqual { a: 'b c', i: 'j' }
    expect(wargs(argv).flags).toEqual { x: 'y', foo: 'baz buzz', a: 'b', m: 'n' }
    expect(wargs(argv).params).toEqual { o: 'p q', p: 'q' }

  it 'can receive nested quotes', ->
    expect(wargs('''
      -a '-b "c d"'
    ''').flags.a).toEqual '-b "c d"'

  it 'can receive an array (argv-like)', ->
    expect(wargs([])).toEqual { _: [], raw: [], data: {}, flags: {}, params: {} }

    argv = ['-x', 'y', 'm', 'n o', 'i=j', '--foo', 'baz buzz', 'o:p q', 'bazzinga', '-a=b', '--m=n', 'p:q', 'a=b c']

    expect(wargs(argv)._).toEqual ['m', 'n o', 'bazzinga']
    expect(wargs(argv).data).toEqual { a: 'b c', i: 'j' }
    expect(wargs(argv).flags).toEqual { x: 'y', foo: 'baz buzz', a: 'b', m: 'n' }
    expect(wargs(argv).params).toEqual { o: 'p q', p: 'q' }

    a = wargs('/ _csrf=`token` --json accept:"text/plain; charset=utf8"', { booleans: ['json'] })
    b = wargs(['/', '_csrf=`token`', '--json', 'accept:text/plain; charset=utf8'], { booleans: ['json'] })

    c = {
      _: ['/']
      raw: []
      data: { _csrf: '`token`' }
      flags: { json: true }
      params: { accept: 'text/plain; charset=utf8' }
    }

    expect(a).toEqual b
    expect(a).toEqual c

  it 'can receive even almost anything (fallback)', ->
    expect(wargs(NaN)).toEqual { _: [], raw: [], data: {}, flags: {}, params: {} }

    expect(wargs({})).toEqual {
      _: ['[object', 'Object]']
      raw: []
      data: {}
      flags: {}
      params: {}
    }

    expect(wargs(-1)).toEqual { _: [], raw: [], data: {}, flags: { 1: true }, params: {} }
    expect(wargs(420)).toEqual { _: ['420'], raw: [], data: {}, flags: {}, params: {} }
    expect(wargs(null)).toEqual  { _: [], raw: [], data: {}, flags: {}, params: {} }
    expect(wargs('00:00:00')._).toEqual ['00:00:00']

    expect(wargs(undefined)).toEqual { _: [], raw: [], data: {}, flags: {}, params: {} }
    expect(wargs(Infinity)).toEqual { _: ['Infinity'], raw: [], data: {}, flags: {}, params: {} }

    # FIXME: keep JSON values as-is?
    expect(wargs(JSON.stringify(foo: 'bar'))).toEqual {
      _: ['{foo:bar}']
      raw: []
      data: {}
      flags: {}
      params: {}
    }

    expect(wargs(JSON.stringify(['foo', 'bar']))).toEqual {
      _: ['[foo,bar]']
      raw: []
      data: {}
      flags: {}
      params: {}
    }

  it 'supports single `-x` flags', ->
    expect(wargs('-x').flags.x).toBe true
    expect(wargs('-x y').flags.x).toEqual 'y'

    expect(wargs('-x -y').flags.x).toBe true
    expect(wargs('-x -y').flags.y).toBe true

    expect(wargs('-x -y z').flags.y).toEqual 'z'

  it 'supports single `-xy z` flags', ->
    expect(wargs('-xy z', { booleans: 'x' }).flags).toEqual { x: true, y: 'z' }

  it 'supports single `-x=y` flags', ->
    expect(wargs('-x=').flags.x).toEqual ''
    expect(wargs('-x=y').flags.x).toEqual 'y'

  it 'supports quoted `-y "foo bar"` flags', ->
    expect(wargs('-y "foo bar"').flags.y).toEqual 'foo bar'

  it 'supports double `--x` flags', ->
    expect(wargs('--x').flags.x).toBe true
    expect(wargs('--x y').flags.x).toEqual 'y'

    expect(wargs('--x --y').flags.x).toBe true
    expect(wargs('--x --y').flags.y).toBe true

    expect(wargs('--x --y z').flags.y).toEqual 'z'

  it 'supports quoted `--y "foo bar"` flags', ->
    expect(wargs('--y "foo bar"').flags.y).toEqual 'foo bar'

  it 'supports single `key=value` params', ->
    expect(wargs('x=').data.x).toEqual ''
    expect(wargs('x=y').data.x).toEqual 'y'

  it 'supports single `--key=value` flags', ->
    expect(wargs('--key=').flags.key).toEqual ''
    expect(wargs('--key=value').flags.key).toEqual 'value'

  it 'supports quoted `key="foo bar"` params', ->
    expect(wargs('key="foo bar"').data.key).toEqual 'foo bar'

  it 'supports scaped `key="baz \\"buzz\\" bazzinga"` params', ->
    expect(wargs('key="baz \\"buzz\\" bazzinga"').data.key).toEqual 'baz "buzz" bazzinga'

  it 'supports single `key:value` params', ->
    expect(wargs('x:').params.x).toEqual ''
    expect(wargs('x:y').params.x).toEqual 'y'

  it 'supports escaped `key:foo\\ bar` params', ->
    expect(wargs('key:foo\\ bar').params.key).toEqual 'foo bar'

  it 'supports everything else as data values (see spec)', ->
    expect(wargs('x')._).toEqual ['x']
    expect(wargs('x y')._).toEqual ['x', 'y']
    expect(wargs('x\\ y z')._).toEqual ['x y', 'z']
    expect(wargs('\\ ')._).toEqual [' ']
    expect(wargs('~"bar baz"')._).toEqual ['~bar baz']
    expect(wargs('foo"bar baz"')._).toEqual ['foobar baz']
    expect(wargs('foo "bar baz"')._).toEqual ['foo', 'bar baz']
    expect(wargs(['~bar baz'])._).toEqual ['~bar baz']
    expect(wargs(['foobar baz'])._).toEqual ['foobar baz']
    expect(wargs(['foo', 'bar baz'])._).toEqual ['foo', 'bar baz']

  it 'will use a custom formatting function' , ->
    expect(wargs('-x y', (s) -> s.toUpperCase()).flags.x).toEqual 'Y'
    expect(wargs('-x y', format: (s) -> s.toUpperCase()).flags.x).toEqual 'Y'

  it 'will set all keys as camelCase when enabled', ->
    expect(wargs('--foo-bar "baz buzz"', camelCase: true).flags).toEqual { fooBar: 'baz buzz' }

  it 'will negate no-flag values by default', ->
    expect(wargs('--no-foo').flags).toEqual { foo: false }

  it 'will accept custom aliases', ->
    expect(wargs('-x', aliases: { x: 'foo' }).flags).toEqual { foo: true }
    expect(wargs('-abc d', aliases: { a: 'foo', b: 'bar' }, booleans: 'ab').flags).toEqual { foo: true, bar: true, c: 'd' }
    expect(wargs('-fI', aliases: { f: 'force', I: 'no-install' }, booleans: 'f').flags).toEqual { force: true, install: false }

  it 'will capture all arguments after --', ->
    expect(wargs('-- b').raw).toEqual ['b']
    expect(wargs('a -- b').raw).toEqual ['b']
    expect(wargs('a -- b c').raw).toEqual ['b', 'c']
    expect(wargs('a -- b c -- d').raw).toEqual ['b', 'c', '--', 'd']

    expect(wargs(['--', 'b']).raw).toEqual ['b']
    expect(wargs(['a', '--', 'b']).raw).toEqual ['b']
    expect(wargs(['a', '--', 'b', 'c']).raw).toEqual ['b', 'c']
    expect(wargs(['a', '--', 'b', 'c', '--', 'd']).raw).toEqual ['b', 'c', '--', 'd']

    expect(wargs('-x -- echo ok --a "b c"').raw).toEqual ['echo', 'ok', '--a', 'b c']
    expect(wargs(['-x', '--', 'echo', 'ok', '--a', 'b c']).raw).toEqual ['echo', 'ok', '--a', 'b c']

  it 'will handle boolean flags', ->
    expect(-> wargs('-ab')).not.toThrow()
    expect(-> wargs('-a=b', booleans: 'a')).toThrow()
    expect(-> wargs('-a b', booleans: 'a')).toThrow()

    expect(wargs('-x foo:bar').flags).toEqual { x: 'foo:bar' }
    expect(wargs(['--long', 'foo:bar']).flags).toEqual { long: 'foo:bar' }

    expect(wargs('-x foo:bar', { booleans: ['x'] }).flags).toEqual { x: true }
    expect(wargs('-x foo:bar', { booleans: ['x'] }).params).toEqual { foo: 'bar' }

    expect(wargs(['--long', 'foo:bar'], { booleans: ['long'] }).flags).toEqual { long: true }
    expect(wargs(['--long', 'foo:bar'], { booleans: ['long'] }).params).toEqual { foo: 'bar' }

    expect(wargs('-abc d:e', { booleans: 'ab' }).flags).toEqual { a: true, b: true, c: 'd:e' }
    expect(wargs(['-abc', 'd:e'], { booleans: 'abc' }).flags).toEqual { a: true, b: true, c: true }
    expect(wargs(['-abc', 'd:e'], { booleans: 'abc' }).params).toEqual { d: 'e' }

  it 'will short-circuit boolean flags', ->
    a = wargs('-x BAZ=buzz', { booleans: 'x', aliases: { x: 'large' } })
    b = wargs('--large BAZ=buzz', { booleans: 'x', aliases: { x: 'large' } })

    expect(a.flags.large).toBe true
    expect(a.data.BAZ).toEqual 'buzz'

    expect(a).toEqual b

  it 'will allow consecutive array flags', ->
    expect(wargs('-a 1 -a 2 -a 3', arrays: 'a').flags.a).toEqual ['1', '2', '3']
    expect(wargs('-S "{x,y,z}/**" -S _', arrays: 'S', aliases: { S: 'sources' }).flags.sources).toEqual ['{x,y,z}/**', '_']

  it 'will handle shortands without no- prefixes', ->
    a = wargs('-aBc', { aliases: { B: 'no-baz', c: 'buzz' }, booleans: 'aBc' })
    b = wargs('-acB', { aliases: { B: 'no-baz', c: 'buzz' }, booleans: 'aBc' })

    expect(a).toEqual b

    expect(-> wargs('-acB y', { aliases: { B: 'no-baz', c: 'buzz' }, booleans: 'aBc' })).toThrow()
