module.exports = MazeGame => {
  return {
    name: 'fu',
    strsplit: (string, char) => {
      const index = string.indexOf(char)
      if (index < 0) {
        return {
          token: string,
          msg: ''
        }
      } else {
        return {
          token: string.substr(0, index),
          msg: string.substr(index + 1)
        }
      }
    },
    getFirstKeyElement: obj => {
      for (const i in obj) {
        return obj[i]
      }
    },
    strkey: (array, element) => {
      const k = Object.keys(array)
      const i = 0
      const string = ''
      while (i < k.length) {
        string += array[k[i]][element]
        if (i++ < k.length - 1) {
          string += ', '
        }
      }
      return `[${string}]`
    },
    randKey: array => {
      let r
      do { r = Math.random() } while (array[r]);
      return r
    },
    getSign: n => {
      return n > 0 ? 1 : n < 0 ? -1 : 0
    },

    forEach: (a, f) => {
      for (const i in a) {
        f(a[i])
      }
    },
    isEqual: v => {
      for (const i = 1; i < arguments.length; ++i) {
        if (v == arguments[i]) {
          return true
        }
      }
      return false
    },
    swap: (v, a, b) => {
      const t = v[a]
      v[a] = v[b]
      v[b] = t
    }
  }
}
