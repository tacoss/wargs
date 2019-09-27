const { expect } = require('chai');
const yargs = require('yargs-parser');
const minimist = require('minimist');
const getopts = require('getopts');
const wargs = require('..');

const MAX_TIMES = process.env.CI ? 10000 : 1000;

const argv = ['-x', 'y', 'm', 'n o', 'i=j', '--foo', 'baz buzz', 'o:p q', 'bazzinga', '-a=b', '--m=n', 'p:q', 'a=b c', '--', '...'];

let w;
let m;
let y;
let g;

/* global beforeEach, describe, it */

describe('integration', () => {
  beforeEach(() => {
    const tests = [
      {
        name: 'wargs',
        run() {
          w = wargs(argv);
        },
      }, {
        name: 'minimist',
        run() {
          m = minimist(argv);
        },
      }, {
        name: 'yargs-parser',
        run() {
          y = yargs(argv);
        },
      }, {
        name: 'getopts',
        run() {
          g = getopts(argv);
        },
      },
    ];

    const stats = (() => {
      const results = [];

      for (let i = 0, len = tests.length; i < len; i += 1) {
        const fn = tests[i];

        results.push((() => {
          const start = new Date();

          let times = MAX_TIMES;

          while (times) {
            fn.run();
            times -= 1;
          }

          return {
            id: fn.name,
            ms: ((new Date()) - start) / 1000,
          };
        })());
      }

      return results;
    })();

    /* eslint-disable */
    console.log("\nAverage stats x" + MAX_TIMES + ":\n  " + stats.map(x => {
      return x.id + "  ~" + x.ms + "ms";
    }).join('\n  ')) + "\n";
    /* eslint-enable */
  });

  it('consume flags correctly', () => {
    if (w) {
      Object.keys(w.flags).forEach(key => {
        expect(w.flags[key]).to.eql(y[key]);
        expect(w.flags[key]).to.eql(m[key]);
        expect(w.flags[key]).to.eql(g[key].replace('=', ''));
      });
    }
  });

  it('consume values correctly', () => {
    if (w) {
      const _ = w._.concat(w.raw.slice());

      Object.keys(w.data).forEach(k => {
        _.push(`${k}=${w.data[k]}`);
      });

      Object.keys(w.params).forEach(k => {
        _.push(`${k}:${w.params[k]}`);
      });

      expect(_.sort()).to.eql(y._.sort());
      expect(_.sort()).to.eql(m._.sort());
    }
  });
});
