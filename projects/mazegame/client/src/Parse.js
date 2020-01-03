module.exports = MazeGame => class Parse {
  constructor(
    string, // String
  ) {
    this._string = string
    this._idx = 0
  }

  top(
    char, // String,Boolean
  ) {
    const {_string,_idx} = this
    const special = JSON.parse(`{"\\":1,"\n":1," ":1,"@":1,"#":1,":":1,}`)

    if (_string[_idx] == '\\') {
      if (char == true) return true
      else if (special[char]) return false
      else return _string[_idx+1] == char
    }
    else if (char == _string[_idx]) return true
    else if (char == true) return !special[char]
    else return false
  }

  pop() {
    const {_string,_idx} = this

    if (_string[_idx] == '\\') {
      this._idx += 2
      return _string[_idx+1]
    }
    else {
      ++this._idx
      return _string[_idx]
    }
  }

  get TOP() {
    // TODO

    if (this.top(true)) {
      this.state.txt = ''
      return 'TXT'
    }
    if (this.top('#')) {
      this.pop()
      this.state.ary = []
      return 'ARY'
    }
    if (this.top('@')) {
      this.pop()
      this.state.obj = {}
      return 'OBJ'
    }
  }

  get TXT() {
    if (this.top('\n')) {
      this.pop()
      this.state.depth = 0
      return 'TXT_NEXT'
    }
    if (this.top(true)) {
      this.state.txt += this.pop()
      return 'TXT'
    }
  }

  get TXT_NEXT() {
    if (this.top(' ')) {
      ++this.state.depth
      return 'TXT_NEXT'
    }

    if (!this.state.parent) {
      // complete!
      return true
    }

    if (this.state.parent.depth < this.state.depth) {
      // you can't push elements to text
      return null
    }
    do {
      
    }

    // TODO
  }

  get ARY() {
    if (this.top(' ')) {
      this.state.txt = ''
      this.pop()
      return 'ARY_TXT'
    }
    if (this.top('\n')) {
      this.pop()
      this.state.depth = 0
      return 'ARY_NEXT'
    }
  }

  get ARY_TXT() {
    if (this.top(true)) {
      this.state.txt += this.pop()
      return 'ARY_TXT'
    }
    if (this.top(' ')) {
      this.pop()
      this.state.ary.push(this.state.txt)
      return 'ARY_TXT'
    }
    if (this.top('\n')) {
      this.pop()
      this.state.ary.push(this.state.txt)
      this.state.depth = 0
      return 'ARY_NEXT'
    }
  }

  get ARY_NEXT() {
    if (this.top(' ')) {
      ++this.state.depth
      return 'ARY_NEXT'
    }

    // this.state.return = 'ARY_NEXT'
    // this.state = {parent: this.state}
    // return 'TOP'
  }

  get OBJ() {
    if (this.top(' ')) {
      this.pop()
      this.state.label = ''
      return 'OBJ_LABEL'
    }
    if (this.top('\n')) {
      this.pop()
      this.state.depth = 0
      return 'OBJ_NEXT'
    }
  }




  get OBJ_NEXT() {

  }
}
