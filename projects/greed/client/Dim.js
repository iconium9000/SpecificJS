module.exports = Greed => class Dim {
  get ctx() { return this._ctx }
  get canvas() { return this._canvas }

  get center() { return this._center }
  get fontScale() { return this._scale * 4 }
  get font() { return `${this.fontScale}px Georgia`}
  get scale() { return this._scale }
  get lineWidth() { return this._scale * 1.5 }
  get liteLineWidth() { return this._scale * 0.5 }
  get circleRadius() { return this._scale * 70 }
  get clientRadius() { return this._scale * 20 }
  get buttonRadius() { return this._scale * 13 }
  get strokeStyle() { return 'white' }
  get fontStyle() { return 'white' }
  get buttonStyle() { return '#484848'}
  get backgroundStyle() { return '#202020' }
  get diceRadius() { return this._scale * 30 }
  get dotRadius() { return this._scale * 2 }
  get subDiceRadius() { return this._scale * 6 }
  get half() { return Greed.Point.init(1,0,this.buttonRadius) }
  get shift() { return Greed.Point.init(0,4,this._scale) }

  vec({x,y}) {
    const {_center:{_x,_y},_scale} = this
    return Greed.Point.init(x - _x,y - _y, 1/_scale)
  }

  fillText({x,y}, text) { this._ctx.fillText(text,x,y+this.fontScale*0.35) }

  arc({x,y},r) { this._ctx.arc(x,y,r,0,Greed.Lib.pi2) }

  constructor() {
    this._canvas = document.getElementById('canvas')
    const width = this._canvas.width = window.innerWidth - 20
  	const height = this._canvas.height = window.innerHeight - 20
    this._ctx = canvas.getContext('2d') // CanvasRenderingContext2D
    this._center = Greed.Point.init(width,height,0.5)
    this._scale = this._center.short.scale / 100
  }

}
