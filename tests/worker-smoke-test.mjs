import worker from '../worker.js';
const goodResult = {
 candidate_summary: 'มีประสบการณ์งานที่เกี่ยวข้อง',
 criteria_assessment: [{criterion:'ทักษะ',status:'evidenced',evidence:'ระบุใน CV',cv_excerpt:'Skill A',explanation:'พบหลักฐาน',verification_question:''}],
 strengths:['มีทักษะ A'], missing_information:['ไม่พบข้อมูล B'], interview_questions:['เล่าตัวอย่างงาน A'], analysis_limitations:[]
};
globalThis.fetch = async (url, opts) => {
 if (String(url) !== 'https://api.openai.com/v1/responses') throw new Error('unexpected url');
 const req=JSON.parse(opts.body);
 if(req.store !== false) throw new Error('store must false');
 if(req.text.format.type !== 'json_schema') throw new Error('json schema missing');
 return new Response(JSON.stringify({status:'completed',model:'test-model',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(goodResult)}]}]}),{status:200,headers:{'content-type':'application/json'}});
};
const env={OPENAI_API_KEY:'test-key',APP_ACCESS_CODE:'demo-pass',OPENAI_MODEL:'test-model',ALLOWED_ORIGINS:'https://monogizmo.github.io'};
const req=new Request('https://worker.example/analyze',{method:'POST',headers:{Origin:'https://monogizmo.github.io','Content-Type':'application/json','X-HR-HUB-ACCESS':'demo-pass'},body:JSON.stringify({candidateId:'Candidate 01',jdText:'Role requirements '.repeat(5),cvText:'CV experience '.repeat(15)+' user@example.com 0812345678',criteria:[{name:'ทักษะ',weight:100}]})});
const res=await worker.fetch(req,env);
const data=await res.json();
if(res.status!==200 || data.result.criteria_assessment[0].status!=='evidenced') throw new Error(JSON.stringify({status:res.status,data}));
if(!res.headers.get('access-control-allow-origin')) throw new Error('CORS header missing');
const bad=await worker.fetch(new Request('https://worker.example/analyze',{method:'POST',headers:{Origin:'https://monogizmo.github.io','Content-Type':'application/json','X-HR-HUB-ACCESS':'wrong'},body:'{}'}),env);
if(bad.status!==401) throw new Error('access code gate failed');
console.log('Worker smoke tests passed: valid request, store:false, structured schema, CORS, access-code gate.');
