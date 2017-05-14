wargs = require('..')
yargs = require('yargs-parser')
minimist = require('minimist')

MAX_TIMES = if process.env.CI then 10000 else 1000

argv = ['-x', 'y', 'm', 'n o', 'i=j', '--foo', 'baz buzz', 'o:p q', 'bazzinga', '-a=b', '--m=n', 'p:q', 'a=b c', '--', '...']

describe 'integration', ->
  beforeEach ->
    tests = [
      {
        name: 'wargs'
        run: => @w = wargs(argv)
      }
      {
        name: 'minimist'
        run: => @m = minimist(argv)
      }
      {
        name: 'yargs-parser'
        run: => @y = yargs(argv)
      }
    ]

    @stats = for fn in tests
      do ->
        start = new Date()
        times = MAX_TIMES
        while times--
          fn.run()
        { id: fn.name, ms: ((new Date()) - start) / 1000 }

  afterEach ->
    console.log """

      Average stats x#{MAX_TIMES}:
        #{@stats.map((x) -> "#{x.id}  #{x.ms}ms").join('\n  ')}

    """

  it 'consume flags correctly', ->
    for key, value of @w.flags
      expect(@w.flags[key]).toEqual @y[key]
      expect(@w.flags[key]).toEqual @m[key]

  it 'consume values correctly', ->
    _ = (@w._ || []).concat((@w.raw || []).slice())
    _.push("#{k}=#{v}") for k, v of @w.data
    _.push("#{k}:#{v}") for k, v of @w.params

    expect(_.sort()).toEqual @y._.sort()
    expect(_.sort()).toEqual @m._.sort()
