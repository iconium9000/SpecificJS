/*
  static idx(
    events, // Type[]
    time,
  ) {
    let l = 0, r = events.length - 1
    while (l <= r) {
      let m = Math.floor((l + r) / 2)
      const dif = time - events[m].time
      if (dif > 0) l = m + 1
      else if (dif < 0) r = m - 1
      else return m
    }
    return r
  }
*/

module.exports = (constructors) => class Lib {
  static get pi() { return Math.PI }
  static get pi2() { return this.pi * 2 }

  static get time() {
    return (new Date()).getTime()
  }

  static arrays_equal(
    a, // (Object,Null)[]
    b, // (Object,Null)[]
  ) {
    if (a.length != b.length) return false
    for (const i in a) if (a[i] != b[i]) return false
    return true
  }

  static set (object, value, label) {
    if (value == undefined) delete object[label]
    else object[label] = value
    return value
  }

  // int a >= 0
  static idxToPoint(a) {
    if (a == 0) return [0,0]
    const b = Math.ceil(a > 6 ? (Math.sqrt(4*a+1)-1)/4 : a/6)
    const c = b==1 ? 6 : 8*b-2, d = (c-2)/4, f = a-c*(b-1)/2, e = f+b-d-2
    return e<0 ? [f,1-b] : e<d ? [b,f-d] : e>d+d ? [-b,c-f-d] : [c-f-d-d-1,b]
  }

  // int p,q
  static pointToIdx([p,q]) {
    if (p==0 && q==0) return 0
    const b = p<0?-p:p, c = q<0?-q:q, g = b>c?b+b:c+c
    const d = -g==q+q && q<p ? g+1 : g-1, e = q+p-1, f = q+d-p
    return d*d + (q<p && e<1 ? -f : 0<e && f<d+1 ? e : p<q && -e<2 ? f : d+d-e)
  }

  static get_first(object) {
    for (const i in object) return object[i]
  }

  static itop(a) {
    if (a < 1) return {x:0,y:0}
    const {floor,sqrt} = Math, e = floor((1 + sqrt(4*a - 3))/2)
    const f = e*e - e + 1, g = floor((a - f)/e), h = (e + 1)%2
    const i = (f + e*g + floor((e - 2)/2) - a) * (h ? 1 : -1)
    const j = floor((e + g)/2) * (g ^ h ? 1 : -1)
    return g ? {x:j,y:i} : {x:i,y:j}
  }
  static ptoi({x,y}) {
    if (x == 0 && y == 0) return 0
    else if (0.5 > y + Math.abs(x - 1)) return 4*y*y - 3*y + x
    else if (y > Math.abs(x + 0.5)) return 4*y*y - y - x
    else if (x > 0) return 4*x*x - 3*x + y
    else return 4*x*x - x - y
  }

  static now () { (new Date()).getTime() * 1e-3 }

  static get_cookie(cookie_name) {
    return document.cookie.
    replace(new RegExp(
      `(?:(?:^|.*;\\s*)${cookie_name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
  }

  static set_cookie(cname, cvalue, exdays) {
    const d = new Date()
    d.setTime(d.getTime() + (exdays*24*60*60*1000))
    var expires = "expires="+ d.toUTCString()
    document.cookie = `${cname}=${cvalue}; ${expires}; path=/`
  }

  static safe_string(
    unsafe_string, // String
  ) {
    const special = {'\\':1,' ':1,'\n':1,'@':1,'#':1,':':1,';':1,'Ǝ':1,'!':1}

    if (!unsafe_string) return 'Ǝ'
    if (unsafe_string == 'true') return '!true'
    else if (unsafe_string == 'false') return '!false'

    let safe_string = ''
    if (!isNaN(parseFloat(unsafe_string))) safe_string += '!'

    for (const i in unsafe_string) {
      const c = unsafe_string[i]
      if (special[c]) safe_string += '\\'
      safe_string += c
    }
    return safe_string
  }

  static unsafe_string(
    safe_string, // String
  ) {
    if (safe_string == 'Ǝ') return ''

    let unsafe_string = ''
    let prev = null
    for (const i in safe_string) {
      const c = safe_string[i]
      if (c != '\\' || prev == '\\') {
        unsafe_string += c
        prev = c
      }
    }
    return unsafe_string
  }

  static depth(
    object, // Object,Null
  ) {
    if (object == null) return 0
    else if (Array.isArray(object)) {
      let depth = ''
      for (let i = 0; i < object.length; ++i) {
        const _depth = this.depth(object[i])
        if (_depth > depth) depth = _depth
      }
      return depth + 1
    }
    else if (typeof object == 'object') {
      let depth = 0
      for (const i in object) {
        const _depth = this.depth(object[i])
        if (_depth > depth) depth = _depth
      }
      return depth + 1
    }
    else return 0
  }

  static stringify(
    value, // Object,Array,Number,Boolean,Null
    depth, // String,Null
    map,
  ) {
    const _type = typeof value
    let string = ''
    if (_type == undefined) string = 'undefined'
    else if (_type == 'number' || _type == 'boolean') string = value
    else if (_type == 'string') {
      if (value == '') string = 'Ǝ'
      else if (value == 'true') string = '!true'
      else if (value == 'false') string = '!false'
      else if (value == 'NaN') string = '!NaN'
      else if (value == 'undefined') string = '!undefined'
      else if (value == 'null') string = '!null'

      if (string == '') {
        if (parseFloat(value).toString() == value) string += '!'

        for (const i in value) {
          const char = value[i]
          if (
            char == '\n' || char == ' ' ||
            char == ';' || char == '!' || char == 'Ǝ'
          ) string += '\\'
          string += char
        }
      }
    }
    else if (_type == 'object') {

      let _depth = depth || ''
      if (this.depth(value) > 1) _depth += depth ? '  ' : '\n  '
      else _depth = ' '

      if (Array.isArray(value)) {
        string += '#'
        for (let i = 0; i < value.length; ++i) {
          string += _depth + this.stringify(value[i],_depth,map)
        }
        string += ';'
      }
      else {
        string += '@'
        for (const label in value) {

          let _label = _depth
          for (const i in label) {
            const char = label[i]

            if (
              char == ':' || char == ';' || char == 'Ǝ' ||
              char == '@' || char == '#' || char == '$' ||
              char == ' ' || char == '\n'
            ) _label += '\\'
            _label += char
          }

          string += _label + ':' + this.stringify(value[label],_depth,map)
        }
        string += ';'
      }
    }
    return string
  }

  static parse(
    string, // String
  ) {
    let idx = 0
    let state = { return: 'END' }

    const TOP = (...chars) => {
      const _char = string[idx]
      for (const i in chars) if (chars[i] == _char) return true;
      return false;
    }

    const POP = _tok => {
      tok = _tok
      if (string[idx] == '\\') ++idx; ++idx
      return string[idx-1]
    }
    const TOK = _tok => tok = _tok

    let tok = 'START', parent
    while (tok != 'END' && idx <= string.length) switch (tok) {
    case 'START':
      if (TOP('#')) POP('ARY', state.ary = [])
      else if (TOP('@')) POP('OBJ', state.obj = {})
      else if (TOP('Ǝ')) POP(state.return, state.value = '')
      else if (TOP('!')) POP('!TXT', state.txt = '')
      else TOK('TXT', state.txt = '')
      break

    case '!TXT':
      if (TOP(';',' ','\n')) TOK(state.return, state.value = state.txt)
      else state.txt += POP('!TXT')
      break

    case 'TXT':
      if (TOP(';',' ','\n')) {
        let {txt} = state
        if (txt == 'true') txt = true
        else if (txt == 'false') txt = false
        else if (txt == 'NaN') txt = NaN
        else if (txt == 'undefined') txt = undefined
        else if (txt == 'null') txt = null
        else if (parseFloat(txt).toString() == txt) txt = parseFloat(txt)
        TOK(state.return, state.value = txt)
      }
      else state.txt += POP('TXT')
      break

    case 'ARY':
      if (TOP(' ','\n')) POP('ARY')
      else if (TOP(';')) POP(state.return)
      else TOK('START', state = { parent: state, return: 'ARY_NEXT', })
      break

    case 'ARY_NEXT':
      state.parent.ary.push(state.value)
      state = state.parent

      if (TOP(';')) POP(state.return, state.value = state.ary)
      else tok = 'ARY'
      break

    case 'OBJ':
      if (TOP(' ','\n')) POP('OBJ')
      else if (TOP(';')) POP(state.return)
      else TOK('OBJ_LABEL', state.label = '')
      break

    case 'OBJ_LABEL':
      if (TOP(':')) POP('START', state = { parent: state, return: 'OBJ_NEXT' })
      else state.label += POP('OBJ_LABEL')
      break

    case 'OBJ_NEXT':
      parent = state.parent
      parent.obj[parent.label] = state.value
      if (parent.label == '_length') {
        parent.obj.flag = 'FLAG'
      }
      state = parent

      if (TOP(' ','\n')) POP('OBJ')
      else if (TOP(';')) POP(state.return, state.value = state.obj)
      else TOK('OBJ_LABEL', state.label = '')
      break
    }

    return state.value
  }

  static gitdif(
    root,spot, // String
  ) {
    root = root.split('\n'); spot = spot.split('\n')
    const [map,root_array,spot_array] = [{},[],[],[]]
    let tally = 0
    for (const i in root) {
      const tok = root[i]
      if (!map[tok]) map[tok] = ++tally
      root_array.push(map[tok])
    }
    const root_max = tally
    for (const i in spot) {
      const tok = spot[i]
      if (!map[tok]) map[tok] = ++tally
      spot_array.push(map[tok])
    }

    console.log(map,root_array,spot_array)
  }

  // for -pi < angle < pi
  static inverse_angle(angle) {
    return angle + pi > pi ? angle - pi : angle + pi
  }

  /*
    given three angles a,f,t such that {-pi < a,f,t < pi}
      find the angle scaler (r) of t such that (f - a)r + a ~ t
      the purpose of this static is
        1st: determine whether t is a member of the set of angles spanning from a to f
        2nd: produce a value that can be used to sort angles between a and f
    if t == a -> r == 0
    if t == f -> r == 1

    angle rank of t is 0 < r < 1 iff
      t is a member of the set of angles spanning from a to f
  */
  static get_angle_rank(a, f, t) {
    return f < a ? (t - a) / (f - a) :
      f < t ? (t - a - pi2) / (f - a - pi2) : t < a ? (t - a) / (f - a - pi2) : -1
  }

  // broken
  static insert_sort(sorted_array, spot_element, sort_by) {

    const sorted_array_length = sorted_array.length
    let mult = Math.floor( sorted_array_length / 2 )
    let root_idx = mult
    const spot_value = spot_element[sort_by]

    while (true) {

      if (sorted_array_length <= root_idx) {
        sorted_array.push(spot_element)
        return sorted_array_length
      }
      else if (root_idx <= 0) {
        sorted_array.splice(0, 0, spot_element)
        return 0
      }

      const root_value = sorted_array[root_idx][sort_by]

      if (mult == 0) {
        if (spot_value >= root_value) {
          ++root_idx
        }
        sorted_array.splice(root_idx, 0, spot_element)
        return root_idx
      }

      mult = Math.floor( mult / 2 )

      if (root_value < spot_value) {
        root_idx += mult || 1
      }
      else if (spot_value < root_value) {
        root_idx -= mult || 1
      }
      else {
        sorted_array.splice(++root_idx, 0, spot_element)
        return root_idx
      }
    }
  }

  static bin_idx_high (array, value, label) {
    let l = 0, r = array.length - 1, m = r
    while (l <= r) {
      const dif = value - array[m][label]
      if (dif > 0) l = m + 1
      else if (dif < 0) r = m - 1
      else {
        while (m < r) {
          const dif = value - array[m+1][label]
          if (dif < 0) return m
          else ++m
        }
        return m
      }
      m = Math.floor((l + r) / 2)
    }
    return r
  }

  static bin_insert (array, new_element, label) {
    const insert_idx = Lib.bin_idx_high(array, new_element[label], label)
    for (let idx = insert_idx; idx >= 0; --idx) {
      const element = array[idx]
      if (element == new_element) return array.length
      else if (element[label] < new_element[label]) break
    }
    array.splice(insert_idx+1, 0, new_element)
    return insert_idx+2
  }

  static bin_delete (array, bad_element, label) {
    const delete_idx = Lib.bin_idx_high(array, bad_element[label], label)
    for (let idx = delete_idx; idx >= 0; --idx) {
      const element = array[idx]
      if (element == bad_element) {
        array.splice(idx,1)
        return true
      }
      else if (element[label] < bad_element[label]) return false
    }
    return false
  }

  static bin_idx_low (array, value, label) {
    let l = 0, r = array.length - 1, m = r
    while (l <= r) {
      const dif = value - array[m][label]
      if (dif > 0) l = m + 1
      else if (dif < 0) r = m - 1
      else {
        while (m > l) {
          const dif = value - array[m-1][label]
          if (dif > 0) return m
          else --m
        }
        return m
      }
      m = Math.floor((l + r) / 2)
    }
    return r
  }

  static line_cross(p111, p112, p121, p122, p211, p212, p221, p222) {

    const p222_212 = p222 - p212, p221_211 = p221 - p211
    const p122_112 = p122 - p112, p121_111 = p121 - p111

    const p11 = ( p111 - p211 ) * p222_212 > ( p112 - p212 ) * p221_211
    const p12 = ( p121 - p211 ) * p222_212 > ( p122 - p212 ) * p221_211
    const p21 = ( p211 - p111 ) * p122_112 > ( p212 - p112 ) * p121_111
    const p22 = ( p221 - p111 ) * p122_112 > ( p222 - p112 ) * p121_111

    return p11 != p12 && p21 != p22
  }
}
