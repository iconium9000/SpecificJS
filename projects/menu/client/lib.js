const pi = Math.PI
const pi2 = pi * 2

function get_cookie(cookie_name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${cookie_name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

// for -pi < angle < pi
function inverse_angle(angle) {
  return angle + pi > pi ? angle - pi : angle + pi
}

/*
  given three angles a,f,t such that {-pi < a,f,t < pi}
    find the angle scaler (r) of t such that (f - a)r + a ~ t
    the purpose of this function is
      1st: determine whether t is a member of the set of angles spanning from a to f
      2nd: produce a value that can be used to sort angles between a and f
  if t == a -> r == 0
  if t == f -> r == 1

  angle rank of t is 0 < r < 1 iff
    t is a member of the set of angles spanning from a to f
*/
function get_angle_rank(a, f, t) {
  return f < a ? (t - a) / (f - a) :
    f < t ? (t - a - pi2) / (f - a - pi2) : t < a ? (t - a) / (f - a - pi2) : -1
}

// broken
function insert_sort(sorted_array, spot_element, sort_by) {

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
