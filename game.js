'use strict';
const LEVELS=[
 {name:'El destino nos encontró',goal:6,kind:'hearts',intro:'A veces, las historias más bonitas empiezan sin avisar.',end:'Quién diría que una simple coincidencia podría convertirse en algo tan bonito... ♡'},
 {name:'Empezaste a ser especial',goal:7,kind:'stars',intro:'Algunas personas iluminan nuestros días sin darse cuenta.',end:'Sin darme cuenta, hablar contigo se volvió una de mis partes favoritas del día. ♡'},
 {name:'Tres meses, miles de sentimientos',goal:9,kind:'hearts',intro:'Tres pequeños caminos. Tres meses que significan muchísimo.',end:'Tres meses fueron suficientes para darme cuenta de que quiero muchos más contigo. ♡'},
 {name:'Todo lo que provocas en mí',goal:9,kind:'stars',intro:'Cada estrella guarda una razón para sonreír.',end:'Hay tantas cosas en ti que hacen mi mundo mucho más bonito... ♡'},
 {name:'Tengo algo que decirte...',goal:10,kind:'hearts',intro:'Hay alguien esperándote al final de este jardín.',end:'Llegaste al final de la aventura... pero quizá sea el comienzo de algo mucho más bonito.'}
];
const LETTER=`Mi amor, Michel: ♡\n\n¿Quién diría que hace ya casi 4 meses llegaste a mi vida sin imaginar todo lo que ibas a provocar en mí?\n\nNo sé en qué momento tus mensajes comenzaron a alegrarme tanto los días, ni cuándo tu sonrisa se volvió una de mis cosas favoritas. Solo sé que, entre tantas personas, tuve la suerte de encontrarte a ti.\n\nHoy quiero que sea nuestro último día siendo ligues, nuestro último día siendo un «casi algo». No porque quiera alejarme, sino porque quiero estar mucho más cerca de ti.\n\nQuiero elegirte, cuidarte, respetarte, compartir aventuras, acompañarte en los días bonitos y también en los difíciles. No te prometo días perfectos, pero sí intenciones sinceras.\n\nSi este pequeño juego te trajo hasta aquí, es porque de todas las historias que podría vivir, la que más ilusión me hace comenzar es una contigo.\n\nCon todo mi cariño,\nAlexis ❤️`;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),panel=document.querySelector('#panel');
const W=960,H=540,GROUND=458;let level=0,world=0,items=[],platforms=[],hazards=[],player={x:55,y:300,vx:0,vy:0,w:28,h:90,on:false,inv:0},count=0,lives=3,camera=0,phase='menu',time=0,particles=[],musicOn=false,audio=null,last=0;
function resizeCanvas(){
 const displayedWidth=canvas.getBoundingClientRect().width||W;
 const resolution=Math.min(3,Math.max(2,displayedWidth/W*(window.devicePixelRatio||1)));
 const nextWidth=Math.round(W*resolution),nextHeight=Math.round(H*resolution);
 if(canvas.width!==nextWidth||canvas.height!==nextHeight){canvas.width=nextWidth;canvas.height=nextHeight;ctx.setTransform(nextWidth/W,0,0,nextHeight/H,0,0)}
}
window.addEventListener('resize',resizeCanvas);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeCanvas).observe(canvas);
const motion={cycle:0,run:0,facing:1,land:0};
function animateMotion(dt){const k=1-Math.exp(-dt/95);const speed=phase==='play'&&player.on?Math.abs(player.vx)/4.4:0;motion.run+=(speed-motion.run)*k;motion.cycle+=Math.abs(player.vx)*dt*.0028;if(Math.abs(player.vx)>.2)motion.facing+=(Math.sign(player.vx)-motion.facing)*(1-Math.exp(-dt/110));motion.land*=Math.exp(-dt/90)}
const keys={left:false,right:false,jump:false};let prevJump=false;
const saved=Number(localStorage.getItem('michel_level')||0);level=Math.max(0,Math.min(4,saved));
function rand(seed){let v=Math.sin(seed*93.71+14.3)*43758.5453;return v-Math.floor(v)}
function show(html){panel.innerHTML=html;overlay.classList.remove('hidden')}
function hide(){overlay.classList.add('hidden')}
function btn(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;panel.appendChild(b);return b}
function menu(){phase='menu';show(`<h1>♡ Michel ♡</h1><h2>Una aventura escrita por el destino</h2><p>Un mundo mágico, cinco niveles y una historia por descubrir.</p><p class="sub">Explora, activa cristales, cruza plataformas de cristal y persigue una estrella. Cinco retos para llegar a nuestro encuentro.</p><p class="small">Controles: A/D o ←/→, espacio para saltar, E para interactuar. En celular usa los controles en pantalla.</p>`);btn(level?'Continuar aventura ♡':'Comenzar aventura ♡',()=>start(level));if(level)btn('Empezar desde el nivel 1',()=>{level=0;start(0)})}
// Cada nivel ocupa una pantalla; no hay desplazamiento de cámara.
const THEMES=[
 {place:'Jardín de las coincidencias',sky:['#24396d','#efa6a3'],hill:'#655c91',leaf:'#ed98bc',soil:'#544366',grass:'#d4a9c7'},
 {place:'Laguna de las estrellas',sky:['#0b214b','#377e9d'],hill:'#225778',leaf:'#76c7c2',soil:'#28485d',grass:'#95ddd3'},
 {place:'Bosque de los recuerdos',sky:['#593564','#f3b986'],hill:'#986a87',leaf:'#ecaa73',soil:'#73505d',grass:'#f4ca95'},
 {place:'Cielo de los deseos',sky:['#171c52','#7866ae'],hill:'#514c89',leaf:'#bba2ed',soil:'#51466f',grass:'#c8b6f2'},
 {place:'Nuestro jardín',sky:['#452047','#d789a6'],hill:'#784b79',leaf:'#f5a4c7',soil:'#67425e',grass:'#ffd0db'}
];
function makeLevel(n){
 world=W;platforms=[{x:0,y:GROUND,w:W,h:120}];items=[];hazards=[];
 const layouts=[[[165,350],[365,285],[590,350]],[[150,350],[345,285],[565,205],[700,350]],[[125,350],[300,280],[490,350],[665,265]],[[140,350],[330,275],[535,185],[710,310]],[[125,350],[305,280],[510,350],[675,265]]];
 for(const [i,[x,originalY]] of layouts[n].entries()){const y=i===0?365:originalY;platforms.push({x,y,baseY:y,w:135,h:18,travel:10+n*3,offset:i*1.8})}
 const spots=[[115,GROUND-40],[325,GROUND-40],[540,GROUND-40],[755,GROUND-40]];
 for(const p of platforms.slice(1)){spots.push([p.x+35,p.y-28],[p.x+100,p.y-28])}
 for(let i=0;i<LEVELS[n].goal;i++){const [x,y]=spots[i];items.push({x,y,baseY:y,platform:i>=4?platforms[1+Math.floor((i-4)/2)]:null,got:false,kind:LEVELS[n].kind})}
 for(const x of [275,610,...(n>1?[440]:[])])hazards.push({x,y:GROUND-23,w:27,h:23});
 player={x:40,y:GROUND-90,vx:0,vy:0,w:28,h:90,on:false,inv:0};count=0;lives=3;camera=0;particles=[];effects=[];floaters=[];shake=0;squash=0;prevJump=false;keys.left=keys.right=keys.jump=false;arrival=900;motion.cycle=0;motion.run=0;motion.land=0;setupAdventure(n);
}
function start(n){level=n;makeLevel(n);phase='intro';show(`<h2>Nivel ${n+1}: ${LEVELS[n].name}</h2><p>${LEVELS[n].intro}</p><p class="small">${CHALLENGES[n]} Recolecta ${LEVELS[n].goal} ${LEVELS[n].kind==='hearts'?'corazones':'estrellas'} y vuelve al portal de la derecha. Evita las espinas: tienes tres corazones de vida.</p>`);btn('¡Vamos! ♡',()=>{phase='play';hide()})}
function complete(){if(!exitReady())return;if(level===4){localStorage.setItem('michel_level','4');beginReunion();return}burst(player.x+14,player.y,'#ffe2a2',65);phase='complete';localStorage.setItem('michel_level',String(Math.min(4,level+1)));show(`<h2>♡ ¡Nivel superado! ♡</h2><p>${LEVELS[level].end}</p><p class="small">${adventure.score+count*50} puntos · Secreto ${adventure.secret?'encontrado':'por descubrir'}</p>`);btn(level===4?'Continuar al encuentro ♡':'Siguiente nivel →',()=>{if(level===4)beginReunion();else start(level+1)})}
function finalScene(){phase='final';show(`<h1>Michel y Alexis</h1><p><em>Michel... hay algo que llevo guardando en mi coraz\u00f3n.</em></p>`);btn('Abrir la carta',letter)}
function letter(){phase='letter';show(`<h2>Una carta para Michel 💌</h2><div class="letter">${LETTER.replaceAll('&','&amp;').replaceAll('<','&lt;')}</div>`);btn('Continuar ♡',proposal)}
function proposal(){phase='proposal';show(`<h1>Michel... ♡</h1><p>Hoy quiero dejar de ser tu casi algo y comenzar una historia de verdad contigo.</p><h1>¿Quieres ser mi novia? ❤️</h1>`);btn('¡Sí, quiero! ♡',()=>{phase='yes';show('<h1>♡ ¡Nuestro comienzo! ♡</h1><p>Este no es el final del juego... es el inicio de nuestra historia. ❤️</p><p>Con muchísimo amor, Alexis.</p>');btn('Volver a ver la carta',letter);for(let i=0;i<110;i++)particles.push({x:rand(i)*W,y:rand(i+200)*H,vy:0.8+rand(i+70)*2,s:3+rand(i+40)*5})});btn('Abrázame primero 🥹',()=>{phase='hug';show('<h1>♡ Un abrazo para ti ♡</h1><p>Ven, quiero abrazarte. No hay prisa. ❤️</p>');btn('Volver a la pregunta',proposal)})}
function drawHeart(x,y,s,color='#ff5b9d'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y+s*.8);ctx.bezierCurveTo(x-s*1.4,y,x-s*.8,y-s*.9,x,y-s*.25);ctx.bezierCurveTo(x+s*.8,y-s*.9,x+s*1.4,y,x,y+s*.8);ctx.fill()}
function drawStar(x,y,r){ctx.fillStyle='#ffe4a3';ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill()}
// Atlas ilustrado: 8 poses por personaje, misma escala y linea de apoyo.
const characterArt=new Image();let characterArtReady=false;
characterArt.onload=()=>{characterArtReady=true};
characterArt.src='assets/personajes-vestido-marino.png';
const CHARACTER_HEIGHT=100;
const CHARACTER_ROWS=[{height:449,baseline:496},{height:465,baseline:481}];
// Coordenadas del lunar en cada pose, dentro de su celda de 192 x 512.
// Michel: punto pequeño inmediatamente bajo el párpado, sin bajar a la mejilla.
const CHARACTER_MARKS=[
 [[130,94],[130,94],[130,94],[130,94],[130,94],[131,90],[131,62],[131,99]],
 [[136,80],[136,80],[136,80],[136,80],[136,80],[136,78],[136,52],[136,84]]
];
function beautyMark(target,x,y,radius){target.save();target.fillStyle='#27191e';target.beginPath();target.arc(x,y,radius,0,Math.PI*2);target.fill();target.restore()}
// La mano y el ramo forman parte de la misma pose ilustrada.
const waitingAlexisArt=new Image();let waitingAlexisReady=false;
waitingAlexisArt.onload=()=>{waitingAlexisReady=true};
waitingAlexisArt.src='assets/alexis-espera-marino.png';
const ALEXIS_WAIT_FRAME={x:264,y:10,w:476,h:1510,mark:[430,198]};
function drawWaitingAlexis(x,feet){
 if(!waitingAlexisReady)return;
 const f=ALEXIS_WAIT_FRAME,scale=CHARACTER_HEIGHT/f.h,width=f.w*scale;
 const breathe=Math.sin(time*.0025+1)*.15;
 ctx.save();ctx.translate(x,feet);ctx.fillStyle='#20152e33';ctx.beginPath();ctx.ellipse(0,0,12,2.5,0,0,Math.PI*2);ctx.fill();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(waitingAlexisArt,f.x,f.y,f.w,f.h,-width/2,-CHARACTER_HEIGHT+breathe,width,CHARACTER_HEIGHT);
 beautyMark(ctx,-width/2+(f.mark[0]-f.x)*scale,-CHARACTER_HEIGHT+(f.mark[1]-f.y)*scale+breathe,.4);
 ctx.restore()
}
function characterFrame(who){
 if(who!=='michel'||phase!=='play')return 0;
 if(!player.on)return player.vy<-3?5:player.vy<3?6:7;
 if(Math.abs(player.vx)<.35)return 0;
 return 1+Math.floor(motion.cycle/(Math.PI*.5))%4
}
function drawCharacter(x,feet,who='michel'){
 if(who==='alexis'){drawWaitingAlexis(x,feet);return}
 if(!characterArtReady)return;
 const row=who==='michel'?0:1,frame=characterFrame(who);
 const cw=characterArt.naturalWidth/8,ch=characterArt.naturalHeight/2;
 const metrics=CHARACTER_ROWS[row];
 const height=CHARACTER_HEIGHT*512/metrics.height,width=height*cw/ch;
 const direction=who==='michel'?(motion.facing<0?-1:1):-1;
 ctx.save();ctx.translate(x,feet);
 ctx.fillStyle='#20152e33';ctx.beginPath();ctx.ellipse(0,0,12,2.5,0,0,Math.PI*2);ctx.fill();
 ctx.scale(direction,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // El cuerpo acompaña cada paso, el impulso y el aterrizaje.
 const stride=Math.sin(motion.cycle*2)*motion.run;
 ctx.translate(0,-Math.abs(stride)*2.8);
 ctx.rotate((player.on?stride*.018:Math.max(-.06,Math.min(.06,player.vx*.012))));
 ctx.scale(1-squash*.35+motion.land*.055,1+squash*.45-motion.land*.07);
 // La respiracion es leve; el movimiento principal viene de las poses dibujadas.
 const breathe=frame===0?Math.sin(time*.003+row)*1.2:0;
 ctx.drawImage(characterArt,frame*cw+1,row*ch+1,cw-2,ch-2,-width/2,-height*metrics.baseline/512+breathe,width,height);
 const [mx,my]=CHARACTER_MARKS[row][frame];
 beautyMark(ctx,(mx/192-.5)*width,(my-metrics.baseline)*height/512+breathe,row===0?.55:.4);
 ctx.restore()
}
function drawAlexisName(x,feet){
 const y=feet-CHARACTER_HEIGHT-22;
 ctx.save();ctx.fillStyle='#2d203ed9';ctx.beginPath();ctx.roundRect(x-34,y-17,68,25,9);ctx.fill();ctx.fillStyle='#fff0e4';ctx.font='bold 14px Trebuchet MS';ctx.textAlign='center';ctx.fillText('Alexis',x,y);ctx.restore()
}
function animatePlatforms(){
 for(const p of platforms){
  if(p.baseY===undefined||p.gone>0)continue;
  const previous=p.y;
  p.y=p.baseY+Math.sin(time*.0015+p.offset)*p.travel;
  if(player.on&&Math.abs(player.y+player.h-previous)<1&&player.x+player.w>p.x+3&&player.x<p.x+p.w-3)player.y+=p.y-previous;
 }
 for(const it of items)if(it.platform)it.y=it.baseY+it.platform.y-it.platform.baseY;
}
function drawButterflies(){
 ctx.save();
 for(let i=0;i<7;i++){
  const x=((time*(.022+i*.003)+i*153)%(W+100))-50;
  const y=235+Math.sin(time*.0018+i*2)*55+(i%3)*48;
  const wing=2+Math.abs(Math.sin(time*.021+i))*8;
  ctx.fillStyle=['#ffc0de','#ffe3a7','#c9b4ff'][i%3];ctx.globalAlpha=.85;
  ctx.beginPath();ctx.ellipse(x-wing*.5,y,wing,4,-.55,0,Math.PI*2);ctx.ellipse(x+wing*.5,y,wing,4,.55,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function scenery(){
 const t=THEMES[level];ctx.save();const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,t.sky[0]);sky.addColorStop(1,t.sky[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const halo=ctx.createRadialGradient(766,115,10,766,115,140);halo.addColorStop(0,'#ffe9cc88');halo.addColorStop(1,'#ffe9cc00');ctx.fillStyle=halo;ctx.fillRect(620,0,300,280);
 ctx.fillStyle='#ffe6cd';ctx.beginPath();ctx.arc(766,115,35,0,7);ctx.fill();
 for(let i=0;i<45;i++){ctx.globalAlpha=.2+(Math.sin(time*.003+i)+1)*.3;drawStar(rand(i+20)*W,65+rand(i+80)*200,1+rand(i)*2)}ctx.globalAlpha=1;
 // Nubes grandes recorren el cielo incluso cuando el personaje está quieto.
 for(let i=0;i<6;i++){const x=((i*210+time*(.009+i*.002))%(W+300))-150,y=95+(i%3)*47;ctx.fillStyle='#ffedf51c';for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+j*30,y-Math.sin(j)*12,45,20,0,0,7);ctx.fill()}}
 for(let layer=0;layer<3;layer++){ctx.globalAlpha=.25+layer*.15;ctx.fillStyle=t.hill;ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+20;x+=20)ctx.lineTo(x,300+layer*39+Math.sin(x*.006+layer*2)*35+Math.sin(x*.013)*12);ctx.lineTo(W,H);ctx.fill()}ctx.globalAlpha=1;
 // Une laguna con ondas en movimiento cruza el fondo.
 ctx.fillStyle=level===1?'#70d6d04a':'#eec9ee22';ctx.beginPath();ctx.ellipse(490,415,530,64,0,0,7);ctx.fill();
 for(let i=0;i<18;i++){let x=rand(i+5)*W,y=378+i*4;ctx.strokeStyle='#fff0e8';ctx.globalAlpha=.08+Math.sin(time*.002+i)*.05;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.sin(time*.001+i)*12,y);ctx.lineTo(x+35+Math.sin(time*.001+i)*12,y);ctx.stroke()}ctx.globalAlpha=1;
 for(const [x,y,size] of [[45,385,1.25],[910,370,1.35],[480,378,.68]]){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle='#55435e';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(0,70);ctx.quadraticCurveTo(-9,-35,8,-88);ctx.stroke();ctx.translate(Math.sin(time*.0016+x)*7,0);ctx.fillStyle=t.leaf;for(let j=0;j<16;j++){let a=j*2.4,r=20+rand(j+x)*46;ctx.globalAlpha=.65+rand(j)*.3;ctx.beginPath();ctx.ellipse(Math.cos(a)*r,-88+Math.sin(a)*r*.65,27,22,a*.2,0,7);ctx.fill()}ctx.restore()}
 if(level===3){for(let i=0;i<3;i++){let x=((time*.12+i*370)%(W+350))-150,y=90+i*48;ctx.globalAlpha=.5;ctx.strokeStyle='#ffe8bc';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-70,y-20);ctx.stroke();drawStar(x,y,3)}}
 if(level===4){ctx.globalAlpha=.85;ctx.strokeStyle='#ffe6c3';ctx.beginPath();ctx.moveTo(0,130);ctx.quadraticCurveTo(480,240,960,130);ctx.stroke();for(let i=0;i<13;i++){let x=i*80,y=130+110*(1-Math.pow((x-480)/480,2))*.5;ctx.shadowColor='#ffcf8f';ctx.shadowBlur=15;ctx.fillStyle='#ffe8ac';ctx.beginPath();ctx.arc(x,y,4+Math.sin(time*.003+i),0,7);ctx.fill()}}
 ctx.restore()
}
function drawPlatform(p){if(p.gone>0||(p.bridge&&!adventure.switches.every(s=>s.on)))return;const t=THEMES[level];ctx.save();if(p.fragile){ctx.globalAlpha=1-p.crumble/1100;ctx.translate(Math.sin(time*.07)*p.crumble/400,0)}const g=ctx.createLinearGradient(0,p.y,0,p.y+p.h);g.addColorStop(0,p.fragile?'#8bc6e3':t.soil);g.addColorStop(1,'#30233e');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,p.h,p.y===GROUND?0:9);ctx.fill();ctx.fillStyle=t.grass;ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,6,3);ctx.fill();if(p.y!==GROUND){for(let i=0;i<5;i++){const x=p.x+12+i*27;ctx.strokeStyle=t.leaf;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,p.y+15);ctx.quadraticCurveTo(x+Math.sin(time*.003+i)*6,p.y+33,x-3,p.y+39);ctx.stroke();ctx.fillStyle=t.leaf;ctx.beginPath();ctx.ellipse(x-1,p.y+28,5,2,-.5,0,7);ctx.fill()}}ctx.restore()}
function render(){if(phase==='reunion'){renderReunion();return}ctx.clearRect(0,0,W,H);scenery();ambient();ctx.save();ctx.translate(-camera,0);if(shake>0)ctx.translate(Math.sin(time*.09)*shake,Math.cos(time*.12)*shake*.5);for(const p of platforms)drawPlatform(p);garden();drawAdventure();for(const h of hazards){ctx.fillStyle='#ef6999';ctx.beginPath();ctx.moveTo(h.x,GROUND);ctx.lineTo(h.x+h.w/2,GROUND-h.h);ctx.lineTo(h.x+h.w,GROUND);ctx.fill()}for(const it of items)if(!it.got){let yy=it.y+Math.sin(time*.004+it.x)*5;ctx.save();ctx.shadowColor=it.kind==='hearts'?'#ff7dc9':'#ffe6a0';ctx.shadowBlur=18+Math.sin(time*.006+it.x)*7;if(it.kind==='hearts')drawHeart(it.x,yy,12);else drawStar(it.x,yy,14);ctx.restore()}const gate=world-105;ctx.fillStyle=exitReady()?'#f5a2e7':'#71627b';ctx.fillRect(gate,GROUND-105,12,105);ctx.fillRect(gate+58,GROUND-105,12,105);ctx.fillRect(gate,GROUND-105,70,12);ctx.fillStyle='#fff';ctx.font='15px sans-serif';ctx.fillText(exitReady()?'SALIDA ♡':'CERRADO',gate-2,GROUND-120);portal(gate);if(level===4){drawCharacter(world-180,GROUND,'alexis');drawAlexisName(world-180,GROUND)}if(player.inv<=0||Math.floor(time/110)%2===0)drawCharacter(player.x+player.w/2,player.y+player.h,'michel');drawEffects();drawButterflies();ctx.restore();ctx.fillStyle='#2a153cb9';ctx.fillRect(0,0,W,80);ctx.fillStyle='#ffe0f1';ctx.font='bold 18px sans-serif';ctx.fillText(`Nivel ${level+1}/5 · ${LEVELS[level].name}`,18,32);ctx.font='15px Trebuchet MS';ctx.fillText(THEMES[level].place,18,65);for(let j=0;j<5;j++){ctx.fillStyle=j<=level?'#ffd2e9':'#ffffff35';ctx.beginPath();ctx.arc(430+j*22,65,j===level?5:3,0,7);ctx.fill()}ctx.font='bold 18px sans-serif';ctx.fillText(`${LEVELS[level].kind==='hearts'?'♡':'★'} ${count}/${LEVELS[level].goal}`,630,32);for(let i=0;i<lives;i++)drawHeart(854+i*30,26,10);if(arrival>0&&phase==='play'){ctx.fillStyle=`rgba(255,225,243,${arrival/900*.75})`;ctx.fillRect(0,51,W,H-51)}drawAdventureHUD();if(phase==='yes')for(const p of particles){drawHeart(p.x,p.y,p.s,'#ff8dc5');p.y+=p.vy;if(p.y>H)p.y=-10}}
function update(dt){time+=dt;animateEffects(dt);animateMotion(dt);if(phase==='reunion'){if(!reunionArtReady)return;reunionTime+=dt;if(reunionTime>=13500)finishReunion();return}if(phase!=='play'||!characterArtReady)return;animatePlatforms();updateAdventure(dt);const step=Math.min(dt/16.67,2);const targetVx=(Number(keys.right)-Number(keys.left))*4.4;player.vx+=(targetVx-player.vx)*(1-Math.exp(-dt/(player.on?65:100)));if(Math.abs(player.vx)<.03)player.vx=0;player.x+=player.vx*step;player.x=Math.max(0,Math.min(world-player.w,player.x));if(keys.jump&&!prevJump&&player.on){player.vy=-12.3;player.on=false;burst(player.x+14,player.y+player.h,'#fbc7ed',9);squash=.18}prevJump=keys.jump;const oldBottom=player.y+player.h;player.vy=Math.min(15,player.vy+.59*step);player.y+=player.vy*step;player.on=false;for(const p of platforms){if(p.gone>0||(p.bridge&&!adventure.switches.every(s=>s.on)))continue;if(player.x+player.w>p.x+3&&player.x<p.x+p.w-3&&oldBottom<=p.y+7&&player.y+player.h>=p.y&&player.vy>=0){if(player.vy>3){burst(player.x+14,p.y,'#eec4ee',10);squash=-.08;motion.land=1}player.y=p.y-player.h;player.vy=0;player.on=true}}if(player.y>H+70){damage(true)}for(const it of items)if(!it.got&&Math.abs(it.x-(player.x+14))<27&&Math.abs(it.y-(player.y+player.h*.55))<40){it.got=true;count++;burst(it.x,it.y,it.kind==='hearts'?'#ff86c6':'#ffe6a0',20);floaters.push({x:it.x,y:it.y-15,life:900,text:'+1',color:'#fff0c8'});tone(650+count*42,.1)}for(const h of hazards)if(player.inv<=0&&player.x+player.w>h.x+5&&player.x<h.x+h.w-5&&player.y+player.h>h.y+7){damage(false)}if(player.inv>0)player.inv-=dt;camera=0;if(level===4&&player.on&&Math.abs(player.x+14-(world-180))<65&&exitReady()){beginReunion();return}if(player.x>world-150&&exitReady())complete()}
function damage(fall){
 shake=9;burst(player.x+14,player.y+player.h*.55,'#ff6a99',24);lives--;tone(190,.2);
 if(lives<=0){phase='dead';show('<h2>Un respiro y seguimos '+String.fromCodePoint(9825)+'</h2><p>Conservas tus objetos y los retos completados. Puedes volver a intentarlo.</p>');btn('Continuar desde el punto de control',resumeCheckpoint);btn('Reiniciar este nivel',()=>start(level))}
 else{player.x=adventure.checkpoint.x;player.y=adventure.checkpoint.y;player.vx=player.vy=0;player.on=false;player.inv=1800}
}
function loop(t){let dt=Math.min(t-last||16,35);last=t;update(dt);render();requestAnimationFrame(loop)}
function tone(freq,dur){if(!musicOn)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch(e){}}
let note=0;setInterval(()=>{if(musicOn&&phase!=='menu')tone([392,494,587,659,587,494,440,523][note++%8],.35)},430);
document.querySelector('#music').onclick=()=>{musicOn=!musicOn;document.querySelector('#music').textContent='♫ Música: '+(musicOn?'ON':'OFF');if(musicOn)tone(523,.3)};
document.querySelector('#reset').onclick=()=>{if(confirm('¿Reiniciar el progreso desde el nivel 1?')){localStorage.removeItem('michel_level');level=0;menu()}};
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code))e.preventDefault();if(['ArrowLeft','KeyA'].includes(e.code))keys.left=true;if(['ArrowRight','KeyD'].includes(e.code))keys.right=true;if(['ArrowUp','Space','KeyW'].includes(e.code))keys.jump=true;if(e.code==='KeyE'&&phase==='play'&&player.x>world-150&&exitReady())complete()});document.addEventListener('keyup',e=>{if(['ArrowLeft','KeyA'].includes(e.code))keys.left=false;if(['ArrowRight','KeyD'].includes(e.code))keys.right=false;if(['ArrowUp','Space','KeyW'].includes(e.code))keys.jump=false});
document.querySelectorAll('#touch button').forEach(b=>{const k=b.dataset.key;for(const ev of ['pointerdown','pointerup','pointercancel','pointerleave'])b.addEventListener(ev,e=>{e.preventDefault();keys[k]=ev==='pointerdown';if(ev==='pointerdown')b.setPointerCapture(e.pointerId)})});

