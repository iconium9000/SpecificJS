module.exports = Circuit => {

  class Comp {
    constructor(actid) {
      this.complete = false
      this.char = false
      this.pass = false
      this.key = {}
      this.actid = actid
    }
  }


  function list(acts,map,actid,act) {
    throw ['TODO',act]
  }

  const f = {

    rep0: (acts,map,actid,act) => { throw "TODO rep0" },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: list,
    lst: list,

    or: (acts,map,actid,act) => { throw "TODO or" },
    and: (acts,map,actid,act) => { throw "TODO and" },
    not: (acts,map,actid,act) => { throw "TODO not" },

    char: (acts,map,actid,act) => { throw "TODO char" },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => { throw "TODO cmp" },
    txt: (acts,map,actid,act) => { throw "TODO txt" },
    rng: (acts,map,actid,act) => { throw "TODO rng" },

    str: list,
    ary: list,
    pad: list,
    fout: list,
    out: list,
    stk: (acts,map,actid,act) => { throw "TODO stk" },

    map: (acts,map,actid,act) => { throw "TODO map" },
    key: (acts,map,actid,act) => { throw "TODO key" },
    act: (acts,map,actid,act) => { throw "TODO act" },
  }

  function comp(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret

    const act = acts[actid]
    return f[act[0]](acts,map,actid,act)
  }



  return function ActComp({act,start}) { comp(act,{},start) }
}
