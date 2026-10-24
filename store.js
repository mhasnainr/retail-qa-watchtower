/* Each committed operation has its own key; independent additions never overwrite a snapshot. */
(function(root){
  'use strict';
  const C=root.WatchtowerCore;
  const PREFIX='retail-qa-watchtower:v2:event:';
  class JournalStore {
    constructor(storage,onChange){
      this.storage=storage;this.onChange=onChange;this.memory=[];this.temporary=false;this.issues=[];this.state=C.seed();this.events=[];
      this.refresh();
      root.addEventListener('storage',event=>{if(!event.key||event.key.startsWith(PREFIX))this.refresh();});
    }
    read(){
      const events=[],issues=[];
      if(this.temporary)return {events:this.memory.slice(),issues:[]};
      try{
        for(let i=0;i<this.storage.length;i++){
          const key=this.storage.key(i);if(!key||!key.startsWith(PREFIX))continue;
          const raw=this.storage.getItem(key);
          try{const event=JSON.parse(raw);C.validateEvent(event);C.assert(key===PREFIX+event.id,'Journal key and event ID differ.');events.push(event);}
          catch(error){issues.push({key,raw,reason:error.message});}
        }
        const legacy=this.storage.getItem('qa-watchtower-v1');
        if(legacy&&!events.some(e=>e.type==='legacy'))issues.push({key:'qa-watchtower-v1',raw:legacy,reason:'Earlier-version data was found and has been preserved. Export recovery data before resetting, or use the migration button.'});
      }catch(error){issues.push({key:'storage-access',raw:'',reason:'Local storage is unavailable. Changes have not been saved. You can explicitly continue in a temporary session.'});}
      return {events,issues};
    }
    refresh(){
      const {events,issues}=this.read();this.events=events;this.issues=issues;
      this.state=C.replay(events);if(this.onChange)this.onChange(this.state,this);return this.state;
    }
    async commit(factory){
      const perform=()=>{
        this.refresh();
        if(!this.temporary&&this.issues.length)throw new Error('Preserved or invalid stored data requires attention. Export recovery data, then migrate valid legacy data or choose a temporary session.');
        const e=factory(C.clone(this.state));
        e.id=root.crypto.randomUUID();e.at=new Date().toISOString();e.generation=this.state.generation;e.order=Math.max(0,...this.events.map(x=>x.order))+1;
        C.validateEvent(e);
        if(this.temporary)this.memory.push(e);
        else{
          try{this.storage.setItem(PREFIX+e.id,JSON.stringify(e));}
          catch{throw new Error('Not saved: browser storage is unavailable or full. Your form is retained. Export a backup, retry, or explicitly continue in a temporary session.');}
        }
        this.refresh();
        if(this.state.conflicts.some(x=>x.event===e.id))throw new Error('Concurrent update detected. The operation is retained in recovery data but was not applied. Reopen the latest record and compare its history.');
        return e;
      };
      if(!this.temporary&&root.navigator.locks)return root.navigator.locks.request('retail-qa-watchtower-v2-write',perform);
      return perform();
    }
    temporarySession(){this.memory=this.events.slice();this.temporary=true;this.refresh();}
    async migrate(){
      const issue=this.issues.find(i=>i.key==='qa-watchtower-v1');C.assert(issue,'No earlier-version dataset was found.');
      const legacy=JSON.parse(issue.raw);C.assert(Array.isArray(legacy.incidents)&&Array.isArray(legacy.tasks),'Earlier-version data is not a valid incident/task collection. Recovery data is preserved.');
      const now=new Date().toISOString(),zone=C.ZONES.includes(Intl.DateTimeFormat().resolvedOptions().timeZone)?Intl.DateTimeFormat().resolvedOptions().timeZone:'UTC';
      const incidents=legacy.incidents.map(x=>{
        C.assert(x&&typeof x.id==='string'&&typeof x.time==='string','Earlier-version incident is missing ID or time; export recovery data.');
        return C.createIncident({store:x.store,camera:x.camera,observedAt:C.toInstant(x.time,zone),timeZone:zone,kind:x.kind||'Other',priority:x.priority||'Medium',confidence:'Needs verification',observed:x.observed,verify:x.verify,createdBy:'Legacy import (review required)',evidenceRefs:[],reviewer:'',finding:''},x.id,now);
      });
      // Legacy closed/evidence labels had no attributable verification. Preserve raw values in history.
      incidents.forEach((x,i)=>x.history[0].note+=` Prior label: ${legacy.incidents[i].status}; evidence: ${legacy.incidents[i].confidence}. Reopened because the old format has no supporting review history. Time interpreted in ${zone}; confirm against original records.`);
      const tasks=C.seed().tasks;
      legacy.tasks.forEach(x=>C.assert(tasks.some(t=>t.id===x.id),'Unknown earlier-version task; export recovery data instead of guessing its meaning.'));
      const migration={id:root.crypto.randomUUID(),order:Math.max(0,...this.events.map(x=>x.order))+1,at:now,generation:this.state.generation,type:'legacy',payload:{incidents,tasks}};
      C.validateEvent(migration);
      this.storage.setItem(PREFIX+migration.id,JSON.stringify(migration));this.refresh();
      return migration;
    }
    backup(){return {schema:'retail-qa-watchtower/v2',classification:root.WatchtowerData.classification,exportedAt:new Date().toISOString(),temporary:this.temporary,state:C.clone(this.state),events:C.clone(this.events),recovery:C.clone(this.issues)};}
  }
  root.WatchtowerStore={JournalStore,PREFIX};
})(globalThis);
