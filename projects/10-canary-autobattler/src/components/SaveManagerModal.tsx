import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Download, FileJson, Flag, FolderOpen, Gamepad2, RotateCcw, Search, Upload, X } from 'lucide-react';
import { exportSaveJSON, importSaveJSON, loadPreset, save } from '../game/save';
import { MAPS, type StarterId } from '../game/maps';
import { input, ui } from '../game/input';
import { CHECKPOINTS, type PresetId } from '../game/checkpoints';
import './saveManager.css';

interface Props { onClose:()=>void; onStateReload:()=>void; onTestBattle:()=>void; }
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const BACKUP='magomon.before_jump';
export function SaveManagerModal({onClose,onStateReload,onTestBattle}:Props){
  const [tab,setTab]=useState<'files'|'chapters'>('files');
  const [filter,setFilter]=useState(''),[paste,setPaste]=useState(''),[error,setError]=useState('');
  const [copied,setCopied]=useState(false),[starter,setStarter]=useState<StarterId>(save.starter??'cabra');
  const [backup]=useState(()=>{try{return localStorage.getItem(BACKUP)}catch{return null}});
  const [url,setUrl]=useState('');const dialog=useRef<HTMLDivElement>(null);const closeRef=useRef(onClose);closeRef.current=onClose;
  const snapshot=useMemo(()=>exportSaveJSON(),[]);
  useEffect(()=>{const blob=URL.createObjectURL(new Blob([snapshot],{type:'application/json'}));setUrl(blob);return()=>URL.revokeObjectURL(blob)},[snapshot]);
  useEffect(()=>{const old=document.activeElement as HTMLElement;ui.paused=true;input.held.clear();dialog.current?.querySelector('button')?.focus();
    const handle=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeRef.current()};if(e.key==='Tab'){
      const focusable=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not([hidden]),textarea,select,[tabindex="0"]')??[]).filter(el=>el.offsetParent!==null);
      const f=focusable[0],l=focusable.at(-1); if(e.shiftKey&&document.activeElement===f){e.preventDefault();l?.focus();}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f?.focus();}
    }};window.addEventListener('keydown',handle);return()=>{ui.paused=false;window.removeEventListener('keydown',handle);input.consumeA();input.consumeB();old?.focus();};},[]);
  const load=(text:string)=>{try{const data=JSON.parse(text);if(!data||(data.mapId!=='caletillas'&&!Object.prototype.hasOwnProperty.call(MAPS,data.mapId))||!data.playerPos||!data.flags||!Array.isArray(data.deck))throw Error();if(!importSaveJSON(text))throw Error(); onStateReload();onClose();}catch{setError('Ese archivo no es una partida válida de Magomon. Tu partida no ha cambiado.');}};
  const jump=(id:PresetId)=>{try{if(Object.keys(save.flags).length)localStorage.setItem(BACKUP,exportSaveJSON());}catch{/* optional backup */}loadPreset(id,starter);onStateReload();onClose()};
  const matches = CHECKPOINTS.map(([id, name, desc], i) => [id, `${i + 1}. ${name}`, desc] as const)
    .filter(row => norm(row.join(' ')).includes(norm(filter)));
  const inputFile=useRef<HTMLInputElement>(null);
  return <div className="save-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div ref={dialog} className="save-window" role="dialog" aria-label="Mi partida" aria-modal="true">
    <div className="save-top"><span><FileJson size={17}/> MEMORIA DEL CARTUCHO</span><button onClick={onClose} aria-label="Cerrar partida"><X size={18}/></button></div>
    <div className="save-body"><h2>Mi partida</h2><p className="save-sub">{MAPS[save.mapId].name} <span>· {save.playerPos.x}, {save.playerPos.y}</span></p>
    <div className="save-tabs"><button className={tab==='files'?'on':''} onClick={()=>setTab('files')}><FolderOpen/>Archivos</button><button className={tab==='chapters'?'on':''} onClick={()=>setTab('chapters')}><Flag/>Saltos rápidos</button></div>
    {tab==='files'?<><h3>GUARDAR SAVE-FILE</h3><p>Guarda una copia para seguir en otro dispositivo.</p><div className="save-actions"><a className="save-focus" download="magomon_save.json" href={url}><Download/>Descargar partida</a><button onClick={async()=>{try{await navigator.clipboard.writeText(snapshot);setCopied(true)}catch{setError('No se puede acceder al portapapeles. Utiliza Descargar partida.')}}}>{copied?<Check/>:<Copy/>}{copied?'JSON copiado':'Copiar JSON'}</button></div>
    <div className="save-divider"/><h3>CARGAR PARTIDA</h3><p>Abre un archivo de Magomon o pega su contenido.</p><input ref={inputFile} hidden type="file" accept=".json,application/json" onChange={async e=>{const f=e.target.files?.[0];if(f){try{load(await f.text())}catch{setError('No se ha podido leer el archivo.')}}}}/><button className="upload-save" onClick={()=>inputFile.current?.click()}><Upload size={18}/> Abrir archivo .json <ArrowRight size={14}/></button>
    <div className="paste-save"><input aria-label="Partida en JSON" placeholder="O pega el JSON aqui..." value={paste} onChange={e=>setPaste(e.target.value)}/><button disabled={!paste.trim()} onClick={()=>load(paste)}>Cargar</button></div>
    {backup&&<button className="restore-save" onClick={()=>load(backup)}><RotateCcw size={13}/> Recuperar partida anterior al último salto</button>}
    </>:<><div className="preset-tools"><label><Search size={14}/><input aria-label="Buscar capítulo" placeholder="Buscar capítulo…" value={filter} onChange={e=>setFilter(e.target.value)}/></label><select aria-label="Mazo de prueba" value={starter} onChange={e=>setStarter(e.target.value as StarterId)}><option value="cabra">Mazo: Cabra</option><option value="angelote">Mazo: Angelote</option><option value="pinzon">Mazo: Pinzón</option></select></div>
    <p className="save-tip">Elige un punto de prueba. Tu partida anterior queda en «Archivos».</p>
    <div className="preset-list">{matches.map(([id,title,desc])=><button key={id} onClick={()=>jump(id)}><span><strong>{title}</strong><small>{desc}</small></span><ArrowRight size={14}/></button>)}{!matches.length&&<p>No hay capítulos con ese nombre.</p>}</div>
    <button className="restore-save" onClick={()=>{if(!save.deck.length)loadPreset('recado',starter);onTestBattle();onClose()}}><Gamepad2 size={15}/> Duelo de prueba en el laboratorio</button></>}
    {error&&<div className="save-error" role="alert">{error}</div>}</div></div></div>;
}
