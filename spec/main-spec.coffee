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
