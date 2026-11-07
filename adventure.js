'use strict';
let adventure=null;
const CHALLENGES=[
 'Encuentra la carta en lo alto del jardín y reúne los corazones.',
 'Activa los dos cristales para abrir el paso de la laguna.',
 'Cruza las plataformas de cristal: desaparecen al pisarlas.',
 'Atrapa tres veces la estrella viajera y reúne las estrellas.',
 'Recupera los tres recuerdos y llévaselos a Alexis.'
];
function setupAdventure(n){
 adventure={elapsed:0,score:0,checkpoint:{x:40,y:GROUND-90,active:false},letter:false,
  switches:[],memories:[],chases:0,star:null,secret:false,ready:false};
 if(n===0)adventure.letterPosition={x:430,y:230};
 if(n===1){
  adventure.switches=[{x:205,y:GROUND-23,on:false},{x:405,y:245,on:false}];
  platforms[0].w=620;
  platforms.push({x:735,y:GROUND,w:W-735,h:120});
  // El puente conecta ambos lados del paso bloqueado.
  platforms.push({x:620,y:350,w:115,h:18,bridge:true});
 }
 if(n===2)for(const p of platforms.slice(1)){p.fragile=true;p.crumble=0;p.gone=0}
 if(n===3)adventure.star={x:235,y:245};
 if(n===4)adventure.memories=[{x:175,y:310,label:'Tu sonrisa',got:false},{x:360,y:240,label:'Nuestras pláticas',got:false},{x:720,y:225,label:'Lo que viene',got:false}];
 adventure.secretPosition={x:level===3?595:410,y:level===3?120:190};
}
function missionDone(){
 if(!adventure)return false;
 return [adventure.letter,adventure.switches.length===2&&adventure.switches.every(s=>s.on),true,adventure.chases===3,adventure.memories.length===3&&adventure.memories.every(m=>m.got)][level];
}
function exitReady(){return count===LEVELS[level].goal&&missionDone()}
function nearby(x,y,r=33){return Math.abs(player.x+14-x)<r&&Math.abs(player.y+48-y)<55}
function announce(text,x=player.x+14,y=player.y){floaters.push({x:Math.max(140,Math.min(800,x)),y,life:1800,text,color:'#fff0c8'});tone(780,.15)}
function updateAdventure(dt){
 const a=adventure;if(!a)return;
 a.elapsed+=dt;
 for(const p of platforms){
  if(!p.fragile)continue;
  if(p.gone>0){p.gone=Math.max(0,p.gone-dt);if(!p.gone)p.crumble=0;continue}
  const standing=player.on&&Math.abs(player.y+player.h-p.y)<2&&player.x+player.w>p.x&&player.x<p.x+p.w;
  if(standing||p.crumble>0)p.crumble+=dt;
  if(p.crumble>=850){p.gone=2100;p.crumble=0;burst(p.x+p.w/2,p.y,'#cae9ff',15)}
 }
 if(level===0&&!a.letter&&nearby(a.letterPosition.x,a.letterPosition.y)){
  a.letter=true;a.score+=200;announce('Una coincidencia nos trajo hasta aquí ♡');burst(player.x+14,player.y,'#ffd6ec',30);
 }
 for(const s of a.switches)if(!s.on&&nearby(s.x,s.y)){
  s.on=true;a.score+=100;announce(a.switches.every(k=>k.on)?'¡Puente abierto!':'Cristal activado · falta uno');burst(s.x,s.y,'#9fffe5',25);
 }
 if(level===3&&a.chases<3){
  const t=a.elapsed*.001;
  a.star.x=460+Math.sin(t*.85+a.chases*2)*265;
  a.star.y=260+Math.sin(t*1.25)*65;
  if(nearby(a.star.x,a.star.y,34)){
   a.chases++;a.score+=150;burst(a.star.x,a.star.y,'#fff2a3',35);announce(a.chases===3?'¡Deseo alcanzado!':`¡La atrapaste! ${a.chases}/3`);
   a.elapsed+=1700;
  }
 }
 for(const m of a.memories)if(!m.got&&nearby(m.x,m.y)){m.got=true;a.score+=150;announce(m.label+' ♡');burst(m.x,m.y,'#ffbde3',25)}
 if(!a.secret&&nearby(a.secretPosition.x,a.secretPosition.y,24)){a.secret=true;a.score+=300;announce('¡Recuerdo secreto! +300');burst(player.x+14,player.y,'#fff1ab',40)}
 const cp=a.checkpoint;
 if(!cp.active&&player.x>460&&player.x<530&&player.on&&player.y+player.h>GROUND-2){cp.active=true;cp.x=490;announce('Punto de control guardado',490,GROUND-130);burst(490,GROUND-25,'#b8ffe3',25)}
 if(level===1&&!a.switches.every(s=>s.on)&&player.x+player.w>610&&player.x<680&&player.y+player.h>190){player.x=610-player.w;player.vx=0}
 if(exitReady()&&!a.ready){a.ready=true;announce(level===4?'¡Lleva tus recuerdos a Alexis!':'¡Portal abierto!',780,GROUND-150);burst(world-75,GROUND-60,'#ffe5a1',70)}
}
function adventureStatus(){
 const a=adventure;if(!a)return '';
 if(exitReady())return level===4?'Encuentra a Alexis a la derecha ♡':'¡Objetivo completo! Entra al portal →';
 if(level===0)return a.letter?'Carta encontrada · completa los corazones':'Busca el sobre dorado sobre la plataforma central';
 if(level===1)return `Cristales ${a.switches.filter(s=>s.on).length}/2 · tócalos para abrir el puente`;
 if(level===2)return 'Salta antes de que el cristal se rompa · vuelve en 2 segundos';
 if(level===3)return `Estrella viajera ${a.chases}/3 · sigue su estela y atrápala`;
 return `Recuerdos ${a.memories.filter(m=>m.got).length}/3 · recógelos y busca a Alexis`;
}
function drawAdventure(){
 if(!adventure)return;
 const a=adventure;ctx.save();
 // Un punto de control seguro en el suelo.
 ctx.strokeStyle=a.checkpoint.active?'#b6ffe4':'#d5b8df';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(490,GROUND);ctx.lineTo(490,GROUND-47);ctx.stroke();
 ctx.fillStyle=a.checkpoint.active?'#91e8c6':'#ae87bc';ctx.beginPath();ctx.moveTo(490,GROUND-47);ctx.lineTo(517,GROUND-38);ctx.lineTo(490,GROUND-29);ctx.fill();
 function glow(x,y,color){ctx.shadowBlur=17;ctx.shadowColor=color;ctx.fillStyle=color}
 if(level===0&&!a.letter){const p=a.letterPosition;glow(p.x,p.y,'#ffe5a6');ctx.fillRect(p.x-15,p.y-10,30,21);ctx.shadowBlur=0;ctx.strokeStyle='#a57365';ctx.beginPath();ctx.moveTo(p.x-15,p.y-10);ctx.lineTo(p.x,p.y+2);ctx.lineTo(p.x+15,p.y-10);ctx.stroke()}
 for(const s of a.switches){glow(s.x,s.y,s.on?'#adffe0':'#c8a5ff');ctx.beginPath();ctx.moveTo(s.x,s.y-20);ctx.lineTo(s.x+12,s.y);ctx.lineTo(s.x,s.y+15);ctx.lineTo(s.x-12,s.y);ctx.closePath();ctx.fill()}
 if(level===1){
  ctx.fillStyle='#79d9e866';ctx.fillRect(620,GROUND+8,115,H-GROUND);
  if(!a.switches.every(s=>s.on)){ctx.shadowBlur=12;ctx.shadowColor='#b5b7ff';ctx.fillStyle='#bda9ff66';ctx.fillRect(610,190,10,GROUND-190);ctx.shadowBlur=0}
 }
 if(level===3&&a.chases<3){for(let i=5;i>=0;i--){ctx.globalAlpha=1-i*.15;drawStar(a.star.x-i*11,a.star.y+Math.sin(i)*4,18-i*2)}ctx.globalAlpha=1}
 for(const m of a.memories)if(!m.got){glow(m.x,m.y,'#ffc3df');drawHeart(m.x,m.y,16);ctx.shadowBlur=0;ctx.fillStyle='#fff4e8';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(m.label,m.x,m.y-24)}
 if(!a.secret){ctx.globalAlpha=.3+Math.sin(time*.005)*.2;drawStar(a.secretPosition.x,a.secretPosition.y,9)}
 ctx.restore();
}
function drawAdventureHUD(){
 if(!adventure)return;ctx.save();ctx.fillStyle='#24172ee8';ctx.fillRect(16,85,928,43);
 ctx.fillStyle='#ffe4bb';ctx.font='15px Trebuchet MS';ctx.fillText(adventureStatus(),29,112);
 ctx.fillStyle='#eed8f5';ctx.textAlign='right';ctx.font='13px Trebuchet MS';ctx.fillText(`${adventure.score+count*50} pts · secreto ${adventure.secret?'1':'0'}/1`,927,111);ctx.restore();
}
function resumeCheckpoint(){
 lives=3;player.x=adventure.checkpoint.x;player.y=adventure.checkpoint.y;player.vx=player.vy=0;player.on=false;player.inv=1800;
 keys.left=keys.right=keys.jump=false;prevJump=false;phase='play';hide();
}
