import{SAMPLE_PLAN,validatePlan,compare,exportReplay,importReplay}from'./engine.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette=['#bc714e','#ae8b47','#537667','#6b80a5','#718948','#9e7696'];
const color=t=>/^#[0-9a-f]{6}$/i.test(t.color)?t.color:palette[0];
let plan=structuredClone(SAMPLE_PLAN),change={type:'scope',taskId:'draft',percent:30},view='baseline',result,undo=null,editing=null;
const pct=n=>`${Math.round(n*100)}%`,hours=n=>Number(n.toFixed(1)),dayDate=i=>{const d=new Date(plan.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);return d;};
const dayName=i=>dayDate(i).toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'}),dateLabel=i=>dayDate(i).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'});
function notify(s){$('#notice').textContent=s;$('#notice').hidden=!s;}
function error(s){$('#errors').textContent=s;$('#errors').hidden=!s;}
function persist(){try{localStorage.setItem('daylight-v1',exportReplay(plan,change));}catch{notify('Browser saving is unavailable. Export a replay to keep this plan.');}}
function wilson(p,n){const z=1.96,c=(p+z*z/2/n)/(1+z*z/n),r=z*Math.sqrt(p*(1-p)/n+z*z/4/n/n)/(1+z*z/n);return `${Math.round((c-r)*100)}–${Math.round((c+r)*100)}%`;}
function render(fields=true){
  try{result=compare(plan,change);error('');$('#apply').disabled=false;$('#export').disabled=false;}catch(e){error(e.message+' Comparison unavailable. Adjust the change to continue.');$('#baseline-score').textContent='—';$('#changed-score').textContent='—';$('#apply').disabled=true;$('#export').disabled=true;$('#week-caption').textContent='Last valid schedule — comparison unavailable until the error is fixed.';if(fields)renderChangeFields();return;}
  const b=result.baseline,c=result.changed;$('#outlook-title').textContent=`YOUR WEEK, THROUGH ${plan.iterations.toLocaleString()} POSSIBLE VERSIONS`;
  $('#baseline-score').textContent=pct(b.allOnTime);$('#changed-score').textContent=pct(c.allOnTime);
  $('#before-line').style.width=`${b.allOnTime*100}%`;$('#after-line').style.width=`${c.allOnTime*100}%`;
  $('#probability-track').setAttribute('aria-label',`${pct(b.allOnTime)} current chance, ${pct(c.allOnTime)} with change`);
  const delta=Math.round(result.deltaAllOnTime*1000)/10;
  $('#uplift').textContent=`${delta>0?'+':''}${delta} percentage points`;
  $('#confidence').textContent=`Simulation sampling interval (95%): current ${wilson(b.allOnTime,plan.iterations)} · changed ${wilson(c.allOnTime,plan.iterations)}. This does not include uncertainty in your estimates.`;
  const worst=[...b.byTask].sort((a,b)=>a.onTime-b.onTime)[0],task=plan.tasks.find(t=>t.id===worst.id);
  $('#story-title').textContent=b.allOnTime===1?'Room to breathe.':b.optimisticMisses.length?'This plan needs more room.':'Hours aren’t the whole story.';
  $('#story').textContent=b.optimisticMisses.length?`Even the best-duration schedule misses ${plan.tasks.filter(t=>b.optimisticMisses.includes(t.id)).map(t=>t.title).join(', ')} under this policy. Change scope, capacity or deadlines.`:b.allOnTime===1?'Every simulated week met its deadlines. Keep the assumptions honest: interruptions and shared bad days are outside this model.':`“${task.title}” meets its deadline in ${pct(worst.onTime)} of simulated weeks. ${task.dependencies.length?'It must wait for earlier work, so spare time later cannot rescue an earlier deadline.':'A weekly total hides the pressure on individual days.'}`;
  $('#hours-stat').textContent=`${hours(b.totalLikely)}h / ${hours(b.available)}h`;
  $('#start-date').value=plan.startDate;$('#seed').value=plan.seed;
  if(![...$('#iterations').options].some(x=>Number(x.value)===plan.iterations))$('#iterations').add(new Option(plan.iterations.toLocaleString(),String(plan.iterations)));
  $('#iterations').value=plan.iterations;
  $$('[data-change]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.change===change.type)));
  $$('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view===view)));
  $('#undo').hidden=!undo;$('#add-task').disabled=plan.tasks.length>=12;
  if(fields)renderChangeFields();
  let explanation='';
  if(change.type==='scope'){const t=plan.tasks.find(t=>t.id===change.taskId);explanation=`All three duration estimates for “${t.title}” decrease by ${change.percent}%. ${hours(t.likely)}h → ${hours(t.likely*(1-change.percent/100))}h likely. Everything else stays the same.`;}
  if(change.type==='capacity')explanation=`Add ${change.hours} hours on ${dateLabel(change.day)}. This increases the time budget; it does not make tasks faster.`;
  if(change.type==='earlier'){const t=plan.tasks.find(t=>t.id===change.taskId);explanation=`“${t.title}” becomes available ${change.days} day(s) earlier, no earlier than the first day. Prerequisites still have to finish. ${t.release===0?'This task already starts on day one, so this change has no effect.':''}`;}
  $('#change-explanation').textContent=explanation;
  renderWeek();renderTasks();persist();
}
function optionsTasks(){return plan.tasks.map(t=>`<option value="${esc(t.id)}"${t.id===change.taskId?' selected':''}>${esc(t.title)}</option>`).join('');}
function optionsDays(value){return Array.from({length:plan.days},(_,i)=>`<option value="${i}"${i===value?' selected':''}>${esc(dateLabel(i))}</option>`).join('');}
function renderChangeFields(){
  const target=change.type==='capacity'?`<label>The day you can make room<select id="change-day">${optionsDays(change.day)}</select></label>`:`<label>The task you can change<select id="change-task">${optionsTasks()}</select></label>`;
  const key=change.type==='scope'?'percent':change.type==='capacity'?'hours':'days',value=change[key],max=change.type==='scope'?60:change.type==='capacity'?6:plan.days-1,min=change.type==='capacity'?.5:1,step=change.type==='capacity'?.5:1;
  const label=change.type==='scope'?'Reduce the work by':change.type==='capacity'?'Extra available time':'Make it available';
  const unit=change.type==='scope'?'%':change.type==='capacity'?'h':' days earlier';
  $('#change-fields').innerHTML=target+`<label><span class="range-label">${label}<output id="change-amount" for="amount">${value}${unit}</output></span><input id="amount" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}"></label>`;
  $('#change-task')?.addEventListener('change',e=>{change.taskId=e.target.value;render(false);});
  $('#change-day')?.addEventListener('change',e=>{change.day=Number(e.target.value);render(false);});
  $('#amount').addEventListener('input',e=>{change[key]=Number(e.target.value);$('#change-amount').textContent=change[key]+unit;render(false);});
}
function renderWeek(){const r=view==='baseline'?result.baseline:result.changed,p=view==='baseline'?plan:result.changedPlan;
  $('#week-caption').textContent=`${view==='baseline'?'Current':'Changed'} plan · ${hours(r.available)} available hours · likely-duration example, not a guaranteed schedule`;
  $('#week').style.gridTemplateColumns=innerWidth>700?`repeat(${p.days},minmax(0,1fr))`:'';
  const maxCap=Math.max(...p.capacity,1),trackHeight=Math.max(180,maxCap*56);
  $('#week').innerHTML=Array.from({length:p.days},(_,i)=>{
    const segments=r.exampleSchedule.filter(s=>s.day===i),used=segments.reduce((s,n)=>s+n.hours,0),free=Math.max(0,p.capacity[i]-used);
    return`<article class="day" aria-label="${esc(dateLabel(i))}, ${hours(used)} hours planned of ${p.capacity[i]} available"><div class="day-heading"><b>${dayName(i).toUpperCase()}</b><span>${dayDate(i).getUTCDate()}</span></div><div class="day-track" style="height:${trackHeight}px">${segments.map(s=>{const t=p.tasks.find(t=>t.id===s.id);return`<div class="work-block${s.hours/maxCap*trackHeight<44?' short':''}" style="background:${color(t)};height:${s.hours/maxCap*100}%;--hours:${s.hours}" title="${esc(t.title)}: ${hours(s.hours)} hours"><span>${esc(t.title)}</span><small>${hours(s.hours)}h</small></div>`;}).join('')}${free>.01?`<div class="free-block" style="--free:${free};height:${free/maxCap*100}%" title="${hours(free)} available hours left">${hours(free)}h open</div>`:segments.length?'':`<div class="free-block" style="--free:1">${p.capacity[i]?'No task ready':'Day off'}</div>`}</div><div class="day-hours">${hours(used)} / ${p.capacity[i]}h planned</div><div class="day-due">${p.tasks.filter(t=>t.deadline===i).map(t=>`Due: ${esc(t.title)}`).join('<br>')}</div></article>`;
  }).join('');
}
function renderTasks(){
  $('#tasks').innerHTML=plan.tasks.map(t=>{const b=result.baseline.byTask.find(x=>x.id===t.id),c=result.changed.byTask.find(x=>x.id===t.id),deps=t.dependencies.map(id=>plan.tasks.find(x=>x.id===id).title);
    return`<div class="task-row"><div class="task-title"><span class="task-color" style="background:${color(t)}"></span><div><strong>${esc(t.title)}</strong><small>${deps.length?'After '+esc(deps.join(' + ')):'No prerequisites'} · starts ${dayName(t.release)}</small></div></div><div class="task-duration">${hours(t.optimistic)} <b>${hours(t.likely)}</b> ${hours(t.pessimistic)}</div><div class="task-deadline">${dateLabel(t.deadline)}</div><div class="task-prob"><span class="${b.onTime<.8?'low':'high'}">${pct(b.onTime)}</span><span class="arrow" aria-hidden="true">→</span><span class="${c.onTime<.8?'low':'high'}">${pct(c.onTime)}</span></div><button class="edit-task" data-edit="${esc(t.id)}" aria-label="Edit ${esc(t.title)}">↗</button></div>`;
  }).join('');
  $$('[data-edit]').forEach(el=>el.addEventListener('click',()=>openTask(el.dataset.edit)));
}
function openTask(id){editing=id;const t=plan.tasks.find(t=>t.id===id)||{title:'',optimistic:1,likely:2,pessimistic:3,release:0,deadline:plan.days-1,dependencies:[]};
  $('#dialog-title').textContent=id?'Edit task':'Make room for a task';
  const f=$('#task-form');for(const k of ['title','optimistic','likely','pessimistic'])f.elements[k].value=t[k];
  f.elements.release.innerHTML=optionsDays(t.release);f.elements.deadline.innerHTML=optionsDays(t.deadline);
  $('#dependency-options').innerHTML=plan.tasks.filter(x=>x.id!==id).map(x=>`<label><input type="checkbox" name="dependency" value="${esc(x.id)}"${t.dependencies.includes(x.id)?' checked':''}>${esc(x.title)}</label>`).join('')||'No other tasks yet.';
  $('#delete-task').hidden=!id;$('#task-error').textContent='';$('#task-dialog').showModal();f.elements.title.focus();
}
$('#task-form').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,d=new FormData(f),newPlan=structuredClone(plan);let id=editing;
  if(!id){let n=1;while(newPlan.tasks.some(t=>t.id===`task-${n}`))n++;id=`task-${n}`;}
  const existing=plan.tasks.find(t=>t.id===id),t={id,title:d.get('title').trim(),optimistic:Number(d.get('optimistic')),likely:Number(d.get('likely')),pessimistic:Number(d.get('pessimistic')),release:Number(d.get('release')),deadline:Number(d.get('deadline')),dependencies:d.getAll('dependency'),color:existing?.color||palette[newPlan.tasks.length%palette.length]};
  if(editing)newPlan.tasks[newPlan.tasks.findIndex(t=>t.id===id)]=t;else newPlan.tasks.push(t);
  const issues=validatePlan(newPlan);if(issues.length){$('#task-error').textContent=issues.map(x=>x.message).join(' ');return;}
  try{compare(newPlan,change);}catch(err){$('#task-error').textContent=err.message+' Adjust the comparison before saving.';return;}
  undo={plan:structuredClone(plan),change:structuredClone(change)};plan=newPlan;$('#task-dialog').close();render();notify('Task saved. The simulations now use your updated assumptions.');
});
$('#delete-task').addEventListener('click',()=>{
  if(plan.tasks.length===1){$('#task-error').textContent='Keep at least one task in your plan.';return;}
  const dependent=plan.tasks.filter(t=>t.dependencies.includes(editing));if(dependent.length){$('#task-error').textContent=`Remove this prerequisite from ${dependent.map(t=>t.title).join(', ')} before deleting it.`;return;}
  undo={plan:structuredClone(plan),change:structuredClone(change)};plan.tasks=plan.tasks.filter(t=>t.id!==editing);if(change.taskId===editing)change.taskId=plan.tasks[0].id;$('#task-dialog').close();render();notify('Task deleted. Undo is available in the comparison card.');
});
$$('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
$('#add-task').addEventListener('click',()=>openTask(null));
$$('[data-change]').forEach(el=>el.addEventListener('click',()=>{change=el.dataset.change==='scope'?{type:'scope',taskId:plan.tasks.find(t=>t.id==='draft')?.id||plan.tasks[0].id,percent:30}:el.dataset.change==='capacity'?{type:'capacity',day:Math.min(2,plan.days-1),hours:2}:{type:'earlier',taskId:plan.tasks.find(t=>t.release>0)?.id||plan.tasks[0].id,days:1};render();}));
$$('[data-view]').forEach(el=>el.addEventListener('click',()=>{view=el.dataset.view;render(false);}));
$('#apply').addEventListener('click',()=>{undo={plan:structuredClone(plan),change:structuredClone(change)};plan=structuredClone(result.changedPlan);view='baseline';render();notify('Change applied to your current plan. The comparison now explores one further change. Undo is available.');});
$('#undo').addEventListener('click',()=>{if(!undo)return;({plan,change}=undo);undo=null;render();notify('Previous plan restored.');});
$('#capacity-edit').addEventListener('click',()=>{$('#capacity-fields').innerHTML=plan.capacity.map((h,i)=>`<label class="capacity-row"><span>${esc(dateLabel(i))}</span><input name="day-${i}" type="number" min="0" max="16" step=".5" value="${h}" aria-label="Available hours ${esc(dateLabel(i))}" required></label>`).join('');$('#capacity-error').textContent='';$('#capacity-dialog').showModal();});
$('#capacity-form').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target),p=structuredClone(plan);p.capacity=p.capacity.map((_,i)=>Number(d.get(`day-${i}`)));try{compare(p,change);}catch(err){$('#capacity-error').textContent=err.message;return;}undo={plan:structuredClone(plan),change:structuredClone(change)};plan=p;$('#capacity-dialog').close();render();notify('Available hours updated.');});
$('#start-date').addEventListener('change',e=>{const p={...plan,startDate:e.target.value};const issues=validatePlan(p);if(issues.length){error(issues.map(x=>x.message).join(' '));return;}plan=p;render();});
$('#seed').addEventListener('change',e=>{const p={...plan,seed:Number(e.target.value)};const issues=validatePlan(p);if(issues.length){error(issues.map(x=>x.message).join(' '));return;}plan=p;render(false);});
$('#iterations').addEventListener('change',e=>{plan.iterations=Number(e.target.value);render(false);});
$('#export').addEventListener('click',()=>{const blob=new Blob([exportReplay(plan,change)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`daylight-${plan.startDate}-seed-${plan.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Replay exported: input assumptions, one change, seed and engine version. Results are recomputed on import.');});
$('#import').addEventListener('click',()=>$('#file').click());
$('#file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw new Error('Choose a Daylight JSON file under 100 KB.');const r=importReplay(await f.text());undo={plan:structuredClone(plan),change:structuredClone(change)};plan=r.plan;change=r.change;render();notify('Replay imported. Results have been recomputed locally from its inputs.');}catch(err){error('Import rejected: '+err.message);}e.target.value='';});
$('#example').addEventListener('click',()=>{undo={plan:structuredClone(plan),change:structuredClone(change)};plan=structuredClone(SAMPLE_PLAN);change={type:'scope',taskId:'draft',percent:30};view='baseline';render();notify('Original synthetic example restored. Your previous plan is available with Undo.');});
let storageIssue='';try{const saved=localStorage.getItem('daylight-v1');if(saved)({plan,change}=importReplay(saved));}catch{storageIssue='Saved browser data could not be read. The original example is loaded; export a replay to keep changes.';}
render();if(storageIssue)notify(storageIssue);
let sizeTimer;addEventListener('resize',()=>{clearTimeout(sizeTimer);sizeTimer=setTimeout(renderWeek,100);});
