// Original Daylight simulation engine. No learned model or external service.
export const SAMPLE_PLAN = {
  version: 1, title: 'A little room to breathe', startDate: '2026-09-21', days: 7,
  seed: 37, iterations: 1600, capacity: [2, 3, 2, 3, 2, 3, 2],
  tasks: [
    {id:'reading',title:'Read & annotate',optimistic:1,likely:2,pessimistic:3,deadline:1,release:0,dependencies:[],color:'#bc714e'},
    {id:'outline',title:'Shape the argument',optimistic:.5,likely:1,pessimistic:1.5,deadline:2,release:0,dependencies:['reading'],color:'#ae8b47'},
    {id:'draft',title:'Write the essay',optimistic:3,likely:4.5,pessimistic:7,deadline:4,release:0,dependencies:['outline'],color:'#537667'},
    {id:'problems',title:'Finish problem set',optimistic:2,likely:3,pessimistic:4,deadline:3,release:1,dependencies:[],color:'#6b80a5'},
    {id:'revise',title:'Revise & submit',optimistic:.5,likely:1,pessimistic:2,deadline:4,release:0,dependencies:['draft'],color:'#718948'},
    {id:'slides',title:'Build seminar slides',optimistic:1,likely:2,pessimistic:3,deadline:6,release:2,dependencies:['reading'],color:'#9e7696'}
  ]
};
export function validatePlan(p) {
  const e=[]; const add=(field,message)=>e.push({field,message});
  if(!p||typeof p!=='object'||Array.isArray(p)) return [{field:'plan',message:'Choose a Daylight plan object.'}];
  if(p.version!==1) add('version','This file is not a version 1 Daylight plan.');
  if(typeof p.title!=='string'||p.title.length>100) add('title','Use a title of up to 100 characters.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate??'')||!Number.isFinite(Date.parse(p.startDate+'T12:00:00Z'))||new Date(p.startDate+'T12:00:00Z').toISOString().slice(0,10)!==p.startDate) add('startDate','Choose a valid calendar date.');
  if(!Number.isInteger(p.days)||p.days<3||p.days>14) add('days','Use 3–14 days.');
  if(!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295) add('seed','Seed must be a whole number from 0 to 4294967295.');
  if(!Number.isInteger(p.iterations)||p.iterations<100||p.iterations>5000) add('iterations','Use 100–5000 simulations.');
  if(!Array.isArray(p.capacity)||p.capacity.length!==p.days||p.capacity.some(x=>!Number.isFinite(x)||x<0||x>16)) add('capacity','Set 0–16 available hours for every day.');
  if(!Array.isArray(p.tasks)||p.tasks.length<1||p.tasks.length>12) {add('tasks','Use 1–12 tasks.');return e;}
  const ids=new Set();
  p.tasks.forEach((t,i)=>{
    if(!t||typeof t!=='object') {add('tasks','Each task must be an object.');return;}
    if(typeof t.id!=='string'||!/^[-a-zA-Z0-9_]{1,40}$/.test(t.id)||ids.has(t.id)) add('tasks','Every task needs a unique simple ID.');
    ids.add(t.id);
    if(typeof t.title!=='string'||!t.title.trim()||t.title.length>80) add(t.id,'Give each task a name of 1–80 characters.');
    if(![t.optimistic,t.likely,t.pessimistic].every(x=>Number.isFinite(x)&&x>=.1&&x<=100)||t.optimistic>t.likely||t.likely>t.pessimistic) add(t.id,'Hours must satisfy 0.1 ≤ best ≤ likely ≤ worst ≤ 100.');
    if(!Number.isInteger(t.deadline)||!Number.isInteger(t.release)||t.release<0||t.deadline<t.release||t.deadline>=p.days) add(t.id,'Start and deadline must be inside the plan, with start no later than deadline.');
    if(!Array.isArray(t.dependencies)||t.dependencies.length>12||new Set(t.dependencies).size!==t.dependencies.length) add(t.id,'Dependencies must be a list without duplicates.');
  });
  if(e.length) return e;
  for(const t of p.tasks) for(const d of t.dependencies) if(!ids.has(d)||d===t.id) add(t.id,'A dependency is missing or refers to the task itself.');
  if(e.length) return e;
  const done=new Set(),visiting=new Set(),map=new Map(p.tasks.map(t=>[t.id,t]));
  function visit(id) {if(visiting.has(id)){add(id,'Dependency cycle: these tasks wait for each other.');return;}if(done.has(id))return;visiting.add(id);map.get(id).dependencies.forEach(visit);visiting.delete(id);done.add(id);}
  p.tasks.forEach(t=>visit(t.id));
  if(e.length)return e;
  function latestRelease(id){const t=map.get(id);return Math.max(t.release,...t.dependencies.map(latestRelease));}
  for(const t of p.tasks)if(latestRelease(t.id)>t.deadline)add(t.id,`Impossible dependency timing: ${t.title} waits for work that cannot start until after its deadline.`);
  return e;
}
export function assertPlan(p){const e=validatePlan(p);if(e.length)throw new Error(e.map(x=>x.message).join(' '));}
function uniform(seed,iteration,id){let h=(seed^(iteration+1)*2654435761)>>>0;for(let i=0;i<id.length;i++){h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;}h+=0x6D2B79F5;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;}
export function sampledHours(t,seed,iteration){const a=t.optimistic,b=t.pessimistic,c=t.likely;if(a===b)return a;const u=uniform(seed,iteration,t.id),split=(c-a)/(b-a);return u<split?a+Math.sqrt(u*(b-a)*(c-a)):b-Math.sqrt((1-u)*(b-a)*(b-c));}
export function schedule(p,durations){
  // One student's preemptible work. Earliest downstream deadline guides ready tasks.
  const priority=Object.fromEntries(p.tasks.map(t=>[t.id,t.deadline]));
  for(let n=0;n<p.tasks.length;n++)for(const t of p.tasks)for(const d of t.dependencies)priority[d]=Math.min(priority[d],priority[t.id]);
  const order=[...p.tasks].sort((a,b)=>priority[a.id]-priority[b.id]||a.deadline-b.deadline||(a.id<b.id?-1:a.id>b.id?1:0));
  const left={...durations},finished=Object.create(null),segments=[];
  for(let day=0;day<p.days;day++){
    let used=0;
    while(used<p.capacity[day]-1e-9){
      const t=order.find(t=>left[t.id]>1e-9&&t.release<=day&&t.dependencies.every(d=>finished[d]!==undefined));
      if(!t)break;
      const amount=Math.min(left[t.id],p.capacity[day]-used);
      segments.push({id:t.id,day,hours:amount,start:used,end:used+amount});used+=amount;left[t.id]-=amount;
      if(left[t.id]<=1e-9)finished[t.id]=day+used/p.capacity[day];
    }
  }
  return{finished,segments};
}
function quantile(a,q){const s=[...a].sort((x,y)=>x-y);return s[Math.floor((s.length-1)*q)];}
export function simulate(p){
  assertPlan(p);const completed=Object.fromEntries(p.tasks.map(t=>[t.id,[]])),counts=Object.fromEntries(p.tasks.map(t=>[t.id,0]));let all=0;
  for(let n=0;n<p.iterations;n++){
    const durations=Object.fromEntries(p.tasks.map(t=>[t.id,sampledHours(t,p.seed,n)]));
    const {finished}=schedule(p,durations);let ok=true;
    for(const t of p.tasks){const f=finished[t.id]??Infinity;completed[t.id].push(f);if(f<=t.deadline+1+1e-9)counts[t.id]++;else ok=false;}if(ok)all++;
  }
  const likely=schedule(p,Object.fromEntries(p.tasks.map(t=>[t.id,t.likely])));
  const optimistic=schedule(p,Object.fromEntries(p.tasks.map(t=>[t.id,t.optimistic])));
  return{iterations:p.iterations,seed:p.seed,allOnTime:all/p.iterations,
    byTask:p.tasks.map(t=>({id:t.id,onTime:counts[t.id]/p.iterations,completion:{p10:quantile(completed[t.id],.1),p50:quantile(completed[t.id],.5),p90:quantile(completed[t.id],.9)},unfinished:completed[t.id].filter(x=>!Number.isFinite(x)).length/p.iterations})),
    exampleSchedule:likely.segments,likelyFinished:likely.finished,
    optimisticMisses:p.tasks.filter(t=>(optimistic.finished[t.id]??Infinity)>t.deadline+1+1e-9).map(t=>t.id),
    totalLikely:p.tasks.reduce((s,t)=>s+t.likely,0),available:p.capacity.reduce((s,n)=>s+n,0)};
}
export function applyChange(p,c){
  assertPlan(p);const changed=structuredClone(p);
  if(c.type==='capacity') {if(!Number.isInteger(c.day)||c.day<0||c.day>=p.days||!Number.isFinite(c.hours)||c.hours<=0||c.hours>8)throw new Error('Choose a valid day and 0–8 extra hours.');changed.capacity[c.day]+=c.hours;}
  else {const t=changed.tasks.find(t=>t.id===c.taskId);if(!t)throw new Error('Choose a task that exists.');
    if(c.type==='scope'){if(!Number.isFinite(c.percent)||c.percent<=0||c.percent>75)throw new Error('Scope cut must be 1–75%.');for(const k of ['optimistic','likely','pessimistic'])t[k]*=1-c.percent/100;}
    else if(c.type==='earlier'){if(!Number.isInteger(c.days)||c.days<1||c.days>14)throw new Error('Choose 1–14 days earlier.');t.release=Math.max(0,t.release-c.days);}
    else throw new Error('Unknown change.');
  }assertPlan(changed);return changed;
}
export function compare(p,c){const changedPlan=applyChange(p,c),baseline=simulate(p),changed=simulate(changedPlan);return{baseline,changed,changedPlan,intervention:structuredClone(c),deltaAllOnTime:changed.allOnTime-baseline.allOnTime};}
export function exportReplay(plan,change){assertPlan(plan);applyChange(plan,change);return JSON.stringify({format:'daylight-replay',version:1,engine:'1.0.0',plan,change},null,2);}
export function importReplay(text){if(typeof text!=='string'||text.length>100000)throw new Error('Choose a Daylight JSON file under 100 KB.');const r=JSON.parse(text);if(r.format!=='daylight-replay'||r.version!==1||r.engine!=='1.0.0')throw new Error('This replay needs Daylight engine 1.0.0.');assertPlan(r.plan);applyChange(r.plan,r.change);return{plan:structuredClone(r.plan),change:structuredClone(r.change)};}
