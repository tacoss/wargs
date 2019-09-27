"use strict";const SHORTSPLIT=/$|[!-@\[-`{-~].*/g,EMPTY=[];function array(e){return Array.isArray(e)?e:[e]}function aliases(e){var r={};for(var a in e)for(var t=r[a]=array(e[a]),_=0,s=t.length;_<s;_++)for(var n=r[t[_]]=[a],i=0;i<s;i++)_!==i&&n.push(t[i]);return r}function booleans(e,r){var a={};if(void 0!==r)for(var t=0,_=r.length;t<_;t++){var s=r[t],n=e[s];if(a[s]=!0,void 0===n)e[s]=EMPTY;else for(var i=0,o=n.length;i<o;i++)a[n[i]]=!0}return a}function defaults(e,r){var a={};for(var t in r){var _=r[t],s=e[t];if(void 0===a[t])if(a[t]=_,void 0===s)e[t]=EMPTY;else for(var n=0,i=s.length;n<i;n++)a[s[n]]=_}return a}function set(e,r,a,t,_){var s=e[r],n=t[r],i=void 0!==n;if((i||void 0===_||!1!==_(r))&&(void 0===s?e[r]=a:Array.isArray(s)?s.push(a):e[r]=[s,a],i))for(var o=0,l=n.length;o<l;)e[n[o++]]=e[r]}var getopts=function(e,r){for(var a=(r=r||{}).unknown,t=aliases(r.alias),_=defaults(t,r.default),s=booleans(t,r.boolean),n={_:[]},i=0,o=0,l=e.length,u=n._;i<l;i++){var f=e[i];if("--"===f)for(;++i<l;)u.push(e[i]);else if("-"===f||"-"!==f[0])u.push(f);else if("-"===f[1]){if(0<=(E=f.indexOf("=",2)))set(n,f.slice(2,E),f.slice(E+1),t,a);else if("n"===f[2]&&"o"===f[3]&&"-"===f[4])set(n,f.slice(5),!1,t,a);else set(n,S=f.slice(2),l===(o=i+1)||"-"===e[o][0]||void 0!==s[S]||e[i=o],t,a)}else{SHORTSPLIT.lastIndex=2;var c=SHORTSPLIT.exec(f),E=c.index,A=c[0]||l===(o=i+1)||"-"===e[o][0]||void 0!==s[f[E-1]]||e[i=o];for(o=1;o<E;)set(n,f[o],++o!==E||A,t,a)}}for(var S in _)void 0===n[S]&&(n[S]=_[S]);return n};const $$=e=>`__Symbol@@${e}__`,__QUOTE__=$$("QUOTE"),__APOS__=$$("APOS"),__SPA__=$$("SPA"),RE_CAMEL_CASE=/-(\w)/g,RE_MATCH_KEYVAL=/^((?!\d)[-~+.\w]+)([=:])(.+?)?$/,RE_MATCH_QUOTES=/(["'])(?:(?!\1).)*\1/,RE_SPECIAL_CHARS=['"',"'"," "],RE_ESCAPE_CHARS=[/\\"/g,/\\'/g,/\\ /g],RE_QUOTED_CHARS=[__QUOTE__,__APOS__,__SPA__],RE_UNESCAPE_CHARS=[__QUOTE__,__APOS__,__SPA__].map(e=>new RegExp(e,"g"));function escape(e){return RE_ESCAPE_CHARS.reduce((e,r,a)=>e.replace(r,RE_QUOTED_CHARS[a]),e)}function unescape(e){return RE_UNESCAPE_CHARS.reduce((e,r,a)=>e.replace(r,RE_SPECIAL_CHARS[a]),e)}function unquote(e,r){for(;RE_MATCH_QUOTES.test(e);){const r=e.match(RE_MATCH_QUOTES),a=r[0].substr(1,r[0].length-2);e=e.replace(r[0],RE_SPECIAL_CHARS.reduce((e,r,a)=>e.replace(r,RE_QUOTED_CHARS[a]),a))}if(r)for(;e.indexOf(" ")>-1;)e=RE_SPECIAL_CHARS.reduce((e,r,a)=>e.replace(r,RE_QUOTED_CHARS[a]),e);return e.split(/\s+/)}function evaluate(e,r){if("function"==typeof r){if("object"!=typeof e)return r(e);Object.keys(e).forEach(a=>{e[a]=r(e[a],a)})}return e}function camelcase(e){return e.replace(RE_CAMEL_CASE,(e,r)=>r.toUpperCase())}var lib=(e,r,a)=>{if("function"==typeof(r=r||{})&&(a=r,r={}),r.format&&(a=r.format||a,delete r.format),!Array.isArray(e)){let r;e=escape(String(e||""));do{(r=e.match(RE_MATCH_QUOTES))&&(e=e.replace(r[0],unquote(r[0],!0)))}while(r);e=e.trim().split(/\s+/).map(unescape).filter(e=>e)}const t=e.indexOf("--"),_=[];t>-1&&(e.slice(t+1).forEach(e=>{_.push(evaluate(e,a))}),e.splice(t+1,e.length));const s=getopts(e,r),n=s._.slice(),i={},o={};return delete s._,Object.keys(s).forEach(e=>{const t=s[e];-1!==e.indexOf("-")&&(delete s[e],e=camelcase(e)),r.alias&&r.alias[e]&&0===r.alias[e].indexOf("no-")&&(s[r.alias[e].substr(3)]=!t,s[e]=!t),Array.isArray(t)&&(s[e]=t.map(e=>evaluate(e,a))),"string"==typeof t&&("="===t.charAt()?s[e]=evaluate(t.substr(1),a):s[e]=evaluate(t,a))}),{_:n.reduce((e,r)=>{const t=r.match(RE_MATCH_KEYVAL);return t?"="===t[2]?i[t[1]]=evaluate(t[3]||"",a):o[t[1]]?(Array.isArray(o[t[1]])||(o[t[1]]=[o[t[1]]]),o[t[1]].push(evaluate(t[3]||"",a))):o[t[1]]=evaluate(t[3]||"",a):e.push(evaluate(r,a)),e},[]),raw:_,data:i,flags:s,params:o}};module.exports=lib;