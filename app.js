import { 
  init,
  Sprite,
  GameLoop,
  initInput,
  initKeys,
  onInput,
  keyPressed,
  Pool,
  Vector
} from 'kontra';
import { ZZFX, zzfx } from 'zzfx';

const { canvas, context } = init();

const rnd = (x) => Math.floor(Math.random() * x);

context.imageSmoothingEnabled = false;

initInput();
initKeys();

const mainScreen = { width: 400, height: 400 };

let piper = Sprite({
  x: 240,
  y: 100,
  color: '#333',
  width: 40,
  height: 40,
  dx: 2,
  dy: 2,
  speed: 2,
  r: 20,
  flipX: 1,
  anim: 1,
  render: function(showSway = true) {
    const animOffset = Math.sin(this.anim * Math.PI);
    const c = this.context;
    /*
    c.fillStyle = this.color;
    c.fillRect(0, 0, this.width, this.height);
    */

    c.scale(this.flipX, 1);

    if (showSway) {
      c.fillStyle = '#8884';
      c.beginPath();
      c.arc(0, 0, this.r, 0, 2*Math.PI);
      c.fill();
    }

    c.strokeStyle = '#333';
    c.lineJoin = 'bevel';
    c.lineCap = 'round';
    c.lineWidth = 4;

    // Body
    const bodyAnim = animOffset * 2;
    c.beginPath();
    c.moveTo(-10, 0 + bodyAnim);
    c.lineTo(-10, 20 + bodyAnim);
    c.quadraticCurveTo(-10, 20 + bodyAnim, -5, 20 + bodyAnim);
    c.lineTo(15, 20 + bodyAnim);
    c.quadraticCurveTo(20, 20 + bodyAnim, 20, 15 + bodyAnim);
    c.lineTo(20, 5 + bodyAnim);
    c.quadraticCurveTo(20, 0 + bodyAnim, 15, 0 + bodyAnim);
    c.stroke();

    dot(c, 14, 7 + bodyAnim);

    dot(c, 14, 13 + bodyAnim);

    // Head
    const headAnim = animOffset * 4;
    c.beginPath();
    c.moveTo(-10, -12 + headAnim);
    c.lineTo(-10, -4 + headAnim);
    c.quadraticCurveTo(-10, headAnim, -6, headAnim);
    c.lineTo(6, headAnim);
    c.quadraticCurveTo(10, headAnim, 10, -4 + headAnim);
    c.lineTo(10, -8 + headAnim);
    c.quadraticCurveTo(10, -12 + headAnim, 6, -12 + headAnim);
    c.stroke();

    // Eye
    dot(c, 3, -7 + headAnim);

    // Hat
    c.beginPath();
    c.moveTo(-12, -13 + headAnim * 1.2);
    c.lineTo(17, -13 + headAnim * 1.2);
    c.lineTo(-10, -23 + headAnim * 1.2);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(-10, -13 + headAnim * 1.2);
    c.quadraticCurveTo(-15, -20 + headAnim, -20, -17 + headAnim * 2);
    c.stroke();

    c.strokeRect(-4 - headAnim, 20 + bodyAnim, 8, 7 - bodyAnim);
    c.strokeRect(4 + headAnim, 20 + bodyAnim, 8, 7 - bodyAnim);
  },
  update: function(dt, inControl = true) {
    this.x += this.dx;
    this.y += this.dy;
    this.flipX = this.dx > 0 ? 1 : -1;
    this.anim += Math.min(0.1, 0.04 * Vector(this.dx, this.dy).length());
    if (this.anim > 1) {
      this.anim -= 1;
    }

    if (inControl) {
      if (Math.random() > 0.8 && Math.random() * 100 < this.r) {
        addNoteParticle(this.x - this.flipX * 10, this.y);
      }

      if (this.x + this.width > mainScreen.width || this.x < 0) {
        this.randomDir()
        this.x += this.dx;
      }
      if (this.y + this.height > mainScreen.height || this.y < 0) {
        this.randomDir()
        this.y += this.dy;
      }
    }

  },
  randomDir: function() {
    let newVector = Vector(
      rnd(mainScreen.width / 4 * 3) + mainScreen.width / 8 - piper.x,
      rnd(mainScreen.height / 4 * 3) + mainScreen.height / 8 - piper.y
    );
    const freeRats = getLooseRats();
    if (freeRats.length > 0) {
      const pick = freeRats[rnd(freeRats.length)];
      newVector = Vector(pick.x - piper.x, pick.y - piper.y);
    }
    newVector = newVector.normalize().scale(this.speed);
    piper.dx = newVector.x;
    piper.dy = newVector.y;
  },
  inSway: function(s) {
    return inCircle(this.x, this.y, this.r - Math.min(s.width, s.height) / 2, s.x, s.y);
  }
});

