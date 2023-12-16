var song;
var vocal;
var guitar;
var bass;
var drum;

var fft;
var fft_vocal;
var fft_guitar;
var fft_bass;
var fft_drum;

var amp_guitar;

var particles = [];
var sun;
var bridge;
var clouds = [];
var tomori;

var wave;
var horizon;

var s;

var xs = [];
var yx = [];
var waves = [];

var dev = false;
var freq = 'bass';
var isShaking = false;

let queue = [];

function probability(p){
  return p>random(100)
}

function generateRandomValue() {
  // Generate a random number between 0 and 1
  const randomNumber = Math.random();

  // Map the random number to 1 or -1 with a 50% chance each
  if (randomNumber < 0.5) {
    return 1;
  } else {
    return -1;
  }
}

function preload() {
  print("loading");
  song = loadSound("mygo/mygo.flac");
  vocal = loadSound("mygo/vocals.wav");
  guitar = loadSound("mygo/other.wav");
  bass = loadSound("mygo/bass.wav");
  drum = loadSound("mygo/drums.wav")


  //img = loadImage("bg.jpg");
}

function setup() {
  //set up
  print("loading complete");
  frameRate(24);
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  imageMode(CENTER);
  rectMode(CENTER);
  frameRate(60);
  vocal.setVolume(0.1);
  guitar.setVolume(0.1);
  bass.setVolume(.1);
  drum.setVolume(.1);
  fft_vocal = new p5.FFT();
  fft_vocal.setInput(vocal);
  fft_bass = new p5.FFT();
  fft_bass.setInput(bass);
  fft_drum = new p5.FFT();
  fft_drum.setInput(drum);

  //amplifier = new p5.Amplitude();
  //amplifier.setInput(song);
  amp_guitar = new p5.Amplitude();
  amp_guitar.setInput(guitar);


  s = new Scribble();
  //img.filter(BLUR, 12);
  //noLoop();

  //create sun and bridge
  sun = new Sun(-100,height/2);
  bridge = new Bridge();

  //create filetring canvas
  overlayCanvas = createGraphics(width,height);
  overlayCanvas.clear();
  overlayCanvas.noFill();
  overlayCanvas.stroke(255,50);

  //create clouds
  for (let i = 0; i < 5; i++) {
    let x = random(width);
    let cloudSize = random(30, 80);
    let y = random(0+cloudSize,height/4);
    let cloud = new Cloud(x, y, cloudSize);
    clouds.push(cloud);
  }

  //tomori = new Tomori(width/2, height/2, 0.5);
  //noSmooth();
  triggerInterval = setInterval(createWaves, 1000);
  horizon = new VocalWave(1);
}

