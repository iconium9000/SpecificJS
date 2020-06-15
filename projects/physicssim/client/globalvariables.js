/*
Using global variables in this way is very much frowned upon,
but my goal for this project is that the code is readable.

The goal of this project is not security; it is easy of use and modification.
*/
const PI2 = 2 * Math.PI; // used in drawing each ball
let _TIME_ = (new Date()).getTime() // for interframe timekeeping

const SIDEBAR = document.getElementById("sidebar");
const CONTENT = document.getElementById("content");
const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");

// point locations {x,y} mouse interactions
let _MOUSEDOWN_ = null, _MOUSEUP_ = null;

const COLLISIONBUTTON = document.getElementById("collisionbutton");
let _COLLISIONTOGGLE_ = true; // collision type (true: simple, false: complex)

const SHOWCHUNKBUTTON = document.getElementById("showchunksbutton");
let _SHOWCHUNKTOGGLE_ = false; // collision chunks draw (true: show, false: hide)

const PAUSEBUTTON = document.getElementById("pausebutton");
let _PAUSEPLAYTOGGLE_ = false; // pause play toggle (true: play, false: paused)

const PALLETDROPDOWN = document.getElementById("palletdropdowncontent");
const DROPDOWNCONTENT = document.getElementsByClassName("dropdown-content");
let _PALLETNAME_ = "The Incredibles"; // the name of the currently active pallet
const _PALLETS_ = { // color pallets from a bunch of pixar movies
  "Monsters, Inc.": ["#006ED0","#518EFF","#5DBCD2","#B48CFC","#5BFC4B","#9CFC6C"],
  "Toy Story": ["#F1060B","#1A48A0","#FFEE15","#EAAB66","#B4DC8C","#742C64"],
  "Cars": ["#E9302A","#A46C64","#EC7B4B","#EEF50F","#736B7B","#2C2424"],
  "Finding Nemo": ["#EB4511","#040414","#FCF44C","#045CFC","#6BCBF3","#048B7C"],
  "The Incredibles": ["#AA0A00","#D52D12","#EB8B25","#F4B900","#0B0B0B","#E7A17E"],
  "Wall-E": ["#CC743C","#A49C94","#FCC41C","#F4F4FC","#040404","#0464A4"],
  "Inside Out": ["#0494EC","#FCE4B4","#D4EC7C","#BC84DC","#74BB43","#B3240B"],
  "Coco": ["#FCDC84","#7C4C74","#643404","#FC5C14","#EC4494","#2395CB"],
  // ... Add any pallet of hex colors here!
};
let palletdropdownHTML = "";
for (const palletname in _PALLETS_) {
  palletdropdownHTML += `<a href="javascript:SelectPallet('${palletname}')">${palletname}</a>`;
}
PALLETDROPDOWN.innerHTML = palletdropdownHTML;

let _BALLS_ = []; // list of balls on screen

const NUMBALLSSLIDER = document.getElementById("numballsslider");
const NUMBALLSHTML = document.getElementById("numballs");
let _NUMBALLS_ = parseInt(NUMBALLSSLIDER.value);

const BALLRADIUSSLIDER = document.getElementById("ballradiusslider");
const BALLRADIUSHTML = document.getElementById("ballradius");
let _BALLRADIUS_ = parseInt(BALLRADIUSSLIDER.value);
let _MAXRADIUS_ = 0; // The size of the largest ball on screen

const BALLDENSITYSLIDER = document.getElementById("balldensityslider");
const BALLDENSITYHTML = document.getElementById("balldensity");
let _BALLDENSITY_ = parseInt(BALLDENSITYSLIDER.value);
