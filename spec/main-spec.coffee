wargs = require('../lib')

# wargs(str|arr, opts|cb, cb)
describe 'wargs()', ->
  it 'can receive nothing', ->
    expect(wargs()).toEqual { data: {}, flags: {}, params: {} }

  it 'can receive a string', ->
    expect(wargs('')).toEqual { data: {}, flags: {}, params: {} }

  it 'can receive an array (argv-like)', ->
    expect(wargs([])).toEqual { data: {}, flags: {}, params: {} }

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

    expect(wargs(new Date(2017, 0, 24))).toEqual {
      data: { 24: true, 2017: true, Tue: true, Jan: true, 'GMT-0600': true, '(CST)': true }
      flags: {}
      params: { '00': '00:00' }
    }

    expect(wargs(undefined)).toEqual { data: {}, flags: {}, params: {} }
    expect(wargs(Infinity)).toEqual { data: { Infinity: true }, flags: {}, params: {} }

    expect(wargs(JSON.stringify(foo: 'bar'))).toEqual {
      data: {}
      flags: {}
      params: { '{"foo"': '"bar"}' }
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
