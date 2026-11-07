const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function game(){
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
 const element=()=>({className:'',innerHTML:'',hidden:false,width:960,height:540,style:{},classList:{add(){},remove(){}},getContext:()=>ctx,getBoundingClientRect:()=>({width:960}),appendChild(){},insertBefore(){},setAttribute(){},addEventListener(){}});
 const elements=new Map();
 const c=vm.createContext({console,Math,Number,String,Image:class {},window:{devicePixelRatio:1,addEventListener(){}},document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},requestAnimationFrame(){},setInterval(){}});
 for(const file of ['adventure.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c,{filename:file});
 return code=>vm.runInContext(code,c);
}

test('every level renders and the exit requires both collection and its mission',()=>{
 const run=game();
 for(let n=0;n<5;n++){
  run(`level=${n};makeLevel(level);phase='play';characterArtReady=true;count=LEVELS[level].goal;render()`);
  assert.equal(run('exitReady()'),n===2);
 }
});

test('letter discovery opens level one only after collection',()=>{
 const run=game();run("level=0;makeLevel(0);player.x=416;player.y=182;updateAdventure(16)");
 assert.equal(run('adventure.letter'),true);
 assert.equal(run('exitReady()'),false);
 run('count=LEVELS[0].goal');assert.equal(run('exitReady()'),true);
});

test('both crystals activate the bridge and unlock the mission',()=>{
 const run=game();run('level=1;makeLevel(1);player.x=191;player.y=GROUND-71;updateAdventure(16)');
 assert.equal(run('missionDone()'),false);
 run('player.x=391;player.y=197;updateAdventure(16)');
 assert.equal(run('missionDone()'),true);
 run('count=LEVELS[1].goal');assert.equal(run('exitReady()'),true);
});

test('fragile platforms disappear, stop supporting the player, and regenerate',()=>{
 const run=game();run("level=2;makeLevel(2);phase='play';characterArtReady=true;player.x=150;player.y=platforms[1].y-90;player.on=true");
 for(let i=0;i<54;i++)run('updateAdventure(16)');
 assert.ok(run('platforms[1].gone>0'));
 run('player.on=false;update(16)');assert.equal(run('player.on'),false);
 run('updateAdventure(2200)');assert.equal(run('platforms[1].gone'),0);
 assert.equal(run('platforms[1].crumble'),0);
});

test('travelling star requires three catches and final level requires three memories',()=>{
 const run=game();run('level=3;makeLevel(3)');
 for(let i=0;i<3;i++)run('updateAdventure(0);player.x=adventure.star.x-14;player.y=adventure.star.y-48;updateAdventure(0)');
 assert.equal(run('adventure.chases'),3);assert.equal(run('missionDone()'),true);
 run('level=4;makeLevel(4)');assert.equal(run('missionDone()'),false);
 for(let i=0;i<3;i++)run(`player.x=adventure.memories[${i}].x-14;player.y=adventure.memories[${i}].y-48;updateAdventure(16)`);
 assert.equal(run('missionDone()'),true);
});

test('checkpoint retry preserves collected objects and mission progress',()=>{
 const run=game();run("level=0;makeLevel(0);phase='play';adventure.letter=true;count=3;items[0].got=true;player.x=490;player.y=GROUND-90;player.on=true;updateAdventure(16)");
 assert.equal(run('adventure.checkpoint.active'),true);
 run('lives=1;damage(false)');assert.equal(run('phase'),'dead');
 run('resumeCheckpoint()');assert.equal(run('player.x'),490);assert.equal(run('lives'),3);
 assert.equal(run('count'),3);assert.equal(run('items[0].got'),true);assert.equal(run('adventure.letter'),true);
});

test('locked exits cannot skip missions, and completed final mission leads to the reunion',()=>{
 const run=game();
 for(let n=0;n<5;n++){
  run(`level=${n};makeLevel(level);phase='play';count=LEVELS[level].goal`);
  if(n===2)continue;
  run('complete()');assert.equal(run('phase'),'play');
 }
 run('adventure.memories.forEach(m=>m.got=true);complete()');
 assert.equal(run('phase'),'reunion');
 assert.ok(run("LETTER.includes('ya casi 4 meses')"));
});

test('lagoon bridge has collision only after both crystals activate',()=>{
 const run=game();
 run("level=1;makeLevel(1);phase='play';characterArtReady=true;player.x=670;player.y=260;player.vy=1;player.on=false;update(16)");
 assert.equal(run('player.on'),false);
 run('adventure.switches.forEach(s=>s.on=true);player.x=670;player.y=260;player.vy=1;update(16)');
 assert.equal(run('player.on'),true);
 assert.equal(run('player.y+player.h'),350);
});

test('all required platforms are within the jump envelope',()=>{
 const run=game();
 for(let n=0;n<5;n++){
  run(`level=${n};makeLevel(level)`);
  // Maximum height ~122 px with this discrete gravity. Include the highest
  // position of each moving platform and allow walking to its near edge.
  const platforms=JSON.parse(run('JSON.stringify(platforms.filter(p=>!p.bridge))'));
  let reachable=[platforms[0]],remaining=platforms.slice(1);
  while(remaining.length){
   const next=remaining.find(p=>reachable.some(q=>q.y-(q.travel||0)-(p.y-(p.travel||0))<122&&Math.max(p.x-(q.x+q.w),q.x-(p.x+p.w),0)<130));
   assert.ok(next,`unreachable platform in level ${n+1}`);
   reachable.push(next);remaining=remaining.filter(p=>p!==next);
  }
 }
});
