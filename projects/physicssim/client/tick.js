/*
  Function called every tick to
  calculate collisions between balls and draw and move them accordingly.
*/

function Tick() {

  // get interframe deltaT
  const temptime = (new Date()).getTime();
  const deltaT = (temptime - _TIME_) * 1e-3;
  _TIME_ = temptime;

  // resize the content panel to fit window
  const {innerWidth,innerHeight} = window;
  const {offsetWidth,offsetHeight} = SIDEBAR;
  let width = innerWidth - offsetWidth - 40;
  let height = innerHeight - offsetHeight - 40;
  if (innerWidth - offsetWidth < 40) width = innerWidth - 40;
  else height = innerHeight - 20;
  CANVAS.width = width;
  CANVAS.height = height;

  // get correct collision function
  const Collision = _COLLISIONTOGGLE_ ? SimpleCollision : ComplexCollision;

  const grid = {}; // define new grid

  // check each balls surrounding chunks for neighboring balls
  for (const i in _BALLS_) CheckBallChunk(_BALLS_[i],grid,Collision);

  // draw chunks which balls are in
  if (_SHOWCHUNKTOGGLE_) {
    CTX.fillStyle = "#505050";
    for (const i in grid) {
      let [x,y] = i.split(",");
      x = parseInt(x) * _MAXRADIUS_;
      y = parseInt(y) * _MAXRADIUS_;
      CTX.beginPath();
      CTX.rect(x-_MAXRADIUS_/2,y-_MAXRADIUS_/2,_MAXRADIUS_,_MAXRADIUS_);
      CTX.closePath();
      CTX.fill();
    }
  }

  const pallet = _PALLETS_[_PALLETNAME_]; // Get current color pallet
  // Draw and Move each ball
  for (const i in _BALLS_) {
    DrawBall(_BALLS_[i],pallet);
    MoveBall(_BALLS_[i],deltaT,width,height);
  }

  // draw line to indicate velocity
  if (_MOUSEDOWN_ && _MOUSEUP_) {
    CTX.strokeStyle = "white";
    CTX.beginPath();
    CTX.moveTo(_MOUSEDOWN_.x,_MOUSEDOWN_.y);
    CTX.lineTo(_MOUSEUP_.x,_MOUSEUP_.y);
    CTX.closePath();
    CTX.stroke();
  }

  // Game Loop
  window.requestAnimationFrame(Tick); // ask window to call Tick again
}
