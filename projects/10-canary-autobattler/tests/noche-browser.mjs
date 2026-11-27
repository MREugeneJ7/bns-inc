// On a Vite dev server. Import maps to plan a route; move only with real keyboard events.
// PLAYWRIGHT_MODULE may point to a separately installed Playwright, without adding it to the game bundle.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1366,height:850}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(() => {
  window.__drawnText = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
    if (window.__drawnText.length < 3000) window.__drawnText.push(String(text));
    return original.call(this, text, ...args);
  };
});
const canvas=page.locator('canvas[data-map]');
const state=()=>canvas.evaluate(c=>({id:c.dataset.map,pos:c.dataset.position.split(',').map(Number),phase:c.dataset.phase}));
const face=async(key)=>{await page.keyboard.down(key);await page.waitForTimeout(45);await page.keyboard.up(key);};
async function readDialogue() {
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='diálogo');
  const lines=[];
  for(let i=0;i<70;i++) {
    const item=await canvas.evaluate(c=>({phase:c.dataset.phase,text:c.dataset.dialogue}));
    if(item.phase!=='diálogo') break;
    lines.push(item.text);await page.keyboard.press('z');await page.waitForTimeout(55);
  }
  return lines.join(' ');
}
async function dismiss(){
  await page.waitForTimeout(460);
  for(let i=0;i<70;i++){
    const s=await state();if(s.phase==='exploración')return;
    if(s.phase==='diálogo')await page.keyboard.press('z');await page.waitForTimeout(45);
  }throw new Error('dialogue did not finish');
}
async function walk(to, expectedMap){
  await dismiss();const s=await state();
  const groups=await page.evaluate(async({to,mapId,start})=>{
    const {MAPS}=await import('/src/game/maps.ts'), {SOLID}=await import('/src/game/sprites.ts');
    const {save,npcState}=await import('/src/game/save.ts'),{stickyAt}=await import('/src/game/nightRoute.ts');
    const {AMER_CARRETA_POS,AMER_GUAGUA_POS}=await import('/src/game/mapsTf1.ts');
    const m=MAPS[mapId], blocked=new Set(m.npcs.map(n=>npcState(n)).filter(n=>!n.hidden).map(s=>[s.x,s.y].join(',')));
    if(mapId==='las_americas')for(const p of [AMER_CARRETA_POS,AMER_GUAGUA_POS])for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)blocked.add(x+','+y);
    for(const t of m.triggers)if(t.kind==='step'&&t.action.type==='warp'&&t.x+','+t.y!==to.join(','))blocked.add(t.x+','+t.y);
    const q=[[...start,[]]],seen=new Set([start.join(',')]);let path;
    for(let i=0;i<q.length;i++){
      const [x,y,history]=q[i];if(x===to[0]&&y===to[1]){path=history;break;}
      for(const [key,dx,dy] of [['ArrowUp',0,-1],['ArrowDown',0,1],['ArrowLeft',-1,0],['ArrowRight',1,0]]){
        const a=x+dx,b=y+dy,k=a+','+b;
        if(seen.has(k)||blocked.has(k)||a<0||b<0||a>=m.rows[0].length||b>=m.rows.length||SOLID[m.legend[m.rows[b][a]]]||(mapId==='papagayos'&&stickyAt(a,b,!!save.flags.boliche_5)))continue;
        seen.add(k);q.push([a,b,[...history,[key,k]]]);
      }
    }
    if(!path)throw new Error('no route: '+mapId+' '+start+' -> '+to);
    const groups=[];for(const [key,end] of path){if(groups.at(-1)?.key===key)groups.at(-1).end=end;else groups.push({key,end});}return groups;
  },{to,mapId:s.id,start:s.pos});
  for(const {key,end} of groups){
    await page.keyboard.down(key);
    try{await page.waitForFunction(({id,end})=>{const c=document.querySelector('canvas[data-map]');return c&&(c.dataset.position===end||c.dataset.map!==id);},{id:s.id,end},{polling:'raf',timeout:15000});}
    finally{await page.keyboard.up(key);}
  }
  if(expectedMap){await page.waitForFunction(id=>document.querySelector('canvas')?.dataset.map===id,expectedMap,{timeout:4000});}
}
try {
  await page.goto(process.env.BASE_URL||'http://localhost:4177',{waitUntil:'networkidle'});
  await canvas.waitFor();
  await page.waitForFunction(()=>document.querySelector('canvas[data-map]')?.dataset.phase==='título');
  assert.equal((await state()).id,'apartment');
  assert.ok(await page.evaluate(()=>window.__drawnText.includes('MAGOMON') && window.__drawnText.includes('CRONICAS DEL GUIRUFO')));
  assert.equal(await page.getByText('Consola de juego').count(),0);
  await page.keyboard.press('z');
  await page.waitForFunction(()=>document.querySelector('canvas[data-map]')?.dataset.phase==='diálogo');
  console.log('ok - pantalla de título original y comienzo en el apartamento');
  await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button',{name:/PARTIDA/}).click();
  await page.getByRole('button',{name:'Saltos rápidos'}).click();
  await page.getByRole('textbox',{name:'Buscar capítulo'}).fill('ruta nocturna');
  await page.getByRole('button',{name:/Ruta nocturna/i}).click();
  await page.waitForFunction(()=>document.querySelector('canvas[data-map]')?.dataset.map==='las_americas');
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('canvas[data-map]')?.dataset.phase==='título');
  assert.equal((await state()).id,'las_americas');
  await page.keyboard.press('z');
  await page.waitForFunction(()=>document.querySelector('canvas[data-map]')?.dataset.phase==='exploración');
  console.log('ok - continuar desde el título conserva la partida y sus avances');
  await walk([16,0],'puente_magma');await walk([11,0],'siam_park');
  if(process.env.TEST_SAFARI){
    await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button',{name:/PARTIDA/}).click();
    await page.getByRole('button',{name:'Saltos rápidos'}).click();
    await page.getByRole('textbox',{name:'Buscar capítulo'}).fill('Siam Park');
    await page.getByRole('button',{name:/Siam Park.*Entrada:/}).click();
    const flags=()=>page.evaluate(()=> JSON.parse(localStorage.getItem('magomon.local.v1')||'{}').flags||{});
    assert.ok(!(await flags()).hm_salto_pastor && !(await flags()).hm_pukas);
    await walk([7,16]);await face('ArrowLeft');await page.keyboard.press('z');await dismiss();
    assert.ok((await flags()).saw_guiri_crema);
    await walk([10,17]);await face('ArrowDown');await page.keyboard.press('z');await dismiss();
    assert.ok((await flags()).has_crema_fp50);
    await walk([7,16]);await face('ArrowLeft');await page.keyboard.press('z');await dismiss();
    assert.ok((await flags()).hm_salto_pastor);
    await walk([32,14]);await walk([34,14]);
    assert.deepEqual((await state()).pos,[34,14]); // Se cruza a pie: ya no hay un risco en medio del parque.
    await walk([7,13]);
    await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('magomon.local.v1')||'{}').flags?.pukas_dropped,null,{timeout:15000});
    await dismiss();await walk([6,13]);await face('ArrowUp');await page.keyboard.press('z');await dismiss();
    assert.ok((await flags()).pukas_recovered);
    await walk([9,13]);await face('ArrowUp');await page.keyboard.press('z');
    for(let i=0;i<30&&!(await flags()).hm_pukas;i++){await page.keyboard.press('z');await page.waitForTimeout(70);}
    await dismiss();assert.ok((await flags()).hm_pukas);
    await walk([7,12]);await face('ArrowUp');await page.getByRole('button', { name: 'START' }).click(); await page.getByRole('button',{name:/MOCHILA/}).click();
    await page.getByRole('button',{name:/USAR TABLA PUKAS/}).click();await page.waitForTimeout(300);
    assert.ok((await flags()).pukas_out);assert.deepEqual((await state()).pos,[7,11]);
    await page.keyboard.down('ArrowDown');await page.waitForFunction(()=>document.querySelector('canvas').dataset.position==='7,12');await page.keyboard.up('ArrowDown');
    assert.equal((await flags()).pukas_out,false);console.log('ok - crema devuelta, sendero libre, rescate de la tabla, surf y desembarco');
  }
  await walk([48,23],'puente_magma');await walk([11,19],'las_americas');
  console.log('ok - ida y vuelta andando entre la estación y Siam Park por el puente');
  await walk([0,9],'veronicas');
  for(const xy of [[32,8],[19,8],[11,10],[14,13],[18,17],[23,19],[41,19],[57,21]])await walk(xy);
  await page.waitForTimeout(500);
  const palette=await canvas.evaluate(c=>{
    const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    const allowed=new Set(['242,217,238','198,154,200','130,86,141','56,35,66']);
    let exact=0;for(let i=0;i<pixels.length;i+=4)if(allowed.has([pixels[i],pixels[i+1],pixels[i+2]].join(',')))exact++;
    return exact/(pixels.length/4);
  });
  assert.ok(palette>0.97,`Adeje debe mantener la paleta violeta de cuatro tonos (${palette})`);
  await walk([52,20]);await face('ArrowRight');await page.keyboard.press('z');
  assert.match(await readDialogue(),/Hierba/);
  await walk([66,19]);await face('ArrowRight');await page.keyboard.press('z');
  assert.match(await readDialogue(),/aguantar hasta que amanezca/);
  console.log('ok - los dos «quieres algo» conservan el subtexto nocturno');
  await walk([73,16],'papagayos');
  console.log('ok - recorrido real a pie H10, callejuela, Monkeys, Troya, Las Verónicas y Papagayos');
  if(process.env.QA_SHOTS)await page.screenshot({path:'.qa/club.png'});
  await walk([9,17]);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(240);await page.keyboard.up('ArrowLeft');assert.deepEqual((await state()).pos,[9,17]);
  await walk([9,3]);await page.keyboard.down('ArrowUp');await page.waitForTimeout(55);await page.keyboard.up('ArrowUp');await page.keyboard.press('z');
  for(let i=0;i<50&&!await page.getByRole('button',{name:/BARAJAR Y ROBAR/}).count();i++){await page.keyboard.press('z');await page.waitForTimeout(65);}
  await page.getByRole('button',{name:/BARAJAR Y ROBAR/}).waitFor({timeout:3000});
  assert.match(await page.locator('body').innerText(), /VENENO \(V\): -1 VIDA/);
  console.log('ok - el derrame bloquea el movimiento y el camino seco conduce al duelo de veneno de Yéssica');
  assert.deepEqual(errors,[]);

  const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
  await mobile.goto(process.env.BASE_URL||'http://localhost:4177',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='título');
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await mobile.getByRole('button',{name:'A',exact:true}).click();
  await mobile.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='diálogo');
  assert.deepEqual(mobileErrors,[]);
  await mobile.close();
  console.log('ok - título y comienzo con botón táctil a 390 px');
}finally{await browser.close();}