function draw() {
  //dev mode
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

  //shaking effect
  fft_drum.analyze();
  let level = fft_drum.getEnergy('lowMid');
  if (level > 100 && !isShaking) {
    isShaking = true;
    startShake();
  }

  if (isShaking) {
    let shakeAmplitude = map(level, 100, 150, 0, 2);
    let dx = random(-shakeAmplitude, shakeAmplitude);
    let dy = random(-shakeAmplitude, shakeAmplitude);
    translate(dx, dy);
  }

  //change bg color overtime
  let temp = map(song.currentTime(),0,song.duration(),0,1);
  let bgcolor = lerpColor(color(135,206,250),  color(240, 200, 150), temp);
  background(bgcolor);
  wave = fft_vocal.waveform();
  xs = [];
  ys = [];
  let progress = song.currentTime() / song.duration();

  //change sun position overtime
  sun.x = map(progress, 0, 1, 0 - sun.radius - 30, width + sun.radius + 30);
  if(progress >= song.duration()/2){
    sun.y = map(progress, 0.5, 0, height/8, height/7);
  }
  else{
    sun.y = map(progress, 0, 0.5, height/7, height/8);
  }

  sun.display();

  //handle clouds movement
  for (var i = 0; i < clouds.length; i++) {
    clouds[i].display();
    if(song.isPlaying()){
      clouds[i].move(1);
    }
    if(clouds[i].edges()){
      if(clouds[i].dir > 0){
        clouds[i].x = -clouds[i].size;
      }
      else{
        clouds[i].x = width + clouds[i].size
      }

      clouds[i].y = random(0+clouds[i].size,height/4);
    }
  }

  //tomori.display();
  //show bridge
  bridge.display();

  //show horizon
  strokeWeight(10);
  horizon.display();

  //handle waves movement
  strokeWeight(5)
  for (var i = 0;i<waves.length;i++){
    if(waves[i].isMoving){
      waves[i].display();
      waves[i].trans+=waves[i].v;
      if(waves[i].trans > height/5 + 2){
        if(!song.isPlaying()){
          let temp = waves.splice(i,1);
          delete temp[0];
        }
        else{
          waves[i].trans = 0;
          waves[i].isMoving = false;
          if(queue.length == 0){
            activateMethodAtRandomTime(waves[i], 'move');
          }
          queue.push(waves[i]);
        }
      }
    }
  }

  if (queue.length > 0) {
    if(queue[0].isMoving){
      queue.shift();
      if(queue.length > 0){
        activateMethodAtRandomTime(queue[0], 'move');
      }
    }
  }

  /*
  for(var i =0; i< wave.length;i+=1000){
    var y = map(wave[i], -0.3,0.3,height/5*3, height);
    var x = map(i, 0, wave.length-1, 0, width);
    vertex(x,y);
    xs.push(x);
    ys.push(y);
  }
  stroke(255);
  strokeWeight(3);
  s.scribbleFilling(xs,ys,5, 10);
*/

//control blossoms
  var amp = amp_guitar.getLevel()*10;
  let prob = map(amp, 0.10, 0.20, 10, 150);
  if(prob>=100){
    let vy = map(amp, 0, 0.22, 2, 5);
    var p = new CherryBlossomPetal(random(width),-2, vy);
    particles.push(p);
    prob-=100;
  }
 // print(amp);
  if(song.isPlaying() && probability(prob)){
    let vy = map(amp, 0, 0.22, 2, 5);
    var p = new CherryBlossomPetal(random(width),-2, vy);
    particles.push(p);
  }

  for (var i = 0; i < particles.length; i++) {
    if(!particles[i].edges()){
      //particles[i].vx = map(amp, 0.5, 0.25, 0, particles[i].vXMax)*Math.sign(particles[i].vX);
      //particles[i].vy = map(amp, 0, 0.22, 1, particles[i].vYMax);
      particles[i].display(); 
      particles[i].move();

    }else{
      let temp = particles.splice(i,1);
      delete temp[0];
    }
  }

  //control lightness
  fft_bass.analyze();
  let bassAmp = fft_bass.getEnergy('bass');
  if(bassAmp < 100){
    var alpha = map(bassAmp, 100, 0,90, 100);
  }
  else if(bassAmp > 190){
    var alpha = 10
  }
  else{
    var alpha = map(bassAmp, 180, 120, 50, 70);
  }
  overlayCanvas.clear();
  overlayCanvas.fill(0,0,0,alpha);
  overlayCanvas.rect(0,0,width,height);

  image(overlayCanvas, width/2, height/2);
}

function mousePressed(){
  //print(frameRate());
  print(waves);
  print(waves);
  if(!dev){
    playMusic();
  }
}

