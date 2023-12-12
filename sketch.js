var song;
var vocal;
var guitar;


var fft;
var fft_vocal;
var fft_guitar;

var amp_guitar;

var particles = [];
var sun;
var bridge;

var s;

var xs = [];
var yx = [];

var dev = true;
var freq = 'bass';

function probability(p){
  return p>random(100)
}

function preload() {
  print("loading");
  song = loadSound("mygo/mygo.flac");
  vocal = loadSound("compressed/vocals.mp3");
  guitar = loadSound("mygo/other.wav");

  //img = loadImage("bg.jpg");
}

function setup() {
  print("loading complete");
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  imageMode(CENTER);
  rectMode(CENTER);
  frameRate(60);
  vocal.setVolume(0.1);
  guitar.setVolume(0.1);
  fft_vocal = new p5.FFT();
  fft_vocal.setInput(vocal);

  //amplifier = new p5.Amplitude();
  //amplifier.setInput(song);
  amp_guitar = new p5.Amplitude();
  amp_guitar.setInput(guitar);

  s = new Scribble();
  //img.filter(BLUR, 12);
  //noLoop();
  sun = new Sun(-100,height/2);
  bridge = new Bridge();
  noSmooth();
}

function draw() {
  if(dev){
    let playButton = createButton('Play');
    playButton.position(10, 10);
    playButton.mousePressed(playMusic);
  
    slider = createSlider(0, 1, 0, 0.01);
    slider.position(10, 40);
    slider.style('width', '380px');
    slider.input(updateProgress);

    let bassButton = createButton('bass');
    bassButton.position(50,10);
    bassButton.mousePressed(switchBass);

    let lowMidButton = createButton('lowMid');
    lowMidButton.position(100,10);
    lowMidButton.mousePressed(switchLowMid);

    let midButton = createButton('mid');
    midButton.position(150,10);
    midButton.mousePressed(switchMid);

    let highMidButton = createButton('highMid');
    highMidButton.position(200,10);
    highMidButton.mousePressed(switchHighMid);

    let trebleButton = createButton('treble');
    trebleButton.position(250,10);
    trebleButton.mousePressed(switchTreble);
  }



  let temp = map(song.currentTime(),0,song.duration(),0,1);
  let bgcolor = lerpColor(color(135,206,250),  color(240, 200, 150), temp);
  background(bgcolor);
  var wave = fft_vocal.waveform();
  xs = [];
  ys = [];
  let progress = song.currentTime() / song.duration();

  sun.x = map(progress, 0, 1, 0 - sun.radius - 30, width + sun.radius + 30);
  if(progress >= song.duration()/2){
    sun.y = map(progress, 0.5, 0, height/7, height/6);
  }
  else{
    sun.y = map(progress, 0, 0.5, height/6, height/7);
  }

  sun.display();

  bridge.display();
  for(var i =0; i< wave.length;i+=100){
    var y = map(wave[i], -0.5,0.5,height/5*3, height);
    var x = map(i, 0, wave.length-1, 0, width);
    vertex(x,y);
    xs.push(x);
    ys.push(y);
  }
  stroke(255);
  strokeWeight(3);
  s.scribbleFilling(xs,ys,5, 10);

  var amp = amp_guitar.getLevel()*10;
  let prob = map(amp, 0.10, 0.25, 5, 80);
 // print(amp);
  if(song.isPlaying() && probability(prob)){
    var p = new CherryBlossomPetal(random(width),-2);
    particles.push(p);
  }

  for (var i = 0; i < particles.length; i++) {
    if(!particles[i].edges()){
      //particles[i].vx = map(amp, 0.5, 0.25, 0, particles[i].vXMax)*Math.sign(particles[i].vX);
      particles[i].vy = map(amp, 0.1, 0.25, 10, particles[i].vYMax);
      particles[i].display(); 
      particles[i].move();

    }else{
      particles.splice(i,1);
    }
  }
}

function mousePressed(){
  print(particles.length);
  print(amp_guitar.getLevel()*10);
  //print(frameRate());
  if(!dev){
    playMusic();
  }
}

function playMusic() {
  if (song.isPlaying()) {
    song.pause();
    vocal.pause();
    guitar.pause();
  } else {
    song.play();
    vocal.play();
    guitar.play();
  }
}

function switchBass(){
  freq = 'bass';
}

function switchLowMid(){
  freq = 'lowMid';
}

function switchMid(){
  freq = 'mid';
}

function switchHighMid(){
  freq = 'highMid';
}

function switchTreble(){
  freq = 'treble';
}

function updateProgress() {
  let value = slider.value();
  song.jump(value * song.duration());
  vocal.jump(value * song.duration())
  guitar.jump(value * song.duration());
}


