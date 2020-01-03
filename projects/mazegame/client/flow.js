
// OBJ
//   if (this.top(' '))
//     this.state.pop()
//     this.state.label = ''
//     return OBJ_LABEL
//   if (this.top('\n'))
//     this.state.pop()
//     return OBJ_NEXT
// OBJ_LABEL
//   if (this.top('\c'))
//     this.state.label += this.state.pop()
//     txtPop
//     return OBJ_LABEL
//   if (this.top(':'))
//     this.state.pop()
//     this.state.txt = ''
//     return OBJ_VALUE
// OBJ_VALUE
//   if (this.top('\c'))
//     this.state.txt += this.state.pop()
//     return OBJ_VALUE
//   if (this.top(' '))
//     this.state.pop()
//     this.state.obj[this.state.label] = this.state.txt
//     this.state.label = ''
//     return OBJ_LABEL
//   if (this.top('\n'))
//     this.state.pop()
//     return OBJ_NEXT
// OBJ_NEXT
//   if (this.state.top == ' ')
//     this.state.depth += this.state.pop()
//     return OBJ_NEXT
//   TODO