const rndVector = () => {
  const randomAngle = Math.random() * Math.PI * 2;
  return Vector(Math.cos(randomAngle), Math.sin(randomAngle)).normalize();
};
const clamp = (min, mid, max) => Math.min(max, Math.max(min, mid));
const roundUp = (x) => x < 0 ? Math.floor(x) : Math.ceil(x);

const rats = Pool({
  create: Sprite
});
const getFollowRats = (following) => rats.getAliveObjects().filter((rat) => rat.follow === following);
const getLooseRats = () => rats.getAliveObjects().filter((rat) => !rat.follow);
const addRat = (x, y) => {
  const away = rndVector().scale(Math.max(mainScreen.width, mainScreen.height) * 1.2);
  rats.get({
    x: x || mainScreen.width / 2 + away.x,
    y: y || mainScreen.height / 2 + away.y,
    d: away.normalize().scale(-4),
    offScreen: true,
    color: '#333',
    width: 30,
    height: 30,
    follow: false,
    will: 1,
    anim: 0,
    flipX: 1,
    update: function() {
      this.x += this.d.x;
      this.y += this.d.y;
      this.flipX = clamp(-1, this.flipX + (this.d.x > 0 ? 0.1 : -0.1), 1);

      if (this.offScreen) {
        if (this.x > this.width && this.x < mainScreen.width - this.width && this.y > this.height && this.y < mainScreen.height - this.height) {
          this.offScreen = false;
          this.d = this.d.normalize();
        }
      } else {
        if (this.will <= 0.2 && this.follow) {
          let heading = Vector(this.follow.x - this.x, this.follow.y - this.y);
          let dist = heading.length();
          heading = heading.normalize();
          const others = getFollowRats(this.follow);
          let avgHeading = Vector(0, 0);
          for (let otherRat of others) {
            avgHeading = avgHeading.add(otherRat.d);
          }
          if (others.length > 0) {
            heading = heading.add(avgHeading.scale(1 / others.length).normalize().scale(0.5));
          }

          for (let otherRat of others) {
            const vectOther = Vector(this.x - otherRat.x, this.y - otherRat.y);
            if (vectOther.length() < 30) {
              heading = heading.add(vectOther.normalize());
            }
          }

          if (dist < 40) {
            heading = heading.scale(-0.8);
          }
          heading = heading.add(rndVector().scale(0.1));
          this.d.set(heading.normalize().scale(this.follow.speed));
        } else {
          if (this.x + this.width / 2 > mainScreen.width || this.x - this.width / 2 < 0) {
            this.x -= this.d.x;
            this.d.x *= -1;
          }
          if (this.y + this.height / 2 > mainScreen.height || this.y - this.width / 2 < 0) {
            this.y -= this.d.y;
            this.d.y *= -1;
          }
        }
      }

      this.anim += 0.07 * Math.abs(this.dx) / 1;
      if (this.anim > 1) {
        this.anim -= 1;
      }

      if (this.will > 0 && piper.inSway(this)) {
        this.will -= 0.1;

        if (this.will <= 0) {
          this.follow = piper;
        }
      }
    },
    render: function() {
      const c = this.context;
      c.fillStyle = this.color;
      const willAmount = Math.floor((this.height / 2) * (1 - this.will));
      c.fillStyle = '#3333';

      const animOffset = Math.sin(this.anim * Math.PI) * 2;
      const animOffset2 = Math.cos(this.anim * Math.PI) * 3;

      c.scale(roundUp(this.flipX), 1);

      // Draw tail
      c.beginPath();
      c.moveTo(-15, -5);
      c.bezierCurveTo(-25 - animOffset, -30 + animOffset2, -5 - animOffset, -15 + animOffset2, -5 - animOffset2, -25 + animOffset);
      c.stroke();

      // Draw feet
      c.strokeRect(-12 + animOffset, 0, 3, 3);
      c.strokeRect(-5 - animOffset, 0, 3, 3);
      c.strokeRect(2 + animOffset, 0, 3, 3);
      c.strokeRect(9 - animOffset, 0, 3, 3);

      // Draw body with clipping
      c.strokeStyle = '#333';
      c.lineJoin = 'bevel';
      c.lineCap = 'round';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(15, 0);
      c.lineTo(-10, 0);
      c.quadraticCurveTo(-15, 0, -15, -5 + animOffset);
      c.bezierCurveTo(-15, -20 + animOffset, 0, -20 + animOffset, 15, 0);
      c.closePath();
      c.stroke();
      c.clip();

      // Draw will amount
      c.fillRect(-this.width / 2, -willAmount + animOffset, this.width, willAmount - animOffset);

      // Draw eye
      dot(c, 5, -5 + animOffset / 2);
    }
  });
};

