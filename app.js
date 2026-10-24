(function(){
  'use strict';
  const D=WatchtowerData,C=WatchtowerCore,$=id=>document.getElementById(id);
  const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const values=id=>Array.from($(id).selectedOptions).map(o=>o.value);
  let store,activeTab='desk',incidentEdit=null,taskEdit=null,printPrevious=null;
  const frames=D.scenarios.map(()=>0),timers=new Map();
  function options(id,items,selected){$(id).innerHTML=items.map(x=>`<option value="${safe(typeof x==='string'?x:x.value)}">${safe(typeof x==='string'?x:x.label)}</option>`).join('');if(selected!==undefined)$(id).value=selected;}
  function message(id,content,error=false){const el=$(id);el.textContent=content;el.classList.toggle('error',error);}
  function openTab(tab,focus=true){
    if(!$(tab)||!document.querySelector(`.nav [data-tab="${tab}"]`))return;
    activeTab=tab;document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==tab);
    document.querySelectorAll('.nav button').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(tab!=='desk')for(const [i,t]of timers){clearInterval(t);timers.delete(i);}
    if(tab==='report')refreshReport();
    if(focus)$(tab).querySelector('h2').focus();
  }
  function refsOptions(id,storeId,selected=[]){
    options(id,D.records.filter(r=>r.store===storeId).map(r=>({value:r.id,label:r.id+' · '+r.type})));
    Array.from($(id).options).forEach(o=>o.selected=selected.includes(o.value));
  }
  function checkForm(id){
    const form=$(id);let first;
    for(const el of form.querySelectorAll('input,textarea,select')){
      el.setCustomValidity('');el.removeAttribute('aria-invalid');
      if(el.required&&typeof el.value==='string'&&!el.value.trim())el.setCustomValidity('Enter a nonblank value.');
      if(!el.checkValidity()){el.setAttribute('aria-invalid','true');first ||= el;}
    }
    if(first){first.focus();throw new Error((form.querySelector(`label[for="${first.id}"]`)?.textContent||'Field')+': '+first.validationMessage);}
  }
  function nextUUID(){return crypto.randomUUID();}
  function updateBanner(state,journal){
    const notes=journal.issues.map(x=>x.reason);
    if(journal.temporary)notes.unshift('Temporary session: changes exist only in this tab. Export a JSON backup before closing.');
    if(state.conflicts.length)notes.push(`${state.conflicts.length} concurrent or pre-reset operation(s) were not applied. Export recovery data and compare the affected record histories.`);
    $('storageBanner').hidden=notes.length===0;$('storageBanner').textContent=notes.join(' ');
    $('persistenceStatus').textContent=journal.temporary?'Temporary session · export before closing':'Local operation journal · keep JSON backups';
    $('temporaryButton').hidden=journal.temporary||journal.issues.length===0;
    $('migrateButton').hidden=!journal.issues.some(x=>x.key==='qa-watchtower-v1');
  }
  function renderMetrics(state){
    const metrics=[['All-time observations',state.incidents.length],['Unresolved (open + escalated)',state.incidents.filter(x=>x.status!=='Resolved').length],['Pending task checks',state.tasks.filter(t=>t.status==='Pending').length],['Tasks needing escalation',state.tasks.filter(t=>t.status==='Needs escalation').length],['Qualified evidence records',state.incidents.filter(x=>x.confidence!=='Needs verification').length]];
    $('metrics').innerHTML=metrics.map(([label,n])=>`<div class="metric"><small>${safe(label)}</small><strong>${n}</strong></div>`).join('');
  }
  function renderHistory(id,history,corrections=[]){
    $(id).innerHTML=history.length?history.map(h=>`<div class="history-entry"><strong>${safe(h.action)} · ${safe(h.actor)}</strong><small> ${safe(h.at)} · ${safe(h.from)} → ${safe(h.to)}</small><p>${safe(h.note)}</p></div>`).join(''):'<p class="small">No review has been recorded yet.</p>';
    if(corrections.length)$(id).innerHTML+='<h4>Corrections (original retained)</h4>'+corrections.map(c=>`<div class="history-entry">${safe(c.at)} · ${safe(c.actor)}<p>${safe(c.note)}</p></div>`).join('');
  }
  function renderIncidents(state){
    $('incidentRows').innerHTML=state.incidents.slice().reverse().map(x=>`<tr><td><strong>${safe(x.id)}</strong><small>${safe(C.localTime(x.observedAt,x.timeZone).replace('T',' '))}<br>${safe(x.timeZone)}<br>UTC: ${safe(x.observedAt)}</small></td><td>${safe(x.store)} · ${safe(x.camera)}<p>${safe(x.observed)}</p><small>Next: ${safe(x.verify)}<br>Recorded by: ${safe(x.createdBy)}</small></td><td><span class="pill ${safe(x.priority)}">${safe(x.priority)}</span><br>${safe(x.confidence)}<small>Records: ${safe(x.evidenceRefs.join(', ')||'Not supplied')}<br>${safe(x.finding||'Verification pending')}</small></td><td><strong>${safe(x.status)}</strong><small>${safe(x.assignedTo||'No recipient assigned')}<br>${safe(x.disposition||'No resolution recorded')}<br>Version ${x.version} · ${x.history.length} history entries</small><button data-review="${safe(x.id)}">Review / history</button></td></tr>`).join('');
    $('incidentRows').querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>editIncident(b.dataset.review)));
    if(incidentEdit){const x=state.incidents.find(r=>r.id===incidentEdit.id);if(x)renderHistory('incidentHistory',x.history,x.corrections);}
  }
  function renderTasks(state){
    $('taskRows').innerHTML=state.tasks.map(t=>`<tr><td><strong>${safe(t.id)}</strong><small>${safe(t.store)}<br>${safe(t.type)}</small></td><td>${safe(t.question)}<small>Records: ${safe(t.evidenceRefs.join(', '))}</small><button data-evidence="${safe(t.evidenceRefs[0]||'')}">Inspect records</button></td><td><strong>${safe(t.status)}</strong><p>${safe(t.finding||'Not reviewed')}</p><small>Reviewer: ${safe(t.reviewer||'Not assigned')}<br>Recipient: ${safe(t.assignedTo||'Not assigned')}</small></td><td><button data-task="${safe(t.id)}">Review task</button></td></tr>`).join('');
    $('taskRows').querySelectorAll('[data-task]').forEach(b=>b.addEventListener('click',()=>editTask(b.dataset.task)));
    $('taskRows').querySelectorAll('[data-evidence]').forEach(b=>b.addEventListener('click',()=>showEvidence(b.dataset.evidence)));
    if(taskEdit){const t=state.tasks.find(x=>x.id===taskEdit.id);if(t)renderHistory('taskHistory',t.history);}
  }
  function syncSettings(state){
    // Never replace a report-settings draft while the analyst is editing it.
    if(document.activeElement.closest?.('#reportSettings'))return;
    $('analyst').value=state.settings.analyst;$('reportDate').value=state.settings.reportDate;$('reportZone').value=state.settings.reportZone;
  }
  function renderAll(state,journal){updateBanner(state,journal);renderMetrics(state);renderIncidents(state);renderTasks(state);syncSettings(state);refreshReport(state);}
  function refreshReport(state=store?.state){if(state)$('reportText').textContent=C.report(state);}
  function illustration(s,i){
    const f=frames[i],body=s.scene==='counter'?`<rect x="35" y="100" width="250" height="40" rx="6" fill="#395a72"/><rect x="160" y="58" width="90" height="38" rx="4" fill="#1c3947" stroke="#7bd8cf"/><text x="171" y="82" fill="#bff9ef" font-size="13">${f? '$200 − $80':'POS CHECK'}</text><circle cx="80" cy="65" r="14" fill="#aec3cc"/><path d="M80 80V100" stroke="#aec3cc" stroke-width="12"/>`:s.scene==='exit'?`<rect x="246" y="40" width="57" height="140" fill="#263f52" stroke="#c9e8cd"/><text x="251" y="33" font-size="11" fill="#c9e8cd">EXIT</text><path d="M272 40V185" stroke="#c9e8cd" stroke-dasharray="5 5"/><rect x="${110+f*65}" y="110" width="43" height="35" fill="#a9bbf3"/><text x="35" y="188" fill="#b9cbe5" font-size="12">PKG-303-07 · destination log: Hub B</text>`:`<rect x="25" y="55" width="90" height="100" fill="#304c62"/><path d="M25 90H115M25 125H115" stroke="#7695a7"/><rect x="275" y="55" width="35" height="125" fill="#27433e"/><text x="270" y="42" fill="#c9e8cd" font-size="11">REAR EXIT</text><rect x="${80+f*60}" y="130" width="40" height="32" fill="#efbc7d"/><text x="25" y="190" fill="#b9cbe5" font-size="12">BOX-101-09 · departure not established</text>`;
    return `<div class="scene"><span class="scene-tag">${safe(s.camera)} · FRAME ${f+1}/3 · ILLUSTRATION</span><svg viewBox="0 0 350 215" role="img" aria-label="${safe(s.title+', frame '+(f+1)+': '+s.frames[f][1])}"><rect width="350" height="215" fill="#112436"/>${body}</svg></div>`;
  }
  function renderCams(){
    $('cameras').innerHTML=D.scenarios.map((s,i)=>`<article class="cam">${illustration(s,i)}<h3>${safe(s.title)}</h3><p class="small">${safe(s.store)} · ${safe(s.timeZone)} · 24 Oct 2026</p><p class="sequence-caption" aria-live="polite"><strong>${safe(s.frames[frames[i]][0])}</strong> — ${safe(s.frames[frames[i]][1])}</p><div class="buttons"><button data-step="${i}">Next frame</button><button data-play="${i}">${timers.has(i)?'Pause sequence':'Play sequence'}</button><button data-record="${i}" class="primary">Write observation</button></div><details class="spaced"><summary>Optional training guidance</summary><p class="small">${safe(s.next)}</p><p class="small">Records: ${safe(s.records.join(', '))}</p></details></article>`).join('');
    $('cameras').querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.step;frames[i]=(frames[i]+1)%3;renderCams();}));
    $('cameras').querySelectorAll('[data-play]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.play;if(timers.has(i)){clearInterval(timers.get(i));timers.delete(i);}else timers.set(i,setInterval(()=>{frames[i]=(frames[i]+1)%3;renderCams();},2200));renderCams();}));
    $('cameras').querySelectorAll('[data-record]').forEach(b=>b.addEventListener('click',()=>startScenario(+b.dataset.record)));
  }
  function startScenario(i){const s=D.scenarios[i];$('incidentForm').reset();$('store').value=s.store;$('camera').value=s.camera;$('kind').value=s.kind;$('eventZone').value=s.timeZone;$('eventTime').value=C.localTime(s.observedAt,s.timeZone).slice(0,16);refsOptions('newRefs',s.store);message('savedNote','Write your own observation; no facts have been prefilled.');openTab('incidents');$('observed').focus();}
  function renderEvidence(){
    $('evidenceRecords').innerHTML=D.records.map(r=>`<details id="record-${safe(r.id)}"><summary>${safe(r.id)} · ${safe(r.type)}</summary><p class="small">${safe(r.store)} · ${safe(r.policy)}</p><dl>${Object.entries(r.fields).map(([k,v])=>`<dt>${safe(k.replaceAll('_',' '))}</dt><dd>${safe(v)}</dd>`).join('')}</dl></details>`).join('');
    $('policies').innerHTML=D.policies.map(p=>`<article class="panel"><h4>${safe(p.id)}</h4><p><strong>${safe(p.title)}</strong></p><p class="small">${safe(p.rule)}</p></article>`).join('');
    $('caseExamples').innerHTML=D.examples.map(x=>`<details><summary>${safe(x.id)} · ${safe(x.title)} · Worked example</summary><p><strong>Sources:</strong> ${safe(x.refs.join(', '))}</p><p><strong>Comparison:</strong> ${safe(x.comparison)}</p><p><strong>Finding:</strong> ${safe(x.finding)}</p><p><strong>Action / closure:</strong> ${safe(x.action)}</p></details>`).join('');
  }
  function showEvidence(id){openTab('evidence');const el=$('record-'+id);if(el){el.open=true;el.scrollIntoView({block:'center'});el.querySelector('summary').focus();}}
  function editIncident(id){
    const x=store.state.incidents.find(r=>r.id===id);if(!x)return;
    incidentEdit={id,version:x.version,generation:store.state.generation};$('incidentReviewPanel').hidden=false;$('incidentReviewTitle').textContent='Review '+id;$('reviewVersion').textContent=`Editing version ${x.version}. A stale review is rejected; reopen the record to load newer changes.`;
    $('reviewStatus').value=x.status;$('reviewConfidence').value=x.confidence;$('reviewPriority').value=x.priority;$('reviewActor').value=store.state.settings.analyst||x.reviewer;refsOptions('reviewRefs',x.store,x.evidenceRefs);
    $('reviewFinding').value=x.finding;$('reviewAssigned').value=x.assignedTo;$('reviewDisposition').value=x.disposition;$('reviewReason').value='';$('reviewCorrection').value='';message('reviewFeedback','');renderHistory('incidentHistory',x.history,x.corrections);$('reviewStatus').focus();$('incidentReviewPanel').scrollIntoView({block:'start'});
  }
  function editTask(id){const t=store.state.tasks.find(x=>x.id===id);taskEdit={id,version:t.version,generation:store.state.generation};$('taskReviewPanel').hidden=false;$('taskReviewTitle').textContent='Review '+id;$('taskStatus').value=t.status;$('taskActor').value=store.state.settings.analyst||t.reviewer;$('taskAssigned').value=t.assignedTo;$('taskFinding').value=t.finding;refsOptions('taskRefs',t.store,t.evidenceRefs);renderHistory('taskHistory',t.history);message('taskFeedback','');$('taskStatus').focus();$('taskReviewPanel').scrollIntoView({block:'start'});}
  function download(filename,mime,data){const url=URL.createObjectURL(new Blob([data],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function act(feedback,fn){try{await fn();}catch(error){message(feedback,error.message,true);message('globalStatus',error.message,true);if(/storage|Not saved/i.test(error.message))$('temporaryButton').hidden=false;}}
  function bind(){
    document.querySelectorAll('.nav [data-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));
    $('manualEntry').onclick=()=>{openTab('incidents');$('camera').focus();};$('browseEvidence').onclick=()=>openTab('evidence');
    $('store').onchange=()=>{$('eventZone').value=D.stores.find(s=>s.id===$('store').value).zone;$('eventTime').value=C.localTime(now(),$('eventZone').value).slice(0,16);refsOptions('newRefs',$('store').value);};
    $('incidentForm').onsubmit=e=>{e.preventDefault();act('savedNote',async()=>{
      checkForm('incidentForm');
      const fields={store:$('store').value,camera:$('camera').value.trim(),observedAt:C.toInstant($('eventTime').value,$('eventZone').value),timeZone:$('eventZone').value,kind:$('kind').value,priority:$('priority').value,confidence:$('confidence').value,createdBy:$('recorder').value.trim(),observed:$('observed').value.trim(),verify:$('verify').value.trim(),evidenceRefs:values('newRefs'),reviewer:$('newReviewer').value.trim(),finding:$('newFinding').value.trim()};
      const x=C.createIncident(fields,'OBS-'+nextUUID(),now());await store.commit(()=>({type:'create',payload:x}));
      $('incidentForm').reset();$('eventZone').value=D.stores[0].zone;$('eventTime').value=C.localTime(now(),$('eventZone').value).slice(0,16);refsOptions('newRefs',D.stores[0].id);message('savedNote',`Saved ${x.id}${store.temporary?' in this temporary session':''}. No policy breach inferred automatically.`);message('globalStatus','Observation saved.');
    });};
    $('reviewForm').onsubmit=e=>{e.preventDefault();act('reviewFeedback',async()=>{
      checkForm('reviewForm');C.assert(incidentEdit,'Select an incident first.');const edit={...incidentEdit};
      const patch={actor:$('reviewActor').value.trim(),status:$('reviewStatus').value,confidence:$('reviewConfidence').value,priority:$('reviewPriority').value,evidenceRefs:values('reviewRefs'),finding:$('reviewFinding').value,assignedTo:$('reviewAssigned').value,disposition:$('reviewDisposition').value,reason:$('reviewReason').value,correction:$('reviewCorrection').value};
      await store.commit(state=>{C.assert(state.generation===edit.generation,'The demo was reset in another tab. Reopen this incident before reviewing it; your draft has been retained.');const old=state.incidents.find(x=>x.id===edit.id);C.assert(old&&old.version===edit.version,'A newer review exists. Reopen this incident and compare the latest history; your draft has been retained.');return {type:'incidentReview',expectedVersion:edit.version,payload:C.reviewIncident(old,patch,now())};});
      incidentEdit=null;$('incidentReviewPanel').hidden=true;message('globalStatus','Incident review and attributed history saved.');
    });};
    $('taskForm').onsubmit=e=>{e.preventDefault();act('taskFeedback',async()=>{
      checkForm('taskForm');C.assert(taskEdit,'Select a task first.');const edit={...taskEdit};const patch={actor:$('taskActor').value.trim(),status:$('taskStatus').value,evidenceRefs:values('taskRefs'),finding:$('taskFinding').value,assignedTo:$('taskAssigned').value};
      await store.commit(state=>{C.assert(state.generation===edit.generation,'The demo was reset in another tab. Reopen the task before reviewing it; your draft has been retained.');const old=state.tasks.find(x=>x.id===edit.id);C.assert(old&&old.version===edit.version,'A newer task review exists. Reopen the task and compare its history; your draft has been retained.');return {type:'taskReview',expectedVersion:edit.version,payload:C.reviewTask(old,patch,now())};});taskEdit=null;$('taskReviewPanel').hidden=true;message('globalStatus','Task comparison and review history saved.');
    });};
    $('cancelReview').onclick=()=>{incidentEdit=null;$('incidentReviewPanel').hidden=true;};$('cancelTask').onclick=()=>{taskEdit=null;$('taskReviewPanel').hidden=true;};
    $('reportSettings').onsubmit=e=>{e.preventDefault();act('reportFeedback',async()=>{checkForm('reportSettings');const settings={analyst:$('analyst').value.trim(),reportDate:$('reportDate').value,reportZone:$('reportZone').value};C.validateSettings(settings);await store.commit(()=>({type:'settings',payload:settings}));message('reportFeedback','Report settings saved; generated report updated.');});};
    $('exportIncidents').onclick=()=>download('SAMPLE_INCIDENTS.csv','text/csv;charset=utf-8',C.csv(C.incidentRows(store.state)));
    $('exportTasks').onclick=()=>download('QA_TASKS.csv','text/csv;charset=utf-8',C.csv(C.taskRows(store.state)));
    $('downloadReport').onclick=()=>{refreshReport();download('synthetic_qa_handover_'+store.state.settings.reportDate+'.txt','text/plain;charset=utf-8',$('reportText').textContent);};
    $('backupButton').onclick=()=>download('watchtower_backup.json','application/json',JSON.stringify(store.backup(),null,2));
    $('recoveryButton').onclick=()=>download('watchtower_recovery.json','application/json',JSON.stringify(store.backup(),null,2));
    $('temporaryButton').onclick=()=>{store.temporarySession();message('globalStatus','Temporary session enabled. Export JSON before closing this tab.');};
    $('migrateButton').onclick=()=>act('globalStatus',async()=>{await store.migrate();message('globalStatus','Earlier observations imported with verification reset. Original data is retained in recovery storage; confirm imported timezones.');});
    $('resetButton').onclick=()=>{if(confirm('Restore the fictional starting dataset? Current operations remain in the JSON recovery history, but active incidents, tasks and report settings will reset.'))act('globalStatus',async()=>{await store.commit(()=>({type:'reset'}));incidentEdit=null;taskEdit=null;$('incidentReviewPanel').hidden=true;$('taskReviewPanel').hidden=true;$('incidentForm').reset();$('eventZone').value=D.stores[0].zone;$('eventTime').value=C.localTime(now(),$('eventZone').value).slice(0,16);refsOptions('newRefs',D.stores[0].id);$('questions').querySelectorAll('input').forEach(x=>x.checked=false);document.querySelectorAll('[data-explanation]').forEach(x=>x.textContent='');$('score').textContent='';document.activeElement.blur();syncSettings(store.state);message('globalStatus','Synthetic starting dataset restored. Prior journal entries remain available in JSON backup.');});};
    $('printButton').onclick=()=>{openTab('report',false);window.print();};
    addEventListener('beforeprint',()=>{printPrevious=activeTab;openTab('report',false);refreshReport();});
    addEventListener('afterprint',()=>{if(printPrevious)openTab(printPrevious,false);printPrevious=null;});
  }
  const quiz=[
    {q:'A carton approaches an exit, but departure is not shown. What should you record?',a:['The carton was stolen.','The carton approached the exit; departure and authorization need verification.','An authorized transfer definitely occurred.'],c:1,why:'Keep the observation within the limits of the sequence.'},
    {q:'A $200 transaction includes an $80 discount. What is the discount rate?',a:['20%','80%','40%'],c:2,why:'Discount rate = 80 / 200 × 100 = 40%.'},
    {q:'The limited approval extract has no matching reference. What is established?',a:['The supplied extract cannot establish approval; request the missing record.','The cashier intentionally violated policy.','Approval can be assumed from a completed sale.'],c:0,why:'An incomplete extract does not prove that approval never existed.'},
    {q:'DISPATCH-607 and EXIT-607 match, and approval precedes departure. What is the defensible outcome?',a:['Escalate every departure automatically.','Document the comparison and close with no deviation found.','Delete the observation.'],c:1,why:'Retain the evidence and disposition for the authorized event.'},
    {q:'A receipt names PHONE-CASE-A, but the related return names CHARGER-B. What should you do?',a:['Mark fully reconciled because the dollar amount matches.','Accuse the customer of fraud.','Document the item mismatch and request clarification.'],c:2,why:'Matching amounts do not resolve a mismatching item code.'},
    {q:'Someone asks for a real CCTV clip on a personal messaging account. What should guide you?',a:['Authorized evidence-access and handling procedures.','A colleague’s request is sufficient authorization.','Post it in an unrestricted group.'],c:0,why:'Confirm authorization and use the employer’s approved handling procedure.'}
  ];
  function renderQuiz(){$('questions').innerHTML=quiz.map((q,i)=>`<fieldset class="exercise"><legend>${i+1}. ${safe(q.q)}</legend>${q.a.map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}">${safe(a)}</label>`).join('')}<p data-explanation="${i}" class="small"></p></fieldset>`).join('');$('gradeButton').onclick=()=>{let correct=0;quiz.forEach((q,i)=>{const ok=+document.querySelector(`input[name=q${i}]:checked`)?.value===q.c;if(ok)correct++;document.querySelector(`[data-explanation="${i}"]`).textContent=(ok?'Correct. ':'Review. ')+q.why;});$('score').textContent=`Practice score: ${correct}/${quiz.length}. Explain your reasoning and verify the records; this is not a hiring assessment.`;};}
  options('store',D.stores.map(s=>s.id));options('eventZone',C.ZONES,D.stores[0].zone);options('reportZone',C.ZONES);options('kind',C.KINDS);options('confidence',C.EVIDENCE);options('reviewConfidence',C.EVIDENCE);refsOptions('newRefs',D.stores[0].id);
  $('eventTime').value=C.localTime(now(),D.stores[0].zone).slice(0,16);renderCams();renderEvidence();renderQuiz();bind();
  let storage;try{storage=localStorage;}catch{storage={get length(){throw new Error('Storage blocked');},getItem(){throw new Error('Storage blocked');},setItem(){throw new Error('Storage blocked');}};}
  store=new WatchtowerStore.JournalStore(storage,renderAll);syncSettings(store.state);renderAll(store.state,store);
  // Public inspection surface contains only the fictional demo data and local operations.
  globalThis.WatchtowerApp={get state(){return C.clone(store.state);},get journal(){return store;},openTab,refreshReport};
})();
