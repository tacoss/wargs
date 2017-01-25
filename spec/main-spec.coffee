wargs = require('../lib')

# wargs(str|arr, opts|cb, cb)
describe 'wargs()', ->
  it 'can receive nothing', ->
    expect(wargs()).toEqual { data: {}, flags: {}, params: {} }

  it 'can receive a string', ->
    expect(wargs('')).toEqual { data: {}, flags: {}, params: {} }

    argv = '-x y i=j --foo "baz buzz" o:"p q" bazzinga -a=b --m=n p:q a="b c"'

    expect(wargs(argv).data).toEqual { a: 'b c', i: 'j', bazzinga: true }
    expect(wargs(argv).flags).toEqual { x: 'y', foo: 'baz buzz', a: 'b', m: 'n' }
    expect(wargs(argv).params).toEqual { o: 'p q', p: 'q' }

  it 'can receive an array (argv-like)', ->
    expect(wargs([])).toEqual { data: {}, flags: {}, params: {} }

    argv = ['-x', 'y', 'i=j', '--foo', 'baz buzz', 'o:p q', 'bazzinga', '-a=b', '--m=n', 'p:q', 'a=b c']

    expect(wargs(argv).data).toEqual { a: 'b c', i: 'j', bazzinga: true }
    expect(wargs(argv).flags).toEqual { x: 'y', foo: 'baz buzz', a: 'b', m: 'n' }
    expect(wargs(argv).params).toEqual { o: 'p q', p: 'q' }

  it 'can receive even almost anything (fallback)', ->
    expect(wargs(NaN)).toEqual { data: {}, flags: {}, params: {} }

    expect(wargs({})).toEqual {
      data: { '[object': true, 'Object]': true },
      flags: {},
      params: {}
    }

    expect(wargs(-1)).toEqual { data: {}, flags: { 1: true }, params: {} }
    expect(wargs(420)).toEqual { data: { 420: true }, flags: {}, params: {} }
    expect(wargs(null)).toEqual  { data: {}, flags: {}, params: {} }

    try
      date = new Date(2017, 0, 24)
      _GMT = String(date).split(' ')[5]

      expect(wargs(date).data[24]).toEqual true
      expect(wargs(date).data[2017]).toEqual true
      expect(wargs(date).data.Tue).toEqual true
      expect(wargs(date).data.Jan).toEqual true
      expect(wargs(date).data[_GMT]).toEqual true
      expect(wargs(date).data['(CST)']).toEqual true
      expect(wargs(date).params).toEqual { '00': '00:00' }
    catch e
      console.log 'DATE FAILED', e

    expect(wargs(undefined)).toEqual { data: {}, flags: {}, params: {} }
    expect(wargs(Infinity)).toEqual { data: { Infinity: true }, flags: {}, params: {} }

    expect(wargs(JSON.stringify(foo: 'bar'))).toEqual {
      data: { '{"foo":"bar"}': true }
      flags: {}
      params: {}
    }

    expect(wargs(JSON.stringify(['foo', 'bar']))).toEqual {
      data: { '["foo","bar"]': true }
      flags: {}
      params: {}
    }

  it 'supports single `-x` flags', ->
    expect(wargs('-x').flags.x).toBe true
    expect(wargs('-x y').flags.x).toEqual 'y'
    expect(wargs('-x -y').flags.x).toBe true
    expect(wargs('-x -y').flags.y).toBe true
    expect(wargs('-x -y z').flags.y).toEqual 'z'

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

  it 'supports everything else as boolean values', ->
    expect(wargs('x').data.x).toBe true
    expect(wargs('x y').data.x).toBe true
    expect(wargs('x y').data.y).toBe true
    expect(wargs('x\\ y z').data['x y']).toBe true
    expect(wargs('x\\ y z').data.z).toBe true
    expect(wargs('\\ ').data[' ']).toBe true

  it 'will use a custom formatting function' , ->
    expect(wargs('-x y', (s) -> s.toUpperCase()).flags.x).toEqual 'Y'
    expect(wargs('-x y', format: (s) -> s.toUpperCase()).flags.x).toEqual 'Y'

  it 'will use a custom default for data values', ->
    expect(wargs('a', default: 'yes').data.a).toEqual 'yes'

  it 'will set all keys as camelCase when enabled', ->
    expect(wargs('--foo-bar "baz buzz"', camelCase: true).flags).toEqual { fooBar: 'baz buzz' }

  it 'will set data as an array of values when enabled', ->
    expect(wargs('/ foo=bar --json', asArray: true)).toEqual {
      data: ['/', 'foo']
      flags: { json: true }
      params: {}
    }

    expect(wargs('/ foo=bar --json')).toEqual {
      data: { '/': true, foo: 'bar' }
      flags: { json: true }
      params: {}
    }
