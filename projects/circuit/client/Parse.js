module.exports = Circuit => {

  const fmap = {
    // range:
  	// endat:
  	// comp:
  	// repf:
  	// rept:
  	// regx:
  }

  const tokmap = {

    // operator precedence 0 ---------------------------------------------------

  	// space/comment
    _commentsl: { str: 'regx // [endat \n]', },
    _commentml: { str: 'regx /* [endat */]', },
    _space: { str: 'comp _commentsl _commentml $  \t \n', },
    'space*': { str: 'rept _space', },
    'space+': { str: 'regx _space space*', },

    // num
    _intdig: { str: 'range 0 9', val: true, },
    _octdig: { str: 'range 0 7', val: true, },
    _hexlow: { str: 'range a f', val: true, },
    _hexupr: { str: 'range A F', val: true, },
    _hexdig: { str: 'comp _intdig _hexlow _hexupr', val: true, },
    hex: {
      str: 'regx 0 [comp x X] _hexdig [rept _hexdig]',
      fun: (     z,        x,     dig,         digs) => {
        z += x + dig
        for (const i in digs) z += digs[i]
        return ['Hex',z]
      },
    },
    float: {
      str: 'regx [rept _intdig] . _intdig [rept _intdig]',
      fun: (              digA, d,   digB,         digB) => {
        let str  = ''
        for (const i in digA) str += digA[i]
        str += d + digB
        for (cosnt i in digC) str += digC[i]
        return ['Float',str]
      },
    },
  	oct: {
      str: 'regx 0 [rept _octdig]',
      fun: (     z,         digs) => {
        for (const i in digs) z += digs[i]
        return ['Oct',z]
      },
    },
  	int: {
      str: 'regx _intdig [rept _intdig]',
      fun: (         dig,         digs) => {
        for (const i in digs) dig += digs[i]
        return ['Int',dig]
      },
    },
  	num: { str: 'comp hex float oct int', val: true, },

    // var
    _ltrlow: { str: 'range a z', val: true, },
    _ltrupr: { str: 'range A Z', val: true, },
    _ltr: { str: 'comp _ _lowltr _highltr', val: true, },
    var: {
      str: 'regx _ltr [repf comp _intdig _ltr]',
      fun: (     ltrA,                   ltrB) => {
        for (const i in ltrB) ltrA += ltrB[i]
        return ['Var',ltrA]
      },
    },

    // string

    // operator precedence 1 -----------------------------------------------------

    _nulltuple: { str: 'regx ( space * )', nam: '_Nulltuple', },
    _halftuple: {
      str: 'repf regx space* , space* rval16',
      fun: (rep  [regx,       c,          val]) => val,
    },
    _tuple: {
      str: 'regx ( space* rval16 _halftuple space* )',
      fun: (regx,a,          val,[])
    }
  }

  function Parse(string) {
    log('Parse',string)
  }
  return Parse
}
