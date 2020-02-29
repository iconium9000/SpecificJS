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

  const {assign} = Object
  const f = {

    rep0: (acts,map,actid,act) => { throw "TODO rep0" },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: (acts,map,actid,act) => { throw "TODO fun" },
    lst: (acts,map,actid,act) => {

      const list = []
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]))
      }

      throw ['TODO lst',list]
    },

    or: (acts,map,actid,act) => {

      const list = []
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]))
      }

      throw ['TODO or',list]
    },
    and: (acts,map,actid,act) => { throw "TODO and" },
    not: (acts,map,actid,act) => { throw "TODO not" },

    char: (acts,map,actid,act) => { throw "TODO char" },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let ret = {
        ret:{str:str},
        next:true
      }

      let {length} = str
      while (--length >= 0) ret = { key:{ [str[length]]:ret } }

      return map[actid] = ret
    },
    txt: (acts,map,actid,act) => { throw "TODO txt" },
    rng: (acts,map,actid,act) => { throw "TODO rng" },

    str: (acts,map,actid,act) => { throw "TODO str" },
    ary: (acts,map,actid,act) => { throw "TODO ary" },
    pad: (acts,map,actid,act) => { throw "TODO pad" },
    fout: (acts,map,actid,act) => { throw "TODO fout" },
    out: (acts,map,actid,act) => { throw "TODO out" },
    stk: (acts,map,actid,act) => { throw "TODO stk" },

    map: (acts,map,actid,act) => { throw "TODO map" },
    key: (acts,map,actid,act) => { throw "TODO key" },
    act: (acts,map,actid,act) => { throw "TODO act" },
  }

  function setnext(comp,next,fail) {
    
  }

  function look(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret

    const act = acts[actid]
    return f[act[0]](acts,map,actid,act)
  }



  return function ActComp({act,start}) { look(act,{},start) }
}