const noteParticles = Pool({ create: Sprite });
const addNoteParticle = (x, y) => {
  noteParticles.get({
    x, y,
    d: rndVector().scale(0.5),
    width: 6,
    height: 10,
    life: 4 + rnd(5),
    alive: true,
    update: function() {
      this.x += this.d.x;
      this.y += this.d.y;

      this.life -= 0.2;
      if (this.life < 0) {
        this.alive = false;
      }
    },
    render: function() {
      const c = this.context;

      const lifeAlpha = this.life > 1 ? 'f' : Math.floor(this.life * 10);
      c.strokeStyle = '#333' + lifeAlpha;
      c.fillStyle = '#333' + lifeAlpha;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, 2, 0, Math.PI * 2);
      c.moveTo(2, 0);
      c.lineTo(2, -8);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#fff';
    },
    isAlive: function() {
      return this.alive;
    }
  });
};

const line = (c, x1, y1, x2, y2) => {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.closePath();
}

const dot = (c, x, y) => {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y);
  c.stroke();
};

const renderPipes = (c, x, y) => {
  c.strokeStyle = '#333';
  c.lineWidth = 4;
  c.lineJoin = 'bevel';
  [20, 26, 32, 40].forEach((height, i) => c.strokeRect(x + i * 6, y, 6, height));
};

let musics = Sprite({
  x: 0,
  y: 400,
  width: canvas.width,
  height: 120,
  lanes: [
    26, 50, 74, 98
  ],
  render: function() {
    const c = this.context;
    c.strokeStyle = '#333';
    c.lineWidth = 4;
    c.lineJoin = 'bevel';
    line(c, 0, 0, this.width, 0);

    this.lanes.forEach((lane) => line(c, 50, lane, this.width, lane));

    renderPipes(c, 12, this.height / 2 - 20);

    //c.fillStyle = '#8884';
    //c.fillRect(50, 0, 30, this.height);

    c.fillStyle = '#333';
    if (keyPressed('arrowup')) {
      c.strokeStyle = '#888';
    } else {
      c.strokeStyle = '#333';
    }
    c.beginPath();
    c.moveTo(65, 26 - 8);
    c.lineTo(65 - 10, 26 + 8);
    c.lineTo(65 + 10, 26 + 8);
    c.lineTo(65, 26 - 8);
    c.closePath();
    c.fill();
    c.stroke();

    if (keyPressed('arrowleft')) {
      c.strokeStyle = '#888';
    } else {
      c.strokeStyle = '#333';
    }
    c.beginPath();
    c.moveTo(65 - 8, 50);
    c.lineTo(65 + 8, 50 + 10);
    c.lineTo(65 + 8, 50 - 10);
    c.lineTo(65 - 8, 50);
    c.closePath();
    c.fill();
    c.stroke();

    if (keyPressed('arrowright')) {
      c.strokeStyle = '#888';
    } else {
      c.strokeStyle = '#333';
    }
    c.beginPath();
    c.moveTo(65 + 8, 74);
    c.lineTo(65 - 8, 74 + 10);
    c.lineTo(65 - 8, 74 - 10);
    c.lineTo(65 + 8, 74);
    c.closePath();
    c.fill();
    c.stroke();
    c.stroke();

    if (keyPressed('arrowdown')) {
      c.strokeStyle = '#888';
    } else {
      c.strokeStyle = '#333';
    }
    c.beginPath();
    c.moveTo(65, 98 + 8);
    c.lineTo(65 - 10, 98 - 8);
    c.lineTo(65 + 10, 98 - 8);
    c.lineTo(65, 98 + 8);
    c.closePath();
    c.fill();
    c.stroke();
  }
});