class CherryBlossomPetal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.amplitude = 10;
    this.xtrans = 0;
    this.vXMax = random(3);
    this.vx = this.vXMax;
    this.vYMax = random(10,20);
    this.vy = this.vYMax;
    this.size = random(10, 20);
    this.color = color(random(200, 255), random(150, 200), random(200, 255));
  }

  display() {
    noStroke();
    fill(this.color);
    push();
    translate(this.x,this.y);
    rotate(20)
    beginShape();
    curveVertex(this.size / 2, 0);
    curveVertex(this.size / 2, 0);
    curveVertex(this.size, this.size / 2);
    curveVertex(this.size / 2, this.size);
    curveVertex(0, this.size / 2);
    curveVertex(this.size / 2, 0);
    curveVertex(this.size / 2, 0);
    endShape(CLOSE);
    pop();
  }

  move() {
    this.y += this.vy;
    this.x += this.vx;
    this.xtrans+=this.vx;
    if(this.xtrans >= this.amplitude || this.xtrans<=-this.amplitude){
      this.vx = -this.vx;
    }

  }
  edges(){
    if(this.y < height + this.size){
      return false;
    }
    return true;
  }
}

class Sun {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.xs = [];
    this.ys = [];
    this.radius = 50;
    this.numRays = 8;
    this.rotate = 0;
    this.randomRotate = [];
    for(var i = 0; i < this.numRays; i++){
      this.randomRotate.push(random(-10,10));
    }
  }

  display() {
    this.xs = [];
    this.ys = [];
    for(var i = 0; i < 360; i++){
      let angle = i;
      let x = this.x + cos(angle) * (this.radius);
      let y = this.y + sin(angle) * (this.radius);
      this.xs.push(x);
      this.ys.push(y);
    }
    stroke(255, 255, 0);
    strokeWeight(3);
    s.scribbleFilling(this.xs,this.ys,10, 10);
    stroke(255, 255, 0);
    strokeWeight(3);
    //fill(255,255,0);
    s.scribbleEllipse(this.x,this.y,this.radius*2,this.radius*2);
    //ellipse(this.x,this.y,this.radius*2);
    stroke(255, 255, 0);
    strokeWeight(2);
    let angleIncrement = 360 / this.numRays;
    if(song.isPlaying()){
      this.rotate += .01;

    }
    for (let i = 0; i < this.numRays; i++) {
      let angle = i * angleIncrement + this.rotate + this.randomRotate[i];
      let startX = this.x + cos(angle) * (this.radius + 10);
      let startY = this.y + sin(angle) * (this.radius + 10);
      let rayX = this.x + cos(angle) * (this.radius + 30);
      let rayY = this.y + sin(angle) * (this.radius + 30);
      s.scribbleLine(startX, startY, rayX, rayY);
    }
  }
}

class Bridge{
  constructor(){
    this.x = width/2;
    this.y = height/2;
    this.numOfFence = 15;
    this.numOfPile = 5;
    this.pileWidth = 50;
    this.pileHeight = 200;
    this.pileY = (height/5*3 + height)/2 - this.pileHeight/2;
    this.bodyHeight = 50
    this.bodyY = (height/5*3 + height)/2 - this.pileHeight/4*3 - this.bodyHeight/2;
    this.bodyXs = [0,width,0,width];
    this.bodyYs = [this.bodyY-this.bodyHeight/2,this.bodyY-this.bodyHeight/2,this.bodyY+this.bodyHeight/2,this.bodyY+this.bodyHeight/2]
    this.fenceHeight = 40;
    this.fenceY = this.bodyY-this.bodyHeight/2-this.fenceHeight/2;
  }

  display(){
    stroke(192, 192, 192);
    fill(192);
    for(var i = 0; i < this.numOfPile; i++){
      let x = map(i,0,this.numOfPile, width/5, width);
      let y = this.pileY;
      s.scribbleRect(x,y,this.pileWidth,this.pileHeight);
      let xs = [x - this.pileWidth/2, x + this.pileWidth/2, x - this.pileWidth/2, x + this.pileWidth/2];
      let ys = [y + this.pileHeight/2, y + this.pileHeight/2, y - this.pileHeight/2, y - this.pileHeight/2];
      s.scribbleFilling(xs,ys,10,10);
    }

    stroke(169);
    rect(this.x,this.bodyY,width,this.bodyHeight);
    //s.scribbleRect(this.x,this.bodyY,width,this.bodyHeight);
    s.scribbleFilling(this.bodyXs, this.bodyYs, 10,50);

    stroke(128,128,128);
    for(var i = 0; i < this.numOfFence; i++){
      let x = map(i,0,this.numOfFence-1,0,width) + 10;
      s.scribbleLine(x,this.fenceY + this.fenceHeight/2, x, this.fenceY - this.fenceHeight/2);
    }

    line(0,this.fenceY - this.fenceHeight/2, width, this.fenceY - this.fenceHeight/2);


  }

}