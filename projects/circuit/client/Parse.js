module.exports = Circuit => {

  class Prg {

    constructor(string) {
      this._string = string
      this._acts = []
      this._match = {}
      this._map = {}
    }

    get copy() { return Object.create(this) }

    mch(str) {}
    txt(arg) {}
    str(...args) {}
    ary(...args) {}
    lst(...args) {}
    fout(...args) {}
    out(...args) {}
    char() {}
    rng(low,hgh) {}
    fun(reg,fun) {}
    rep0(arg) {}
    rep1(arg) {}
    not(arg) {}
    or(...args) {}
    and(...args) {}

  }

  const qfa = new Prg(Circuit.Tok())
  // {
  //   const sgl = {}
  //   const ops = [' \t\n','(){}[]<>', '."\'`;', '.*+|&@:;','#$']
  //   const mchs = []
  //   for (const i in ops) {
  //     const op = ops[i]
  //     const mch = []; mchs.push(mch)
  //     for (const j in op) mch.push(sgl[op[j]] = ['txt',op[j]])
  //   }
  //   const [_padop,_parop,_funop,_regop] = mchs
  //   const pad = ['mch','pad'], parop = ['mch','parop'], funop = ['mch','funop']
  //   const str = ['mch','str'], txt = ['mch','txt'], out = ['mch','out']
  //   const par = ['mch','par'], ary = ['mch','ary'], fun = ['mch','fun']
  //   const regop = ['mch','regop'], match = ['mch','match']
  //   const char = ['mch','char'], range = ['mch','range']
  //   const block = ['mch','block'], _post = ['mch','_post']
  //   const post = ['mch','post'], _or = ['mch','_or'], or = ['mch','or']
  //   const _and = ['mch','_and'], and = ['mch','and'], regx = ['mch','regx']
  //   const pad0 = ['rep0',pad]
  //   function makeblock(char,fun) {
  //     return [
  //       'lst',
  //       sgl[char],
  //       ['rep0',['out',['lst',pad0,['and',['not',sgl['"']],fun],],'1']],
  //     ]
  //   }
  //
  //   const toks = {
  //     pad: [
  //       'fun',
  //       ['or',..._padop,['lst',sgl['#'],['rep0',['not',sgl['\n']]]]],
  //       ['ary']
  //     ],
  //     parop: ['or',pad,..._parop],
  //     funop: ['or',parop,..._funop],
  //     str: [
  //       'fun',
  //       ['rep1',[
  //         'or',
  //         ['lst',sgl['$'],char],
  //         ['and',['not',funop],char]
  //       ]],
  //       ['str',['out']]
  //     ],
  //     txt: [
  //       'fun',
  //       ['or', makeblock('"',fun),makeblock("'",fun),makeblock('`',fun)],
  //       ['str',['out',1]]
  //     ],
  //     out: [
  //       'or',
  //       [ 'fun', ['lst', sgl['.'], pad0, str, [
  //         'rep0', [ 'out', ['lst',pad0,sgl['.'],pad0,str ], 3 ]
  //       ]], [ 'ary','fout', ['ary',['fout',2]], ['fout',3] ]],
  //       [ 'fun',sgl['.'],['fout'] ]
  //     ],
  //
  //     fun: ['or',str,txt,out,par,ary],
  //   }
  //   Object.assign(qfa._match,sgl,toks)
  // }




  // log(qfa)


  return function Parse(string) {
    const prg = new Prg(string)

    // log(prg)
  }
}