let musicChecker = Sprite({
  x: 50,
  y: 400,
  width: 30,
  height: 120,
  color: '#8884'
});


let notes = Pool({
  create: Sprite
});

let canNote = true;
const newNote = (noteType) => {
  if (noteType === undefined) {
    return;
  }
  return notes.get({
    noteType: noteType,
    x: canvas.width + 67,
    y: canvas.height - musics.height + musics.lanes[noteType],
    width: 20,
    height: 20,
    color: '#333',
    dx: -2,
    alive: true,
    update: function() {
      this.x += this.dx;
      if (this.x < musicChecker.x) {
        this.alive = false;
        decrease(10);
        rats.getAliveObjects().filter((rat) => rat.following).forEach((rat) => rat.will += 0.2);
        zzfx(...inst(s[this.noteType] - 20));
        checkSongEnd();
      }
    },
    render: function() {
      const c = this.context;
      c.strokeStyle = '#333';
      c.fillStyle = '#333';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, 6, 0, Math.PI * 2);
      c.moveTo(6, 0);
      c.lineTo(6, -20);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#fff';
    },
    isAlive: function() {
      return this.alive;
    }
  });
};

const inst = (freq) => [3,0,freq,.05,.1,,1,,,,,,,.1,,,.09,.5,.22];
// C, D#, G, C
const defaultNotes = [261.63, 311.13, 392, 523.25];
const thud = (vol) => [vol || 0.6,0,65.40639,,.01,.07,,3,,,,,,.2,,.5,,1.3,.01];

const levels = [
  {
    introText: ['','','Here is an easy', 'song to start you off.','','Good luck!'],
    outroText: [
      ['Oh hero,','the streets are cleaner!','Everyone is happy!'], 
      ['Well, you cleared','some rats, at least.'], 
      ['Are you sure','you are blowing into','the right end of the pipes?']
    ],
    rats: 5,
    song: {
      time: 3,
      speed: 1,
      notes: [
        0,,1,,2,,3,,2,,1,,0,,0,1,0,,0,,0,,0,1,0,,0,,0
      ]
    }
  },
  {
    introText: ['','','Here is an easy', 'song to start you off.','','Good luck!'],
    outroText: [
      ['Oh hero,','the streets are cleaner!','Everyone is happy!'], 
      ['Well, you cleared','some rats, at least.'], 
      ['Are you sure','you are blowing into','the right end of the pipes?']
    ],
    rats: 5,
    song: {
      time: 3,
      speed: 1,
      notes: [
        0,,1,,2,,3,,2,,1,,0,,0,1,0,,0,,0,,0,1,0,,0,,0
      ]
    }
  },
  {
    introText: ['','','Here is an easy', 'song to start you off.','','Good luck!'],
    outroText: [
      ['Oh hero,','the streets are cleaner!','Everyone is happy!'], 
      ['Well, you cleared','some rats, at least.'], 
      ['Are you sure','you are blowing into','the right end of the pipes?']
    ],
    rats: 5,
    song: {
      time: 3,
      speed: 1,
      notes: [
        0,,1,,2,,3,,2,,1,,0,,0,1,0,,0,,0,,0,1,0,,0,,0
      ]
    }
  },
  {
    introText: ['','','Here is an easy', 'song to start you off.','','Good luck!'],
    outroText: [
      ['Oh hero,','the streets are cleaner!','Everyone is happy!'], 
      ['Well, you cleared','some rats, at least.'], 
      ['Are you sure','you are blowing into','the right end of the pipes?']
    ],
    rats: 5,
    song: {
      time: 3,
      speed: 1,
      notes: [
        0,,1,,2,,3,,2,,1,,0,,0,1,0,,0,,0,,0,1,0,,0,,0
      ]
    }
  }
].map((song) => ({ freqs: defaultNotes, ...song }));

const startSong = (i) => gameData.song = {...levels[i].song};

const inMusicChecker = (x) => Math.abs((musicChecker.x + musicChecker.width / 2) - x);

const UPNOTE = 0;
const LEFTNOTE = 1;
const RIGHTNOTE = 2;
const DOWNNOTE = 3;

const checkNote = (type) => {
  const aliveNotes = notes.getAliveObjects();
  const notesIn = aliveNotes.filter((note) => note.noteType === type && inMusicChecker(note.x) < musicChecker.width / 2);
  const noteIn = notesIn.pop();
  if (noteIn) {
    const score = inMusicChecker(noteIn.x);
    noteIn.alive = false;
    return score;
  }
};

