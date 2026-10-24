/* Entirely fictional training data. No company policy or employee data. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.WatchtowerData = data;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const stores = [
    {id:'Demo Store 101',zone:'America/New_York'},
    {id:'Demo Store 202',zone:'America/Chicago'},
    {id:'Demo Store 303',zone:'America/Los_Angeles'}
  ];
  const policies = [
    {id:'TRAIN-STOCK-01',title:'Fictional training rule: stock transfer',rule:'Compare package ID, quantity, source, destination and movement time to a manager-approved dispatch. Movement alone does not establish an unauthorized transfer.'},
    {id:'TRAIN-DISC-01',title:'Fictional training rule: discount approval',rule:'A discount above 20% requires a matching manager approval in this exercise. An absent approval in the supplied extract is a verification gap; request it before concluding that a policy violation occurred.'},
    {id:'TRAIN-RETURN-01',title:'Fictional training rule: return reconciliation',rule:'Match the return to the original receipt, item, quantity and refund value. Escalate an unexplained item mismatch for clarification; do not infer intent.'},
    {id:'TRAIN-CALL-01',title:'Fictional training rule: callback',rule:'Compare the promised callback time with the completed-call record. Record only the synthetic customer reference.'}
  ];
  const records = [
    {id:'MOVE-101',store:'Demo Store 101',type:'Observation log',policy:'TRAIN-STOCK-01',fields:{observed_at:'2026-10-24T13:12:00.000Z',camera:'CAM-02',package_id:'BOX-101-09',quantity:1,event:'Carton approached rear exit; departure not established',authorization:'Not supplied'}},
    {id:'POS-441',store:'Demo Store 202',type:'POS transaction',policy:'TRAIN-DISC-01',fields:{transaction_id:'TX-202-441',at:'2026-10-24T15:34:00.000Z',gross_usd:200,discount_usd:80,net_usd:120,discount_percent:40,approval_reference:'Not present in supplied extract'}},
    {id:'APPROVAL-INDEX-441',store:'Demo Store 202',type:'Approval search extract',policy:'TRAIN-DISC-01',fields:{searched_transaction:'TX-202-441',search_scope:'Training extract only, not a complete company system',matching_approval_count:0,next_action:'Ask authorized supervisor for the matching approval'}},
    {id:'DISPATCH-607',store:'Demo Store 303',type:'Approved dispatch',policy:'TRAIN-STOCK-01',fields:{dispatch_id:'DISPATCH-607',package_id:'PKG-303-07',quantity:1,source:'Demo Store 303',destination:'Demo Hub B',approved_by:'Fictional Manager C',approved_at:'2026-10-24T17:50:00.000Z',scheduled_movement:'2026-10-24T18:05:00.000Z'}},
    {id:'EXIT-607',store:'Demo Store 303',type:'Exit observation',policy:'TRAIN-STOCK-01',fields:{observed_at:'2026-10-24T18:05:00.000Z',camera:'CAM-03',package_id:'PKG-303-07',quantity:1,destination_log:'Demo Hub B',dispatch_reference:'DISPATCH-607'}},
    {id:'RECEIPT-120',store:'Demo Store 101',type:'Original receipt',policy:'TRAIN-RETURN-01',fields:{transaction_id:'TX-101-120',at:'2026-10-23T16:00:00.000Z',item:'PHONE-CASE-A',quantity:1,paid_usd:25}},
    {id:'RETURN-120',store:'Demo Store 101',type:'Return request',policy:'TRAIN-RETURN-01',fields:{return_id:'RET-120',at:'2026-10-24T14:20:00.000Z',original_transaction:'TX-101-120',item:'CHARGER-B',quantity:1,requested_refund_usd:25}},
    {id:'CALL-219',store:'Demo Store 202',type:'Callback record',policy:'TRAIN-CALL-01',fields:{customer_reference:'CUSTOMER-DEMO-12',promised_by:'2026-10-24T16:00:00.000Z',completed_at:'2026-10-24T15:45:00.000Z',outcome:'Synthetic callback completed',personal_contact_data:'None'}}
  ];
  const history = (at,actor,note) => [{at,actor,action:'Created',note,from:'',to:'Open'}];
  const incident = (x) => ({version:1,createdAt:'2026-10-24T18:10:00.000Z',updatedAt:'2026-10-24T18:10:00.000Z',createdBy:'Fictional Demo Analyst',reviewer:'',evidenceRefs:[],finding:'',disposition:'',assignedTo:'',resolvedAt:'',corrections:[],...x});
  const incidents = [
    incident({id:'OBS-1001',store:stores[0].id,camera:'CAM-02',observedAt:'2026-10-24T13:12:00.000Z',timeZone:stores[0].zone,kind:'Inventory movement',priority:'Medium',confidence:'Needs verification',observed:'One carton approached the rear exit in the illustrated sequence. Departure and authorization are not established.',verify:'Request dispatch authorization for BOX-101-09 and compare movement details.',status:'Open',history:history('2026-10-24T18:10:00.000Z','Fictional Demo Analyst','Seeded synthetic observation; authorization remains unverified.')}),
    incident({id:'OBS-1002',store:stores[1].id,camera:'POS-REVIEW',observedAt:'2026-10-24T15:34:00.000Z',timeZone:stores[1].zone,kind:'Customer transaction',priority:'Medium',confidence:'Needs verification',observed:'The supplied POS extract records an $80 discount on a $200 transaction; the approval reference is absent from this extract.',verify:'Compare POS-441 with APPROVAL-INDEX-441 and request approval for TX-202-441.',status:'Open',history:history('2026-10-24T18:10:00.000Z','Fictional Demo Analyst','Seeded synthetic discount check; approval completeness is unknown.')}),
    incident({id:'OBS-1003',store:stores[2].id,camera:'CAM-03',observedAt:'2026-10-24T18:05:00.000Z',timeZone:stores[2].zone,kind:'Branch exit',priority:'Low',confidence:'No deviation found',evidenceRefs:['DISPATCH-607','EXIT-607'],reviewer:'Fictional Demo Analyst',finding:'Package PKG-303-07, quantity one, destination Demo Hub B and the 18:05 UTC movement match DISPATCH-607. Approval at 17:50 UTC precedes departure.',disposition:'Authorized transfer in the supplied fictional records; close with no deviation found.',resolvedAt:'2026-10-24T18:15:00.000Z',updatedAt:'2026-10-24T18:15:00.000Z',observed:'One package crossed the marked exit at 11:05 America/Los_Angeles in the synthetic exit log.',verify:'Retain DISPATCH-607 and EXIT-607 cross-check.',status:'Resolved',history:[...history('2026-10-24T18:10:00.000Z','Fictional Demo Analyst','Created from EXIT-607.'),{at:'2026-10-24T18:15:00.000Z',actor:'Fictional Demo Analyst',action:'Reviewed',note:'Compared package, quantity, destination, time and prior approval. Authorized transfer; no deviation found.',from:'Open',to:'Resolved'}]})
  ];
  const task = x => ({version:1,status:'Pending',reviewer:'',finding:'',assignedTo:'',updatedAt:'2026-10-24T18:10:00.000Z',history:[],...x});
  const tasks = [
    task({id:'RET-120',store:stores[0].id,type:'Sales return',question:'Does the return item match the original receipt?',evidenceRefs:['RECEIPT-120','RETURN-120']}),
    task({id:'DISC-441',store:stores[1].id,type:'Discount check',question:'Can approval for the 40% discount be established from the supplied records?',evidenceRefs:['POS-441','APPROVAL-INDEX-441']}),
    task({id:'CALL-219',store:stores[1].id,type:'Customer callback',question:'Was the callback completed by the promised time?',evidenceRefs:['CALL-219']}),
    task({id:'STOCK-607',store:stores[2].id,type:'Inventory movement',question:'Does the exit match the authorized dispatch?',evidenceRefs:['DISPATCH-607','EXIT-607'],status:'Reviewed',reviewer:'Fictional Demo Analyst',finding:'Package, quantity, destination and movement time match; approval precedes exit.',history:[{at:'2026-10-24T18:15:00.000Z',actor:'Fictional Demo Analyst',action:'Reviewed',note:'Matched EXIT-607 to DISPATCH-607. No deviation found.',from:'Pending',to:'Reviewed'}]})
  ];
  const scenarios = [
    {id:'sequence-stock',title:'Rear-exit observation',store:stores[0].id,camera:'CAM-02',kind:'Inventory movement',timeZone:stores[0].zone,observedAt:'2026-10-24T13:12:00.000Z',scene:'stock',records:['MOVE-101'],frames:[['09:11:50','A sealed carton is beside the stock shelf.'],['09:12:00','The carton moves toward the rear exit.'],['09:12:10','The sequence ends before departure is established.']],next:'Record only what the sequence establishes. Request authorization before reaching a conclusion.'},
    {id:'sequence-discount',title:'Counter and transaction check',store:stores[1].id,camera:'CAM-01 + POS-REVIEW',kind:'Customer transaction',timeZone:stores[1].zone,observedAt:'2026-10-24T15:34:00.000Z',scene:'counter',records:['POS-441','APPROVAL-INDEX-441'],frames:[['10:33:50','A customer is at the illustrated counter.'],['10:34:00','The POS extract records gross $200 and discount $80.'],['10:34:10','The supplied extract has no matching approval reference.']],next:'The discount is 80 ÷ 200 × 100 = 40%. An absent approval in a limited extract is not proof that none exists.'},
    {id:'sequence-exit',title:'Authorized package transfer',store:stores[2].id,camera:'CAM-03',kind:'Branch exit',timeZone:stores[2].zone,observedAt:'2026-10-24T18:05:00.000Z',scene:'exit',records:['DISPATCH-607','EXIT-607'],frames:[['11:04:50','Package PKG-303-07 approaches the exit.'],['11:05:00','One package crosses the marked exit.'],['11:05:10','The movement log names Demo Hub B as the destination.']],next:'Compare the two records yourself, including whether approval preceded the exit.'}
  ];
  const examples = [
    {id:'CASE-01',title:'Authorized inventory transfer',refs:['DISPATCH-607','EXIT-607'],comparison:'Package PKG-303-07, quantity 1, source Demo Store 303, destination Demo Hub B, scheduled and observed time 18:05 UTC all match. Approval is 17:50 UTC.',finding:'No deviation found in the supplied fictional records.',action:'Close with the comparison and evidence references; do not escalate merely because a package left the store.'},
    {id:'CASE-02',title:'Discount requiring verification',refs:['POS-441','APPROVAL-INDEX-441'],comparison:'Gross $200 − discount $80 = net $120. Discount rate = $80 / $200 × 100 = 40%. TRAIN-DISC-01 requires approval above 20%; the limited extract contains no matching approval.',finding:'Approval cannot be established from the supplied extract. This is a record-completeness gap, not a conclusion about intent.',action:'Escalate to Fictional Training Supervisor; request TX-202-441 approval, retain the comparison, and keep the case open pending response.'},
    {id:'CASE-03',title:'Return item mismatch',refs:['RECEIPT-120','RETURN-120'],comparison:'Transaction reference, quantity 1 and $25 match. Receipt item PHONE-CASE-A differs from return item CHARGER-B.',finding:'The supplied item codes differ; the reason is unknown.',action:'Request correction or explanation from Fictional Training Supervisor before treating the refund as reconciled.'}
  ];
  return {version:'2.0.0',classification:'SYNTHETIC TRAINING DATA — NOT A COMPANY REPORT',stores,policies,records,scenarios,examples,incidents,tasks,settings:{analyst:'',reportDate:'2026-10-24',reportZone:'America/New_York'}};
});
