module.exports = Circuit => {

  return function Parse(string) {
    log('Parse')
    Circuit.Tok(string)
  }
}