const increase = (amount = 5) => {
  piper.r = Math.min(piper.r + amount, 100);
  gameData.score += amount;
};
const decrease = (amount = 5) => {
  piper.r = Math.max(piper.r - amount, 20);
  gameData.score += amount;
};

const handleNoteCheck = (note) => (function(e) {
  if (gameData.scene === GAME_SCENE && gameData.state === GAME_STATE) {
    const score = checkNote(note);
    if (score !== undefined) {
      zzfx(...inst(defaultNotes[note]));
      addNoteParticle(gamePipeVec.x + 3 + note * 6, gamePipeVec.y + 24 + note * 7);
      increase(score);
      checkSongEnd();
    }
  } else {
    if (gameData.scene === GAME_SCENE && gameData.state === INTRO_STATE && gameData.introText) {
      addNoteParticle(textPipeVec.x + 3 + note * 6, textPipeVec.y + 24 + note * 7);
    } else if (gameData.scene === MENU_SCENE) {
      if (note === UPNOTE) {
        gameData.menuChoice--;
      } else if (note === DOWNNOTE) {
        gameData.menuChoice++;
      }
    }
    zzfx(...inst(defaultNotes[note]));
  }
});

onInput(['arrowup', 'w'], handleNoteCheck(UPNOTE));
onInput(['arrowleft', 'a'], handleNoteCheck(LEFTNOTE));
onInput(['arrowright', 'd'], handleNoteCheck(RIGHTNOTE));
onInput(['arrowdown', 's'], handleNoteCheck(DOWNNOTE));

// States for the Game Scene
const INTRO_STATE = 0;
const GAME_STATE = 1;
const OUTRO_STATE = 2;

// Scenes
const MENU_SCENE = 0;
const GAME_SCENE = 1;
const POST_GAME_SCENE = 2;

const gameData = {
  scene: GAME_SCENE,
  song: null,
  level: 0,
  state: INTRO_STATE,
  introText: true,
  intro: 80,
  outroText: false,
  outro: 80,
  score: 0,
  menuChoice: 0
};

const saveHighScore = () => {
  if (window.localStorage) {
    //const oldHighScores = window.localStorage.get
  }
};

const loadHighScore = () => {
  if (window.localStorage) {
  }
};

const checkSongEnd = () => {
  const aliveNotes = notes.getAliveObjects();
  if (aliveNotes.length > 0) {
    return false;
  }
  changeState(OUTRO_STATE);
};

const changeScene = (newScene) => {
  gameData.scene = newScene;
  noteParticles.clear();
  if (newScene === MENU_SCENE) {
    piper.x = 100;
    piper.y = 150;
    piper.r = 0;
    gameData.menuChoice = 0;
    addRat(330, 175);
    addRat(270, 175);
  } else if (newScene === GAME_SCENE) {
    gameData.level = gameData.menuChoice;
    rats.clear();
    changeState(INTRO_STATE);
  } else if (newScene === POST_GAME_SCENE) {
    rats.clear();
    notes.clear();
  }
};

const changeState = (newState) => {
  if (newState === INTRO_STATE) {
    gameData.introText = true;
    gameData.intro = 80;
    piper.x = -100;
    piper.y = mainScreen.height / 2;
    piper.dy = 0;
    piper.dx = 3;
  } else if (newState === GAME_STATE) {
    const newVector = rndVector().scale(piper.speed);
    piper.dx = newVector.x;
    piper.dy = newVector.y;
    gameData.song = levels[gameData.level].song;
    gameData.songPlace = 0;
    for (let i = 0; i < levels[gameData.level].rats; i++) {
      addRat();
    }
  } else if (newState === OUTRO_STATE) {
    gameData.outro = 80;
    gameData.outroText = false;
  }
  gameData.state = newState;
};

const textPipeVec = Vector(canvas.width / 2 - 20, canvas.height - 128);
const gamePipeVec = Vector(12, canvas.height - 50);

let interval = 0;
let step = 0;

