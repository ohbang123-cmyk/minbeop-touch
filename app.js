(() => {
  const DATA = window.OX_DATA;
  const $ = id => document.getElementById(id);
  const KEY='patent_ox_web_v1';
  const fresh = {stats:{}, cycles:{}};
  let state=JSON.parse(localStorage.getItem(KEY)||'null')||fresh;
  let subject='민법', chapter='all', mode='all';
  let pool=[], queue=[], pos=0, answered=false, current=null;

  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function statFor(id){return state.stats[subject]?.[id] || {attempts:0,correct:0,wrong:0};}
  function ensure(){if(!state.stats[subject])state.stats[subject]={};if(!state.cycles[subject])state.cycles[subject]={};}
  function currentData(){return DATA[subject]||[];}
  function filtered(){
    let a=currentData();
    if(chapter!=='all') a=a.filter(q=>q.chapter===chapter);
    if(mode==='unanswered') a=a.filter(q=>statFor(q.id).attempts===0);
    if(mode==='wrong') a=a.filter(q=>statFor(q.id).wrong>0);
    if(mode==='frequent') a=a.filter(q=>statFor(q.id).wrong>=2);
    return a;
  }
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function resetCycle(){pool=filtered();queue=shuffle(pool.map(q=>q.id));pos=0;save();render();}
  function getQuestion(id){return currentData().find(q=>q.id===id)}
  function buildChapters(){
    const sel=$('chapterSelect'); const vals=[...new Set(currentData().map(q=>q.chapter))];
    sel.innerHTML='<option value="all">전체</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    sel.value=chapter;
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function start(){ensure();buildChapters();pool=filtered();queue=shuffle(pool.map(q=>q.id));pos=0;showQuestion();renderStats();}
  function showQuestion(){
    answered=false;
    if(!queue.length){
      $('questionText').textContent='현재 조건에 맞는 문제가 없습니다.';
      $('chapterBadge').textContent=subject;
      $('qNumber').textContent='완료';
      document.querySelectorAll('.ox').forEach(b=>b.disabled=true);
      $('result').classList.add('hidden');$('explanation').classList.add('hidden');$('nextBtn').classList.add('hidden');
      return;
    }
    if(pos>=queue.length){queue=shuffle(pool.map(q=>q.id));pos=0;}
    current=getQuestion(queue[pos]);
    $('chapterBadge').textContent=current.chapter;
    $('qNumber').textContent=`문제 ${current.id}`;
    $('questionText').textContent=current.text;
    $('result').className='result hidden';$('result').textContent='';
    $('explanation').className='explanation hidden';$('explanation').textContent='';
    $('nextBtn').classList.add('hidden');
    document.querySelectorAll('.ox').forEach(b=>{b.disabled=false;b.style.outline='';});
    renderCycle();
  }
  function answer(ans){
    if(answered||!current)return; answered=true; ensure();
    const s=statFor(current.id);s.attempts++; if(ans===current.answer){s.correct++;}else{s.wrong++;}
    state.stats[subject][current.id]=s; save();
    document.querySelectorAll('.ox').forEach(b=>{b.disabled=true;if(b.dataset.answer===current.answer)b.style.outline='4px solid rgba(15,118,110,.18)';});
    const ok=ans===current.answer;
    $('result').className='result '+(ok?'correct':'wrong');$('result').textContent=ok?'정답입니다 ✓':`오답입니다 · 정답은 ${current.answer}`;
    $('explanation').className='explanation';$('explanation').textContent=current.explanation||'제공된 풀이가 없습니다.';
    $('nextBtn').classList.remove('hidden');
    renderStats();renderCycle();
  }
  function next(){pos++;showQuestion();}
  function renderStats(){
    const all=currentData();
    let attempts=0,correct=0,wrong=0;
    all.forEach(q=>{const s=statFor(q.id);attempts+=s.attempts;correct+=s.correct;wrong+=s.wrong});
    $('totalStat').textContent=all.length.toLocaleString();$('attemptStat').textContent=attempts.toLocaleString();$('wrongStat').textContent=wrong.toLocaleString();$('accuracyStat').textContent=(attempts?Math.round(correct/attempts*100):0)+'%';
  }
  function renderCycle(){const n=pool.length;const done=Math.min(pos,n);$('cycleCount').textContent=`${Math.min(pos,n)} / ${n}`;$('cycleText').textContent=n?`${subject} · ${chapter==='all'?'전체':chapter} · ${modeLabel()}`:'출제 준비';$('cycleBar').style.width=n?`${Math.round(Math.min(pos,n)/n*100)}%`:'0%';}
  function modeLabel(){return {all:'전체 랜덤',unanswered:'미풀이',wrong:'오답',frequent:'자주 틀린 문제'}[mode]||''}
  function rebuild(){ensure();pool=filtered();queue=shuffle(pool.map(q=>q.id));pos=0;renderStats();showQuestion();}
  document.querySelectorAll('#subjectSeg button').forEach(b=>b.addEventListener('click',()=>{subject=b.dataset.subject;document.querySelectorAll('#subjectSeg button').forEach(x=>x.classList.toggle('active',x===b));chapter='all';mode='all';$('modeSelect').value='all';buildChapters();rebuild();}));
  $('chapterSelect').addEventListener('change',e=>{chapter=e.target.value;rebuild()});
  $('modeSelect').addEventListener('change',e=>{mode=e.target.value;rebuild()});
  document.querySelectorAll('.ox').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.answer)));
  $('nextBtn').addEventListener('click',next);
  $('wrongOnlyBtn').addEventListener('click',()=>{$('modeSelect').value='wrong';mode='wrong';rebuild()});
  $('allBtn').addEventListener('click',()=>{$('modeSelect').value='all';mode='all';chapter='all';$('chapterSelect').value='all';rebuild()});
  $('resetBtn').addEventListener('click',()=>{if(confirm('이 기기에 저장된 모든 과목의 풀이·오답 통계를 초기화할까요?')){state=fresh;save();start()}});
  ensure();start();
})();

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