let effects=[],floaters=[],shake=0,squash=0,dustClock=0,arrival=0,reunionTime=0,reunionReturn=null;
function burst(x,y,color,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=1+Math.random()*3;effects.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:550+Math.random()*400,max:950,color,size:2+Math.random()*4})}if(effects.length>260)effects.splice(0,effects.length-260)}
function animateEffects(dt){const k=dt/16.67;arrival=Math.max(0,arrival-dt);shake=Math.max(0,shake-dt*.025);squash*=Math.pow(.8,k);for(const p of effects){p.x+=p.vx*k;p.y+=p.vy*k;p.vy+=.055*k;p.life-=dt}effects=effects.filter(p=>p.life>0);for(const f of floaters){f.y-=.6*k;f.life-=dt}floaters=floaters.filter(f=>f.life>0);if(phase==='play'&&player.on&&Math.abs(player.vx)>0){dustClock+=dt;if(dustClock>85){dustClock=0;burst(player.x+14,player.y+player.h,'#d9a2d0',2)}}}
function drawEffects(){ctx.save();for(const p of effects){ctx.globalAlpha=Math.min(1,p.life/350);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life/p.max,0,7);ctx.fill()}ctx.font='bold 22px Trebuchet MS';ctx.textAlign='center';for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life/300);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.restore()}
function ambient(){ctx.save();
 for(let i=0;i<28;i++){let x=((rand(i+300)*W-camera*.22+Math.sin(time*.0006+i)*36)%W+W)%W,y=120+rand(i+400)*300+Math.sin(time*.001+i*2)*22;ctx.globalAlpha=.25+(Math.sin(time*.003+i)+1)*.28;ctx.shadowColor='#ffe5a1';ctx.shadowBlur=12;ctx.fillStyle='#ffefb4';ctx.beginPath();ctx.arc(x,y,1.5+rand(i)*1.3,0,7);ctx.fill()}
 ctx.shadowBlur=0;ctx.globalAlpha=.45;
 for(let i=0;i<14;i++){let x=((rand(i+80)*W+time*.025-camera*.3)% (W+40)+W+40)%(W+40)-20,y=(rand(i+91)*H+time*.016)%(H+20);ctx.save();ctx.translate(x,y);ctx.rotate(time*.001+i);ctx.fillStyle=i%2?'#ffa7d6':'#e7b8ff';ctx.beginPath();ctx.ellipse(0,0,4,2,0,0,7);ctx.fill();ctx.restore()}
 for(let i=0;i<5;i++){let x=((i*213+time*.018-camera*.25)%W+W)%W,y=240+Math.sin(time*.001+i*3)*65;ctx.globalAlpha=.8;ctx.fillStyle=i%2?'#dda6ff':'#ffafce';let wing=2+Math.abs(Math.sin(time*.018+i))*6;ctx.beginPath();ctx.ellipse(x-wing*.5,y,wing,4,-.5,0,7);ctx.ellipse(x+wing*.5,y,wing,4,.5,0,7);ctx.fill()}
 ctx.restore()
}
function garden(){ctx.save();for(let i=0;i<Math.ceil(world/42);i++){let x=i*42+12;if(x<camera-40||x>camera+W+40)continue;const sway=Math.sin(time*.002+i)*4,h=8+rand(i+12)*13;ctx.strokeStyle='#8b9c87';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,GROUND);ctx.quadraticCurveTo(x+sway,GROUND-h*.5,x+sway,GROUND-h);ctx.stroke();if(i%3===0){ctx.fillStyle=['#ffa4cc','#e5b0ff','#ffe4a1'][i%3+(Math.floor(i/3)%3)];for(let j=0;j<5;j++){let a=j*Math.PI*2/5;ctx.beginPath();ctx.arc(x+sway+Math.cos(a)*3.5,GROUND-h+Math.sin(a)*3.5,3,0,7);ctx.fill()}ctx.fillStyle='#fff0b0';ctx.beginPath();ctx.arc(x+sway,GROUND-h,2,0,7);ctx.fill()}}ctx.restore()}
function portal(x){const open=exitReady();ctx.save();ctx.translate(x+35,GROUND-51);ctx.globalAlpha=open?.7:.2;const glow=ctx.createRadialGradient(0,0,3,0,0,70);glow.addColorStop(0,'#fff0ff');glow.addColorStop(.45,'#ee86e9');glow.addColorStop(1,'#d95dff00');ctx.fillStyle=glow;ctx.fillRect(-70,-80,140,150);ctx.strokeStyle=open?'#ffdbfb':'#ba93c5';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,25+Math.sin(time*.003)*3,48,0,0,7);ctx.stroke();if(open)for(let i=0;i<10;i++){let a=time*.002+i*Math.PI/5;drawStar(Math.cos(a)*29,Math.sin(a)*49,3)}ctx.restore()}


