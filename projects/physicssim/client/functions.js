// Button and Slider event listeners

// clear all balls from the map
function ClearBalls() {
  _MAXRADIUS_ = 0; // reset the max ball radius
  _BALLS_ = []; // clear all balls from the map
}

// reset the velocity/momentum of all balls
function ClearMomentum() {
  for (const i in _BALLS_) _BALLS_[i].velocity = {x:0,y:0}; // zero each velocity
}

// Pallet Dropdown Detector
function PalletDropDown() {
  document.getElementById("palletdropdowncontent").classList.toggle("show");
}

// Pallet Select Function
function SelectPallet(newpalletname) {
  const palletdropdown = document.getElementById('palletdropdown');
  _PALLETNAME_ = newpalletname; // set the global pallet name
  palletdropdown.innerHTML = "Color Pallet: " + newpalletname;
}

// Close the pallet dropdown if the user clicks outside of it
window.onclick = (event) => {
  if (event.target.matches('.dropbtn')) return;
  for (let i = 0; i < DROPDOWNCONTENT.length; i++) {
    const openDropdown = DROPDOWNCONTENT[i];
    if (openDropdown.classList.contains('show')) {
      openDropdown.classList.remove('show');
    }
  }
}

// toggle collision button listener
function ToggleCollision() {
  _COLLISIONTOGGLE_ = !_COLLISIONTOGGLE_; // toggle the collision state
  COLLISIONBUTTON.innerHTML = (_COLLISIONTOGGLE_ ? "Simple" : "Complex") + " Collisions";
}

// show chunks toggle button listener
function ToggleShowChunk() {
  _SHOWCHUNKTOGGLE_ = !_SHOWCHUNKTOGGLE_; // toggle the show chunks state
  SHOWCHUNKBUTTON.innerHTML = (_SHOWCHUNKTOGGLE_ ? "Hide" : "Show") + " Chunks";
}

// Pause/Play Toggle
function Pause() {
  _PAUSEPLAYTOGGLE_ = !_PAUSEPLAYTOGGLE_;
  PAUSEBUTTON.innerHTML = (_PAUSEPLAYTOGGLE_ ? "Play" : "Paused");
}

// get mouse location from given mouse event listener
function GetMouse(e) {
  return {x:e.offsetX,y:e.offsetY};
}

$(CONTENT).mousedown(e => _MOUSEDOWN_ = GetMouse(e));
$(CONTENT).mousemove(e => _MOUSEUP_ = GetMouse(e));
$(CONTENT).mouseup(e => {
  _MOUSEUP_ = GetMouse(e);
  if (_MOUSEDOWN_) NewBalls();
  _MOUSEDOWN_ = _MOUSEUP_ = null;
});

NUMBALLSSLIDER.oninput = () => {
  _NUMBALLS_ = parseInt(NUMBALLSSLIDER.value);
  NUMBALLSHTML.innerHTML = `Number of Balls: ${_NUMBALLS_}`;
}

BALLRADIUSSLIDER.oninput = () => {
  _BALLRADIUS_ = parseInt(BALLRADIUSSLIDER.value);
  BALLRADIUSHTML.innerHTML = `Ball Radius: ${_BALLRADIUS_}`;
}

BALLDENSITYSLIDER.oninput = () => {
  _BALLDENSITY_ = parseInt(BALLDENSITYSLIDER.value);
  BALLDENSITYHTML.innerHTML = `Ball Density: ${_BALLDENSITY_}`;
}