let loop = GameLoop({
  update: function(dt) {
    if (gameData.scene === MENU_SCENE) {
      if (gameData.menuChoice < 0) {
        gameData.menuChoice += levels.length;
      } else if (gameData.menuChoice > levels.length - 1) {
        gameData.menuChoice -= levels.length;
      }
      if (keyPressed(['space', 'enter', 'z'])) {
        changeScene(GAME_STATE);
      }
      piper.anim += 0.1;
      rats.getAliveObjects().forEach((rat) => {
        rat.anim += 0.05 + Math.random() * 0.1;
        rat.will = 1;
      });
    } else if (gameData.scene === GAME_SCENE) {
      if (gameData.state === INTRO_STATE) {
        if (gameData.introText) {
          if (keyPressed(['space', 'enter', 'z'])) {
            gameData.introText = false;
            console.log(piper.x, piper.y, piper.dx, piper.dy);
          }
        } else {
          piper.update(dt, false);
          if (piper.x >= mainScreen.width / 2) {
            changeState(GAME_STATE);
          }
        }
      } else if (gameData.state === GAME_STATE) {
        piper.update();
        rats.update();
        notes.update();

        if (keyPressed('t')) {
          piper.r = Math.min(piper.r + 1, 100);
        }
        if (keyPressed('g')) {
          piper.r = Math.max(piper.r - 1, 20);
        }

        if (gameData.song || notes.getAliveObjects().length > 0) {
          if (interval <= 0) {
            interval = 0.25;
            step++;
            if (step === 2) {
              if (gameData.song) {
                gameData.songPlace++;
                newNote(gameData.song.notes[gameData.songPlace]);
              }
              zzfx(...thud(0.6));
            } else if (step === 4) {
              if (gameData.song) {
                gameData.songPlace++;
                newNote(gameData.song.notes[gameData.songPlace]);
              }
              zzfx(...thud(1.2));
              step = 0;
            } else {
              zzfx(...thud(0.6));
            }
          } else {
            interval -= dt;
          }
        }
      } else if (gameData.state === OUTRO_STATE) {
        piper.update(dt, false);
        if (piper.x >= mainScreen.width + mainScreen.width / 2) {
          changeScene(POST_GAME_SCENE);
        }
      }
    } else if (gameData.scene === POST_GAME_SCENE) {
      if (keyPressed(['space', 'enter', 'z'])) {
        changeScene(MENU_SCENE);
      }
    }
    noteParticles.update();
  },

  render: function() {
    const c = this.context;
    c.fillStyle = '#333';
    if (gameData.scene === MENU_SCENE) {
      c.font = 'bold 32px sans-serif';
      centerText(c, 'Pied Pipe', 48);
      c.font = 'bold 36px sans-serif';
      c.save();
      c.translate(10, 0);
      c.rotate(0.1);
      centerText(c, 'Revolution', 65);
      c.restore();
      c.font = 'bold 28px sans-serif';
      levels.forEach((level, i) => {
        const text = 'Level ' + (i + 1);
        centerText(c, gameData.menuChoice === i ? `> ${text} <` : text, 200 + (i + 1) * 32);
      });
      renderPipes(c, textPipeVec.x, textPipeVec.y);
      c.font = 'bold 24px sans-serif';
      centerText(c, 'Space/Enter to choose level', canvas.height - 20);
      centerText(c, 'Arrow keys to play pipes', canvas.height - 52);
      piper.render();
      rats.render();
    } else if (gameData.scene === GAME_SCENE) {
      if (gameData.state === INTRO_STATE) {
        if (gameData.introText) {
          c.font = 'bold 28px sans-serif';
          levels[gameData.level].introText.forEach((text, i) => centerText(c, text, (i + 1) * 32));
          renderPipes(c, textPipeVec.x, textPipeVec.y);
          centerText(c, 'Press [space] to start', canvas.height - 32);
        } else {
          rats.render();
          piper.render();
        }
      } else if (gameData.state === GAME_STATE) {
        rats.render();
        piper.render();
        musicChecker.render();
        musics.render();
        notes.render();
      } else if (gameData.state === OUTRO_STATE) {
        rats.render();
        piper.render();
      }
    } else if (gameData.scene === POST_GAME_SCENE) {
    }
    noteParticles.render();
  }
});

const centerText = (c, text, y) => {
  const { width } = c.measureText(text);
  c.fillText(text, canvas.width / 2 - width / 2, y);
};

//changeState(INTRO_STATE, 0);
changeScene(MENU_SCENE);
loop.start();

function inCircle(x, y, r, px, py) {
  return Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2)) < r;
}

function circleCollide(x1, y1, r1, x2, y2, r2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) < r1 + r2;
}