function beginReunion(after=null){
 if(phase==='reunion')return;
 level=4;phase='reunion';reunionTime=0;reunionReturn=after;keys.left=keys.right=keys.jump=false;player.vx=0;hide();
 document.querySelector('#game-wrap').classList.add('cinematic');
 reunionButton.hidden=false;reunionButton.textContent='Continuar a la carta';
}
function finishReunion(){if(phase!=='reunion')return;reunionButton.hidden=true;document.querySelector('#game-wrap').classList.remove('cinematic');const after=reunionReturn;reunionReturn=null;if(after)after();else finalScene()}
const reunionButton=document.createElement('button');reunionButton.id='reunion-next';reunionButton.hidden=true;reunionButton.onclick=finishReunion;document.querySelector('#game-wrap').appendChild(reunionButton);
function ease(a,b,t){const k=Math.max(0,Math.min(1,t));return a+(b-a)*k*k*(3-2*k)}
// Arte de tres poses; se conserva la anatomia de la ilustracion original.
const cast=document.createElement('section');cast.className='cast';cast.setAttribute('aria-label','Michel y Alexis');
cast.innerHTML='<div class="cast-card"><canvas id="michel-face" width="240" height="240" aria-label="Retrato de Michel"></canvas><span>Michel</span></div><span class="cast-heart" aria-hidden="true">♡</span><div class="cast-card"><canvas id="alexis-face" width="240" height="240" aria-label="Retrato de Alexis"></canvas><span>Alexis</span></div>';
document.querySelector('#app').insertBefore(cast,document.querySelector('#game-wrap'));
const reunionArt=new Image();let reunionArtReady=false;
reunionArt.onload=()=>{reunionArtReady=true;drawCastPortraits()};
reunionArt.src='assets/encuentro-vestido-marino.png';
const ENCOUNTER_MARKS=[[[209,356],[322,358]],[[744,358],[808,375]],[[1230,342],[1271,365]]];
// Atenúa el resto del punto antiguo de la mejilla antes de situar el lunar.
const MICHEL_CHEEK_CLEANUP=[[197,362,'#f9bc94'],[730,362,'#f7b993'],[1232,345,'#f5b088']];
function cleanCheek(target,x,y,radius,color){target.save();target.fillStyle=color;target.beginPath();target.arc(x,y,radius,0,Math.PI*2);target.fill();target.restore()}
function drawCastPortraits(){
 const portraits=[{id:'#michel-face',crop:[65,215,235,235],mark:ENCOUNTER_MARKS[0][0],radius:2.1}, {id:'#alexis-face',crop:[225,155,245,245],mark:[322,358],radius:1.8}];
 for(const portrait of portraits){
  const surface=document.querySelector(portrait.id),face=surface.getContext('2d');
  const [sx,sy,sw,sh]=portrait.crop;face.clearRect(0,0,240,240);face.save();face.beginPath();face.arc(120,120,118,0,Math.PI*2);face.clip();
  face.fillStyle='#392638';face.fillRect(0,0,240,240);face.imageSmoothingEnabled=true;face.imageSmoothingQuality='high';face.drawImage(reunionArt,sx,sy,sw,sh,0,0,240,240);
  if(portrait.id==='#michel-face'){const [cx,cy,color]=MICHEL_CHEEK_CLEANUP[0];cleanCheek(face,(cx-sx)*240/sw,(cy-sy)*240/sh,2.5*240/sw,color)}
  beautyMark(face,(portrait.mark[0]-sx)*240/sw,(portrait.mark[1]-sy)*240/sh,portrait.radius);face.restore()
 }
}
function drawReunionArt(t){
 if(!reunionArtReady)return;
 const hug=ease(0,1,(t-3400)/450),kiss=ease(0,1,(t-6500)/450);
 const frames=[1-hug,hug*(1-kiss),kiss];
 const cellWidth=reunionArt.naturalWidth/3,fullHeight=reunionArt.naturalHeight;
 const sourceY=fullHeight*.13,cellHeight=fullHeight*.78;
 const height=454,width=height*cellWidth/cellHeight,zoom=1+ease(0,.018,t/13500);
 ctx.save();ctx.translate(W/2,270);ctx.scale(zoom,zoom);ctx.beginPath();ctx.roundRect(-width/2,-height/2,width,height,20);ctx.clip();ctx.fillStyle='#30212d';ctx.fillRect(-width/2,-height/2,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(let i=0;i<3;i++){
  if(frames[i]<=0)continue;ctx.globalAlpha=frames[i];ctx.drawImage(reunionArt,i*cellWidth,sourceY,cellWidth,cellHeight,-width/2,-height/2,width,height);
  const [cx,cy,color]=MICHEL_CHEEK_CLEANUP[i];cleanCheek(ctx,-width/2+(cx-i*512)*width/512,-height/2+(cy/1024*fullHeight-sourceY)*height/cellHeight,2.5*width/512,color);
  ENCOUNTER_MARKS[i].forEach(([mx,my],person)=>beautyMark(ctx,-width/2+(mx-i*512)*width/512,-height/2+(my/1024*fullHeight-sourceY)*height/cellHeight,person===0?.7:.55));
 }
 ctx.restore()
}
function renderReunion(){
 scenery();ambient();const t=reunionTime;
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#251b3b33');shade.addColorStop(1,'#f4b3bd55');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 const hug=ease(0,1,(t-3700)/1300),kiss=ease(0,1,(t-6500)/1500)*(1-ease(0,1,(t-10500)/1600));
 
 ctx.fillStyle='#eec6d777';ctx.beginPath();ctx.ellipse(480,442,255,34,0,0,7);ctx.fill();
 drawReunionArt(t);
 if(hug>0){for(let i=0;i<12;i++){const age=((t-4000+i*310)%3300+3300)%3300;ctx.globalAlpha=Math.sin(age/3300*Math.PI)*hug;drawHeart(480+Math.sin(i*5.4)*110,285-age*.055,4+(i%4)*2,i%2?'#ffd6df':'#ff8fb3')}ctx.globalAlpha=1}
 if(kiss>.5){ctx.save();ctx.shadowColor='#ffd1de';ctx.shadowBlur=24;drawHeart(480,205+Math.sin(t*.003)*5,17+Math.sin(t*.004)*2,'#ffacc7');ctx.restore()}
 const fade=Math.max(0,1-t/700);if(fade){ctx.fillStyle=`rgba(255,230,235,${fade})`;ctx.fillRect(0,0,W,H)}
}

window.addEventListener('blur',()=>{keys.left=false;keys.right=false;keys.jump=false;prevJump=false});
resizeCanvas();menu();requestAnimationFrame(loop);
