module.exports = MazeGame => class Target extends MazeGame.Type {

  static get key_bind() { return 'g' }
  static get fill_color() { return 'black' }
  static get stroke_color() { return 'white' }
  static get thin_stroke_color() { return '#505050' }
  static get line_width() { return 0.5 }
  static get scale() { return 20 }
  static get thin_line_width() { return this.line_width / 3 }
  static get speed() { return 1e-2 } // dist / time = speed

  is_parent(
    target, // Target
  ) {
    return target == this
  }

  get is_open() { return this._is_open }
  set is_open(
    is_open, // Boolean
  ) {
    const {_is_open} = this
    if (_is_open == is_open) return
    this._is_open = is_open
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    const {_root} = this
    if (_root && _root.equals(root)) return
    this._root = root
  }

  get editor() { return this._editor }
  set editor(
    editor, // Editor,Null
  ) {
    const {_editor} = this
    if (_editor == editor) return
    if (_editor) { this._editor = null; _editor.target = null }
    if (editor) { this._editor = editor; editor.target = this }
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.targets[id] = this
  }

  copy(
    src, // Level
  ) {
    const _target = super.copy(src)

    const {_editor,_is_open,constructor} = this
    if (_is_open) _target._is_open = _is_open
    if (_editor) _target.editor = constructor.copy(_editor, src)

    return _target
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_editor,_is_open,constructor} = this
    if (_is_open) _serialize.is_open = _is_open
    if (_editor) _serialize.editor = _editor.serialize(src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, id, src)

    const {editor,is_open} = serialize[id], {constructor} = this
    if (is_open) this._is_open = is_open
    if (editor) this.editor = constructor.read(serialize, src, editor)

    return this
  }

  static init(
    src, // Level
    id, // String,Null
  ) {
    const _target = super.init(src,id)
    return _target
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.targets[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    center,root,mouse, // MazeGame.Point (in drawspace)
  ) {}
}
