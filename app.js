(() => {
  const DATA = window.OX_DATA || {};
  const $ = id => document.getElementById(id);
  const KEY = "minbeop_touch_v2";
  const fresh = { stats: {}, seen: {} };
  let state = JSON.parse(localStorage.getItem(KEY) || "null") || fresh;
  let subject = "민법", chapter = "all", mode = "all";
  let pool = [], queue = [], pos = 0, answered = false, current = null;
  let options = [];

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function ensure(){
    state.stats ||= {};
    state.seen ||= {};
    state.stats[subject] ||= {};
    state.seen[subject] ||= {};
  }
  function currentData(){ return DATA[subject] || []; }
  function statFor(id){ return state.stats[subject]?.[id] || {attempts:0,correct:0,wrong:0}; }
  function filtered(){
    let a = currentData();
    if(chapter !== "all") a = a.filter(q => q.chapter === chapter);
    if(mode === "unanswered") a = a.filter(q => statFor(q.id).attempts === 0);
    if(mode === "wrong") a = a.filter(q => statFor(q.id).wrong > 0);
    if(mode === "frequent") a = a.filter(q => statFor(q.id).wrong >= 2);
    return a;
  }
  function shuffle(a){
    a = a.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function buildChapters(){
    const vals=[...new Set(currentData().map(q=>q.chapter))];
    $('chapterSelect').innerHTML='<option value="all">전체</option>'+vals.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
    $('chapterSelect').value=chapter;
  }
  function startCycle(){
    pool = filtered();
    queue = shuffle(pool.map(q=>q.id));
    pos = 0;
    renderStats();
    showQuestion();
  }
  function getQuestion(id){return currentData().find(q=>q.id===id);}
  function makeOptions(){
    if(!current) return [];
    const wrong = current.distractor ?? "다른 선택지";
    return Math.random()<0.5 ? [current.correct, wrong] : [wrong, current.correct];
  }
  function showQuestion(){
    answered=false;
    if(!queue.length){
      $('questionText').textContent="현재 조건에 맞는 문제가 없습니다.";
      $('chapterBadge').textContent=subject;
      $('qNumber').textContent="완료";
      document.querySelectorAll(".choice").forEach(b=>b.disabled=true);
      $('result').className="result hidden";
      $('explanation').className="explanation hidden";
      $('nextBtn').classList.add("hidden");
      return;
    }
    if(pos >= queue.length){ queue=shuffle(pool.map(q=>q.id)); pos=0; }
    current=getQuestion(queue[pos]);
    $('chapterBadge').textContent=current.chapter || subject;
    $('qNumber').textContent='문제 '+current.id;
    $('questionText').textContent=current.text;
    options=makeOptions();
    document.querySelectorAll(".choice").forEach((b,i)=>{
      b.disabled=false; b.textContent=options[i] ?? ""; b.dataset.answer=options[i] ?? "";
      b.style.outline="";
      b.style.opacity="";
    });
    $('result').className="result hidden";
    $('result').textContent="";
    $('explanation').className="explanation hidden";
    $('explanation').textContent="";
    $('nextBtn').classList.add("hidden");
    renderCycle();
  }
  function answer(value){
    if(answered || !current) return;
    answered=true; ensure();
    const s=statFor(current.id);
    s.attempts++;
    if(value === current.correct) s.correct++; else s.wrong++;
    state.stats[subject][current.id]=s;
    document.querySelectorAll(".choice").forEach(b=>{
      b.disabled=true;
      if(b.dataset.answer===current.correct) b.style.outline="4px solid rgba(15,118,110,.18)";
      if(b.dataset.answer===value && value!==current.correct) b.style.opacity=".55";
    });
    const ok=value===current.correct;
    $('result').className="result "+(ok?"correct":"wrong");
    $('result').textContent=ok ? "정답입니다 ✓" : "오답입니다 · 정답은 "+current.correct;
    $('explanation').className="explanation";
    $('explanation').textContent=current.explanation || "제공된 풀이가 없습니다.";
    $('nextBtn').classList.remove("hidden");
    save(); renderStats(); renderCycle();
  }
  function next(){pos++; showQuestion();}
  function renderStats(){
    const all=currentData();
    let attempts=0, correct=0, wrong=0;
    all.forEach(q=>{const s=statFor(q.id);attempts+=s.attempts;correct+=s.correct;wrong+=s.wrong;});
    $('totalStat').textContent=all.length.toLocaleString();
    $('attemptStat').textContent=attempts.toLocaleString();
    $('wrongStat').textContent=wrong.toLocaleString();
    $('accuracyStat').textContent=(attempts?Math.round(correct/attempts*100):0)+"%";
  }
  function renderCycle(){
    const n=pool.length, done=Math.min(pos,n);
    $('cycleCount').textContent=done+" / "+n;
    $('cycleText').textContent=n ? subject+" · "+(chapter==="all"?"전체":chapter)+" · "+({all:"전체 랜덤",unanswered:"미풀이",wrong:"오답",frequent:"자주 틀린 문제"}[mode]) : "출제 준비";
    $('cycleBar').style.width=n ? Math.round(done/n*100)+"%" : "0%";
  }
  function rebuild(){
    ensure(); buildChapters(); startCycle();
  }

  document.querySelectorAll("#subjectSeg button").forEach(b=>b.addEventListener("click",()=>{
    subject=b.dataset.subject;
    document.querySelectorAll("#subjectSeg button").forEach(x=>x.classList.toggle("active",x===b));
    chapter="all"; mode="all"; $("modeSelect").value="all"; rebuild();
  }));
  $("chapterSelect").addEventListener("change",e=>{chapter=e.target.value;startCycle();});
  $("modeSelect").addEventListener("change",e=>{mode=e.target.value;startCycle();});
  document.querySelectorAll(".choice").forEach(b=>b.addEventListener("click",()=>answer(b.dataset.answer)));
  $("nextBtn").addEventListener("click",next);
  $("wrongOnlyBtn").addEventListener("click",()=>{$("modeSelect").value="wrong";mode="wrong";startCycle();});
  $("allBtn").addEventListener("click",()=>{$("modeSelect").value="all";mode="all";chapter="all";buildChapters();startCycle();});
  $("resetBtn").addEventListener("click",()=>{
    if(confirm("이 기기에 저장된 모든 과목의 풀이·오답 통계를 초기화할까요?")){
      state={...fresh,stats:{},seen:{}}; save(); ensure(); rebuild();
    }
  });
  ensure(); buildChapters(); startCycle();
})();
