// This is the fun part.

// called on mouseup
function NewBalls() {

  // get the velocity defined by user
  const velocityx = _MOUSEUP_.x - _MOUSEDOWN_.x
  const velocityy = _MOUSEUP_.y - _MOUSEDOWN_.y

  // set _MAXRADIUS_ as the largest _BALLRADIUS_
  if (_MAXRADIUS_ < _BALLRADIUS_) _MAXRADIUS_ = _BALLRADIUS_;

  // for the number of balls...
  for (let i = 0; i < _NUMBALLS_; ++i) {
    // create a new ball
    _BALLS_.push({
      index: _BALLS_.length, // identify which ball (for use in flagging touches)
      radius: _BALLRADIUS_, // ball radius
      // mass determined by the area of the ball scaled by the density
      mass: _BALLRADIUS_ * _BALLRADIUS_ * Math.PI * _BALLDENSITY_,
      velocity: { x: velocityx, y: velocityy }, // assign the ball the defined velocity
      // randomize the position sligthly to avoid overlaps
      position: {
        x: _MOUSEDOWN_.x + Math.random(),
        y: _MOUSEDOWN_.y + Math.random()
      }
    })
  }
}

// check each balls surrounding chunks for neighboring balls
function CheckBallChunk(ball,grid,Collision) {
  ball.flag = {}; // clear ball flag (index of interacted balls)

  // get center chunk
  const x = Math.round(ball.position.x / _MAXRADIUS_);
  const y = Math.round(ball.position.y / _MAXRADIUS_);

  // for the nine chunks surrounding the ball,
  // collide with the neighboring balls
  for (let i = -1; i <= 1; ++i) {
    for (let j = -1; j <= 1; ++j) {
      const gridid = `${x+i},${y+j}`; // assemble grid id
      let chunk = grid[gridid]; // get chunk
      if (!chunk) grid[gridid] = chunk = []; // define new chunk if none exists
      else for (const i in chunk) Collision(ball,chunk[i]); // run collision
      chunk.push(ball); // add ball to chunk
    }
  }
}

// Draw each ball as a circle
function DrawBall(ball,pallet) {
  CTX.fillStyle = pallet[ball.index % pallet.length];
  CTX.beginPath();
  CTX.arc(ball.position.x,ball.position.y,ball.radius,0,PI2);
  CTX.closePath();
  CTX.fill();
}

// move the ball by velocity and bounce off walls
function MoveBall(ball,deltaT,width,height) {

  // move the ball each velocity increment
  ball.position.x += ball.velocity.x * deltaT;
  ball.position.y += ball.velocity.y * deltaT;

  // bounce off walls (salt with a little randomness to deal with some bugs)
  if (ball.position.x < ball.radius && ball.velocity.x < 0) {
    ball.position.x = ball.radius + Math.random();
    ball.velocity.x = -ball.velocity.x;
  }
  if (ball.position.y < ball.radius && ball.velocity.y < 0) {
    ball.position.y = ball.radius + Math.random();
    ball.velocity.y = -ball.velocity.y;
  }
  if (ball.position.x > width - ball.radius && ball.velocity.x > 0) {
    ball.position.x = width - ball.radius - Math.random();
    ball.velocity.x = -ball.velocity.x;
  }
  if (ball.position.y > height - ball.radius && ball.velocity.y > 0) {
    ball.position.y = height - ball.radius - Math.random();
    ball.velocity.y = -ball.velocity.y;
  }
}

// simple impulse calculation
// forcefully pushes balls apart
// simply swaps the momenta of each ball if they are touching
function SimpleCollision(a,b) {
  if (a.flag[b.index]) return; // make sure a haven't interfaced with b yet
  a.flag[b.index] = true; // flag b as having interfaced with a

  // get the distance vector
  const x = b.position.x - a.position.x;
  const y = b.position.y - a.position.y;
  const dist = Math.sqrt(x*x + y*y);

  // check if a and b are touching
  if (dist >= a.radius + b.radius) return;

  const mass = a.mass + b.mass;

  // calculate the padding to force the balls apart
  const pad = (dist - a.radius - b.radius) / dist;
  const apad = pad * b.mass / mass;
  const bpad = 1 - pad * a.mass / mass;

  // force the balls apart
  b.position.x = a.position.x + x * bpad;
  b.position.y = a.position.y + y * bpad;
  a.position.x += x * apad;
  a.position.y += y * apad;

  const centervx = (a.velocity.x * a.mass + b.velocity.x * b.mass) / mass;
  const centervy = (a.velocity.y * a.mass + b.velocity.y * b.mass) / mass;

  const ax = a.velocity.x - centervx, ay = a.velocity.y - centervy;
  const bx = b.velocity.x - centervx, by = b.velocity.y - centervy;

  // calculate the mass ratio between each ball
  const massratio = b.mass / a.mass

  a.velocity.x += bx * massratio - ax;
  a.velocity.y += by * massratio - ay;

  b.velocity.x += ax / massratio - bx;
  b.velocity.y += ay / massratio - by;
}

// Complex Impulse Calculation
// Forcefully pushes balls apart
// Swap the components of the momenta aligned with the distance vector between each ball
function ComplexCollision(a,b) {
  if (a.flag[b.index]) return; // make sure a haven't interfaced with b yet
  a.flag[b.index] = true; // flag b as having interfaced with a

  // get the distance vector and magnitude
  const x = b.position.x - a.position.x;
  const y = b.position.y - a.position.y;
  const dist = Math.sqrt(x*x + y*y);

  // check if a and b are touching
  if (dist >= a.radius + b.radius) return;

  const mass = a.mass + b.mass;

  // calculate the padding to force the balls apart
  const pad = (dist - a.radius - b.radius) / dist;
  const apad = pad * b.mass / mass;
  const bpad = 1 - pad * a.mass / mass;

  // force the balls apart
  b.position.x = a.position.x + x * bpad;
  b.position.y = a.position.y + y * bpad;
  a.position.x += x * apad;
  a.position.y += y * apad;

  // calculate the mass ratio between each ball
  const massratio = b.mass / a.mass

  // get the unitized version of the distance vector
  const ux = x / dist, uy = y / dist;

  const masssum = a.mass + b.mass;
  const centervx = (a.velocity.x * a.mass + b.velocity.x * b.mass) / masssum;
  const centervy = (a.velocity.y * a.mass + b.velocity.y * b.mass) / masssum;

  const ax = a.velocity.x - centervx, ay = a.velocity.y - centervy;
  const bx = b.velocity.x - centervx, by = b.velocity.y - centervy;

  const adot = ax * ux + ay * uy;
  const bdot = bx * ux + by * uy;

  a.velocity.x += ux * (bdot * massratio - adot);
  a.velocity.y += uy * (bdot * massratio - adot);

  b.velocity.x += ux * (adot / massratio - bdot);
  b.velocity.y += uy * (adot / massratio - bdot);
}
