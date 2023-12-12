var song;
var fft;
var fft_vocal;
var particles = [];
var img;
var mic;

var s;

var xs = [];

var yx = [];

function probability(p){
  return p>random(100)
}

function preload() {
  print("loading");
  song = loadSound("mygo/mygo.flac");
  vocal = loadSound("mygo/vocals.wav");
  //img = loadImage("bg.jpg");
}

function setup() {
  print("loading complete");
  mic = new p5.AudioIn();
  mic.start();
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  imageMode(CENTER);
  rectMode(CENTER);
  vocal.setVolume(0);
  fft = new p5.FFT();
  fft_vocal = new p5.FFT();
  fft.setInput(song);
  fft_vocal.setInput(vocal);
  s = new Scribble();
  fft_mic = new p5.FFT();
  fft_mic.setInput(mic);
  //img.filter(BLUR, 12);
  //noLoop();
}

function draw() {
  //background(0);
  var wave = fft.waveform();
  xs = [];
  ys = [];
  noFill();

  //translate(width / 2, height / 2);
  
  fft.analyze();
  fft_vocal.analyze();
  var amp = fft_vocal.getEnergy("bass");
  
  /*push();
  if(amp>200){
    var angle = map(fft.getEnergy("highMid"),0,150,0,0.5);
    var sign = floor(random(0,2))-1;
    rotate(angle*sign);
  }
  //image(img,0,0,width+100,height+10);
  pop();*/

  var alpha = map(amp,0,255,100,150);
  fill(0,alpha);
  noStroke();
  rect(width/2,height/2,width,height);
 /* 
  noFill();
  stroke(255);
  strokeWeight(3);
  for (var t = -1; t <= 1; t += 2) {
    beginShape();
    for (var i = 0; i <= 180; i += 0.5) {
      var index = floor(map(i, 0, 360, 0, wave.length - 1));

      var r = map(wave[index], -1, 1, 150, 200);

      var x = r * sin(i) * t;
      var y = r * cos(i);
      vertex(x, y);
      xs.push(x);
      ys.push(y);
    }
    endShape();
  }
  s.scribbleFilling(xs,ys,20, 60);
  //s.scribbleFilling(xs,ys,40, -60);
  */
  if(song.isPlaying() && probability(10)){
    var p = new CherryBlossomPetal(random(width),0);
    particles.push(p);
  }

  for (var i = 0; i < particles.length; i++) {
    if(!particles[i].edges()){
      //particles[i].update(amp>200);
      particles[i].display(); 
      particles[i].move();

    }else{
      particles.splice(i,1);
    }

  }
}

function mouseClicked() {
  if (song.isPlaying()) {
    song.pause();
    vocal.pause();
  } else {
    song.play();
    vocal.play();
  }
}

class Particle {
  constructor() {
    this.pos = p5.Vector.random2D().mult(250);
    this.v = createVector(0, 0);
    this.acc = this.pos.copy().mult(random(0.0001, 0.00001));

    this.w = random(3, 5);
  }

  update(cond) {
    this.v.add(this.acc);
    this.pos.add(this.v);
    if(cond){
      this.pos.add(this.v);
      this.pos.add(this.v);
      this.pos.add(this.v);
    }
  }
  edges() {

    if (this.pos.x < -width / 2 || this.pos.x > width / 2 ||
      this.pos.y < -height / 2 || this.pos.y > height / 2) {
      return true;
    }else{
      return false;
    }

  }
  show() {
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, 4);
  }
}

class CherryBlossomPetal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
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
    this.y += random(1, 3); // 控制樱花瓣飘落的速度
    this.x += random(-1, 1); // 控制樱花瓣左右飘动
    // 如果樱花瓣离开画布底部，重新回到画布顶部
  }
  edges(){
    if(this.y < height + this.size){
      return false;
    }
    return true;
  }
}