function playMusic() {
  if (song.isPlaying()) {
    song.pause();
    vocal.pause();
    guitar.pause();
    bass.pause();
    drum.pause();
  } else {
    song.play();
    vocal.play();
    guitar.play();
    bass.play();
    drum.play();
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

function startShake() {
  setTimeout(() => {
    isShaking = false;
    translate(0, 0);
  }, 100);
}

function createWaves(){
  if(waves.length<4 && song.isPlaying()){
    let temp = new VocalWave();
    queue.push(temp);
    waves.push(temp);
    if(queue.length == 1){
      activateMethodAtRandomTime(queue[0], 'move');
    }
  }
}

function activateMethodAtRandomTime(instance, methodName) {
  // Generate a random delay (e.g., between 1 and 5 seconds)
  let randomDelay = Math.random() * 1000 + 1000; // 1 to 5 seconds in milliseconds

  setTimeout(() => {
    instance[methodName]();
  }, randomDelay);
}

class CherryBlossomPetal {
  constructor(x, y, yv) {
    this.x = x;
    this.y = y;
    this.amplitude = 10;
    this.xtrans = 0;
    this.vXMax = random(0.1,0.5);
    this.vx = this.vXMax;
    this.vYMax = random(3, 5);
    this.vy = yv;
    this.size = random(10, 20);
    this.color = color(random(200, 255), random(150, 200), random(200, 255));
    this.rotate = random(-20,20);
  }

  display() {
    noStroke();
    fill(this.color);
    push();
    translate(this.x,this.y);
    rotate(this.rotate);
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
    stroke(255, 215, 0);
    strokeWeight(3);
    //fill(255,215,0);
    s.scribbleEllipse(this.x,this.y,this.radius*2,this.radius*2);
    //ellipse(this.x,this.y,this.radius*2);
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
    this.bodyXs = [0,0,width,width];
    this.bodyYs = [this.bodyY-this.bodyHeight/2,this.bodyY+this.bodyHeight/2,this.bodyY+this.bodyHeight/2,this.bodyY-this.bodyHeight/2]
    this.fenceHeight = 40;
    this.fenceY = this.bodyY-this.bodyHeight/2-this.fenceHeight/2;
  }

  display(){
    stroke(192, 192, 192);
    noFill();
    for(var i = 0; i < this.numOfPile; i++){
      let x = map(i,0,this.numOfPile, width/5, width);
      let y = this.pileY;
      //s.scribbleRect(x,y,this.pileWidth,this.pileHeight);
      rect(x,y,this.pileWidth,this.pileHeight);
      let xs = [x - this.pileWidth/2, x + this.pileWidth/2, x + this.pileWidth/2, x - this.pileWidth/2];
      let ys = [y + this.pileHeight/2, y + this.pileHeight/2, y - this.pileHeight/2, y - this.pileHeight/2];
      s.scribbleFilling(xs,ys,5,10);
    }

    stroke(169);
    rect(this.x,this.bodyY,width,this.bodyHeight);
    //s.scribbleRect(this.x,this.bodyY,width,this.bodyHeight);
    s.scribbleFilling(this.bodyXs, this.bodyYs, 5,30);

    stroke(128,128,128);
    for(var i = 0; i < this.numOfFence; i++){
      let x = map(i,0,this.numOfFence-1,0,width) + 10;
      s.scribbleLine(x,this.fenceY + this.fenceHeight/2, x, this.fenceY - this.fenceHeight/2);
    }

    line(0,this.fenceY - this.fenceHeight/2, width, this.fenceY - this.fenceHeight/2);


  }

}

class Cloud {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.dir = generateRandomValue();
  }

  display() {
    noStroke();
    fill(255);
    s.scribbleEllipse(this.x, this.y, this.size, this.size);
    s.scribbleEllipse(this.x + this.size * 0.5, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.8);
    s.scribbleEllipse(this.x - this.size * 0.3, this.y - this.size * 0.2, this.size * 0.7, this.size * 0.7);
    s.scribbleEllipse(this.x + this.size * 0.3, this.y + this.size * 0.2, this.size * 0.7, this.size * 0.7);
    s.scribbleEllipse(this.x - this.size * 0.2, this.y + this.size * 0.2, this.size * 0.6, this.size * 0.6);
  }

  move(speed) {
    this.x += speed * this.dir;

  }

  edges(){
    if (this.x > width + this.size || this.x<-this.size) {
      print("out");
      return true;
    }
    return false;
  }
}

class VocalWave{
  constructor(amp = 0.3){
    this.trans = 0;
    this.amp = amp;
    this.v = 1;
    this.isMoving = false;
  }
  display(){
    push();
    translate(0,this.trans);
    beginShape();
    stroke(255);
    for(var i =0; i< wave.length;i+=2){
      var y = map(wave[i], -this.amp,this.amp,height/5*3, height);
      var x = map(i, 0, 1024-1, 0, width);
      vertex(x,y);
      xs.push(x);
      ys.push(y);
      curveVertex(x,y);
    }
    endShape();
    //s.scribbleFilling(xs,ys,5, 10);
    pop()
  }
  move(){
    this.isMoving = true;
  }
}


class Tomori {
  constructor(x, y, scale) {
    this.x = x;
    this.y = y;
    this.scale = scale;
  }

  display() {
    let headSize = 40 * this.scale;
    let bodyLength = 60 * this.scale;
    let legLength = 60 * this.scale;
    let armLength = 40 * this.scale;




    //head
    fill(255, 228, 196);
    ellipse(this.x, this.y - headSize * 0.5, headSize, headSize);
    //hair
    fill(128, 0, 128); // 紫色
    arc(this.x, this.y - headSize * 0.5, headSize, headSize, 180, 360);
    // body
    fill(0, 128, 0);
    stroke(0);
    line(this.x, this.y + headSize * 0.5, this.x, this.y + headSize * 0.5 + bodyLength);

    // left leg
    line(this.x, this.y + headSize * 0.5 + bodyLength, this.x - legLength * 0.3, this.y + headSize * 0.5 + bodyLength + legLength);

    // right leg
    line(this.x, this.y + headSize * 0.5 + bodyLength, this.x + legLength * 0.3, this.y + headSize * 0.5 + bodyLength + legLength);

    // left arm
    line(this.x, this.y + headSize * 0.5 + 10, this.x - armLength * 0.3, this.y + headSize * 0.5 + 10 + armLength);

    // right arm
    line(this.x, this.y + headSize * 0.5 + 10, this.x + armLength * 0.3, this.y + headSize * 0.5 + 10 + armLength);
  }
}