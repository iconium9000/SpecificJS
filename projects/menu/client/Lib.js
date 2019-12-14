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
  static pi = Math.PI
  static pi2 = this.pi * 2

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

  static get_first(object) {
    for (const i in object) return object[i]
  }

  static now () { (new Date()).getTime() * 1e-3 }

  static get_cookie(cookie_name) {
    return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${cookie_name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
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