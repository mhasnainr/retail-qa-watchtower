/* Domain rules shared by the browser and the reproducible Node test suite. */
(function(root,factory){
  const data = typeof module==='object' && module.exports ? require('./data.js') : root.WatchtowerData;
  const api=factory(data);
  if(typeof module==='object' && module.exports) module.exports=api; else root.WatchtowerCore=api;
})(typeof globalThis==='object'?globalThis:this,function(Data){
  'use strict';
  const ZONES=['America/New_York','America/Chicago','America/Los_Angeles','Asia/Karachi','UTC'];
  const STATUS=['Open','Escalated','Resolved'];
  const EVIDENCE=['Needs verification','Corroborated by records','No deviation found'];
  const KINDS=['Inventory movement','Customer transaction','Staff procedure','Branch exit','Operational task','Other'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const text=(s,min,max,label)=>assert(typeof s==='string'&&s.trim().length>=min&&s.length<=max,`${label}: enter ${min}–${max} nonblank characters.`);
  const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
  function localTime(instant,zone){
    assert(ZONES.includes(zone),'Choose a supported timezone.');
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  }
  function toInstant(local,zone){
    assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local),'Enter a complete observation date and time.');
    assert(ZONES.includes(zone),'Choose a supported timezone.');
    const naive=Date.parse(local+':00.000Z');
    assert(Number.isFinite(naive)&&new Date(naive).toISOString().slice(0,16)===local,'Enter a valid calendar date and time.');
    const found=new Set();
    for(let h=-36;h<=36;h+=6){
      const sample=naive+h*3600000;
      const offset=Date.parse(localTime(sample,zone)+'Z')-sample;
      const candidate=naive-offset;
      if(localTime(candidate,zone).slice(0,16)===local)found.add(candidate);
    }
    assert(found.size!==0,'This local time does not exist because of a daylight-saving clock change. Choose a valid time.');
    assert(found.size===1,'This local time occurs twice at a daylight-saving clock change. Enter the equivalent UTC time and choose UTC.');
    return new Date([...found][0]).toISOString();
  }
  function validDate(day){try{return /^\d{4}-\d{2}-\d{2}$/.test(day)&&new Date(day+'T00:00:00.000Z').toISOString().slice(0,10)===day;}catch{return false;}}
  function seed(){return {incidents:clone(Data.incidents),tasks:clone(Data.tasks),settings:clone(Data.settings),generation:'initial',conflicts:[]};}
  function refs(values,store,required=false){
    assert(Array.isArray(values),'Evidence references must be a list.');
    assert(!required||values.length>0,'Select at least one supporting record before qualifying or closing a case.');
    assert(new Set(values).size===values.length,'Evidence references must be unique.');
    assert(values.every(id=>Data.records.some(r=>r.id===id&&r.store===store)),'Choose supporting records from the same demo store.');
  }
  function validHistory(h){return Array.isArray(h)&&h.length>0&&h.every(x=>iso(x.at)&&typeof x.actor==='string'&&x.actor.trim().length>=2&&typeof x.note==='string'&&typeof x.action==='string'&&typeof x.from==='string'&&typeof x.to==='string');}
  function validateIncident(x){
    assert(x&&typeof x==='object','Invalid incident record.');
    text(x.id,3,100,'Incident ID');assert(/^OBS-[A-Za-z0-9-]+$/.test(x.id),'Invalid incident ID.');
    assert(Data.stores.some(s=>s.id===x.store),'Choose a valid demo store.');text(x.camera,1,60,'Camera/source');
    assert(iso(x.observedAt)&&iso(x.createdAt)&&iso(x.updatedAt),'Incident timestamps must be valid UTC instants.');assert(ZONES.includes(x.timeZone),'Invalid observation timezone.');
    assert(KINDS.includes(x.kind)&&['Low','Medium','High'].includes(x.priority),'Invalid category or priority.');
    assert(STATUS.includes(x.status)&&EVIDENCE.includes(x.confidence),'Invalid workflow or evidence state.');
    text(x.observed,12,4000,'Observable facts');text(x.verify,8,2000,'Next action');text(x.createdBy,2,80,'Recorder');
    assert(Number.isInteger(x.version)&&x.version>=1,'Invalid incident version.');
    for(const k of ['reviewer','finding','disposition','assignedTo','resolvedAt'])assert(typeof x[k]==='string'&&x[k].length<=4000,`Invalid ${k}.`);
    const reviewed=x.confidence!=='Needs verification'||x.status==='Resolved';refs(x.evidenceRefs,x.store,reviewed);
    if(reviewed){text(x.reviewer,2,80,'Reviewer');text(x.finding,12,2000,'Verification finding');}
    if(x.status==='Escalated')text(x.assignedTo,2,100,'Escalation recipient');
    if(x.status==='Resolved'){assert(x.confidence!=='Needs verification','Qualify the evidence before resolving the incident.');text(x.disposition,12,2000,'Resolution outcome');assert(iso(x.resolvedAt),'A resolution timestamp is required.');}
    else assert(x.resolvedAt==='','Unresolved cases cannot have a resolution timestamp.');
    assert(validHistory(x.history),'A valid attributed history is required.');
    assert(Array.isArray(x.corrections)&&x.corrections.every(c=>iso(c.at)&&typeof c.actor==='string'&&typeof c.note==='string'),'Invalid correction history.');
    return x;
  }
  function validateTask(x){
    assert(x&&Data.tasks.some(t=>t.id===x.id)&&Data.stores.some(s=>s.id===x.store),'Invalid task record.');
    text(x.type,2,100,'Task type');text(x.question,8,1000,'Review question');assert(['Pending','Needs escalation','Reviewed'].includes(x.status),'Invalid task status.');
    assert(Number.isInteger(x.version)&&x.version>=1&&iso(x.updatedAt),'Invalid task version/time.');
    refs(x.evidenceRefs,x.store,x.status!=='Pending');
    for(const k of ['reviewer','finding','assignedTo'])assert(typeof x[k]==='string'&&x[k].length<=2000,`Invalid task ${k}.`);
    if(x.status!=='Pending'){text(x.reviewer,2,80,'Reviewer');text(x.finding,12,2000,'Review result');assert(validHistory(x.history),'Task review history is required.');}
    else assert(Array.isArray(x.history),'Invalid task history.');
    if(x.status==='Needs escalation')text(x.assignedTo,2,100,'Escalation recipient');
    return x;
  }
  function validateSettings(s){text(s.analyst,0,80,'Prepared by');assert(validDate(s.reportDate),'Choose a valid reporting date.');assert(ZONES.includes(s.reportZone),'Choose a valid reporting timezone.');return s;}
  function createIncident(fields,id,at){
    const x={...clone(fields),id,version:1,createdAt:at,updatedAt:at,status:'Open',resolvedAt:'',disposition:'',assignedTo:'',corrections:[],history:[{at,actor:fields.createdBy,action:'Created',note:'Recorded observation. '+fields.verify,from:'',to:'Open'}]};
    return validateIncident(x);
  }
  function reviewIncident(current,patch,at){
    text(patch.actor,2,80,'Reviewer');text(patch.reason,12,2000,'Update reason / result');
    const x={...clone(current),status:patch.status,confidence:patch.confidence,evidenceRefs:clone(patch.evidenceRefs),reviewer:patch.actor,finding:patch.finding.trim(),disposition:patch.disposition.trim(),assignedTo:patch.assignedTo.trim(),priority:patch.priority,version:current.version+1,updatedAt:at,resolvedAt:patch.status==='Resolved'?at:''};
    x.history.push({at,actor:patch.actor,action:patch.status==='Open'&&current.status==='Resolved'?'Reopened':'Reviewed',note:patch.reason.trim()+` Evidence: ${current.confidence} → ${x.confidence}. Records: ${x.evidenceRefs.join(', ')||'None'}. Priority: ${current.priority} → ${x.priority}. Finding: ${x.finding||'Pending'}. Disposition: ${x.disposition||'Unresolved'}.`,from:current.status,to:x.status});
    if(patch.correction&&patch.correction.trim()){text(patch.correction,12,2000,'Correction note');x.corrections.push({at,actor:patch.actor,note:patch.correction.trim()});}
    return validateIncident(x);
  }
  function reviewTask(current,patch,at){
    text(patch.actor,2,80,'Reviewer');text(patch.finding,12,2000,'Review result / reason');
    const x={...clone(current),status:patch.status,reviewer:patch.actor,finding:patch.finding.trim(),assignedTo:patch.assignedTo.trim(),evidenceRefs:clone(patch.evidenceRefs),updatedAt:at,version:current.version+1};
    x.history.push({at,actor:patch.actor,action:'Reviewed',note:patch.finding.trim(),from:current.status,to:x.status});return validateTask(x);
  }
  function validateEvent(e){
    assert(e&&typeof e==='object'&&typeof e.id==='string'&&/^[A-Za-z0-9-]+$/.test(e.id),'Invalid journal event ID.');
    assert(Number.isSafeInteger(e.order)&&e.order>0&&iso(e.at)&&typeof e.generation==='string','Invalid journal order or timestamp.');
    assert(['create','incidentReview','taskReview','settings','reset','legacy'].includes(e.type),'Invalid journal event type.');
    if(e.type==='create'||e.type==='incidentReview')validateIncident(e.payload);
    if(e.type==='taskReview')validateTask(e.payload);
    if(e.type==='settings')validateSettings(e.payload);
    if(e.type==='legacy'){assert(Array.isArray(e.payload.incidents)&&Array.isArray(e.payload.tasks),'Invalid migration data.');e.payload.incidents.forEach(validateIncident);e.payload.tasks.forEach(validateTask);}
    if(e.type==='incidentReview'||e.type==='taskReview')assert(Number.isInteger(e.expectedVersion)&&e.expectedVersion>0,'Missing prior record version.');
    return e;
  }
  function replay(events){
    let s=seed();
    const sorted=events.slice().sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
    for(const e of sorted){
      validateEvent(e);
      if(e.type==='reset'){s=seed();s.generation=e.id;continue;}
      if(e.generation!==s.generation){s.conflicts.push({event:e.id,reason:'An update belongs to an earlier reset generation and was not applied.'});continue;}
      if(e.type==='legacy'){s.incidents=clone(e.payload.incidents);s.tasks=clone(e.payload.tasks);continue;}
      if(e.type==='settings'){s.settings=clone(e.payload);continue;}
      if(e.type==='create'){
        if(s.incidents.some(x=>x.id===e.payload.id))s.conflicts.push({event:e.id,reason:'Duplicate incident ID was not applied.'});
        else s.incidents.push(clone(e.payload));continue;
      }
      const collection=e.type==='incidentReview'?s.incidents:s.tasks;
      const i=collection.findIndex(x=>x.id===e.payload.id);
      if(i<0||collection[i].version!==e.expectedVersion||e.payload.version!==e.expectedVersion+1){s.conflicts.push({event:e.id,reason:'Concurrent or stale review was not applied. Reopen the record and compare the latest history.'});continue;}
      collection[i]=clone(e.payload);
    }
    return s;
  }
  function period(state,settings=state.settings){
    validateSettings(settings);
    const begin=Date.parse(toInstant(settings.reportDate+'T00:00',settings.reportZone));
    const next=new Date(Date.parse(settings.reportDate+'T00:00:00.000Z')+86400000).toISOString().slice(0,10);
    const end=Date.parse(toInstant(next+'T00:00',settings.reportZone));
    const current=state.incidents.filter(x=>Date.parse(x.observedAt)>=begin&&Date.parse(x.observedAt)<end);
    const carry=state.incidents.filter(x=>Date.parse(x.observedAt)<begin&&x.status!=='Resolved');
    const weights={High:0,Medium:1,Low:2};
    const included=[...carry,...current].sort((a,b)=>weights[a.priority]-weights[b.priority]||a.observedAt.localeCompare(b.observedAt)||a.id.localeCompare(b.id));
    return {begin:new Date(begin).toISOString(),end:new Date(end).toISOString(),current,carry,included,excluded:state.incidents.length-included.length};
  }
  function report(state,at=new Date().toISOString()){
    const p=period(state),s=state.settings;
    const entries=p.included.map(x=>`${x.id} | ${x.priority} | ${x.status} | ${x.store} | ${x.camera}\nScope: ${p.carry.some(c=>c.id===x.id)?'Carry-over unresolved':'Observed in reporting day'}\nObserved: ${localTime(x.observedAt,x.timeZone).replace('T',' ')} ${x.timeZone} | UTC: ${x.observedAt}\nRecorded: ${x.createdAt} by ${x.createdBy}\nFacts: ${x.observed}\nNext action: ${x.verify}\nEvidence state: ${x.confidence}\nSupporting records: ${x.evidenceRefs.join(', ')||'Not yet supplied'}\nReviewer: ${x.reviewer||'Not yet reviewed'}\nFinding: ${x.finding||'Pending verification'}\nAssigned / escalation recipient: ${x.assignedTo||'Not assigned'}\nDisposition: ${x.disposition||'Not resolved'}\nResolved at: ${x.resolvedAt||'Not resolved'}\nCorrections: ${x.corrections.map(c=>c.note+' ('+c.actor+', '+c.at+')').join('; ')||'None'}\nHistory: ${x.history.length} attributed entries; complete history is available in the register and JSON backup.`);
    return `RETAIL QA WATCHTOWER — DAILY HANDOVER\n${Data.classification}\nPrepared: ${at}\nPrepared by: ${s.analyst.trim()||'Not specified'}\nReporting day: ${s.reportDate} (${s.reportZone})\nPeriod: ${p.begin} inclusive to ${p.end} exclusive\n\n1. REPORTING SCOPE\nObserved in reporting day: ${p.current.length}\nCarry-over unresolved: ${p.carry.length}\nIncluded incidents: ${p.included.length}\nOpen: ${p.included.filter(x=>x.status==='Open').length} | Escalated: ${p.included.filter(x=>x.status==='Escalated').length} | Resolved: ${p.included.filter(x=>x.status==='Resolved').length}\nExcluded historical-resolved or future-dated incidents: ${p.excluded}\nAll-time register total (context only): ${state.incidents.length}\nAll included incidents appear below; no truncation.\n\n2. INCIDENTS (HIGH PRIORITY FIRST)\n${entries.join('\n\n')||'No incidents in scope.'}\n\n3. ADMINISTRATIVE QUEUE — CURRENT SNAPSHOT, NOT DAILY THROUGHPUT\nPending: ${state.tasks.filter(t=>t.status==='Pending').length} | Needs escalation: ${state.tasks.filter(t=>t.status==='Needs escalation').length} | Reviewed: ${state.tasks.filter(t=>t.status==='Reviewed').length}\n${state.tasks.map(t=>`${t.id} | ${t.store} | ${t.type} | ${t.status}\nQuestion: ${t.question}\nRecords: ${t.evidenceRefs.join(', ')}\nResult: ${t.finding||'Not reviewed'}\nReviewer: ${t.reviewer||'Not assigned'} | Recipient: ${t.assignedTo||'Not assigned'} | Updated: ${t.updatedAt}`).join('\n\n')}\n\n4. HANDOVER CONTROL\nApply only the fictional training rules supplied with this demo. Actual company procedures and escalation timings are unknown. Observations do not establish intent. No real footage, people or company data are used.\nJournal conflicts requiring review: ${state.conflicts.length}\n`;
  }
  const INCIDENT_COLUMNS=['id','observed_at_utc','observation_timezone','created_at_utc','created_by','store','camera','category','priority','evidence_state','observable_facts','next_action','evidence_references','reviewer','verification_finding','workflow_status','assigned_to','resolution_outcome','resolved_at_utc','updated_at_utc','version','corrections','history'];
  function incidentRows(state){return [INCIDENT_COLUMNS,...state.incidents.map(x=>[x.id,x.observedAt,x.timeZone,x.createdAt,x.createdBy,x.store,x.camera,x.kind,x.priority,x.confidence,x.observed,x.verify,x.evidenceRefs.join('; '),x.reviewer,x.finding,x.status,x.assignedTo,x.disposition,x.resolvedAt,x.updatedAt,x.version,JSON.stringify(x.corrections),JSON.stringify(x.history)])];}
  function taskRows(state){return [['id','store','type','review_question','status','supporting_records','reviewer','finding','escalation_recipient','updated_at_utc','version','history'],...state.tasks.map(t=>[t.id,t.store,t.type,t.question,t.status,t.evidenceRefs.join('; '),t.reviewer,t.finding,t.assignedTo,t.updatedAt,t.version,JSON.stringify(t.history)])];}
  function csvCell(value){let s=String(value??'');if(/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  const csv=rows=>'\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
  return {ZONES,STATUS,EVIDENCE,KINDS,clone,assert,text,iso,localTime,toInstant,validDate,seed,refs,validateIncident,validateTask,validateSettings,createIncident,reviewIncident,reviewTask,validateEvent,replay,period,report,INCIDENT_COLUMNS,incidentRows,taskRows,csvCell,csv};
});
