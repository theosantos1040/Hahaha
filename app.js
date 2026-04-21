const $ = s => document.querySelector(s);
const logo = $('#logo');
let captchaPassed = sessionStorage.getItem('hcaptcha_ok') === '1';

let agents = JSON.parse(localStorage.getItem('aso_agents')) || [
  { name: 'Pesquisador', role: 'Busque 3 fatos objetivos, números e fontes sobre o tema', model: 'aso-mini' },
  { name: 'Revisor', role: 'Critique a resposta do Pesquisador, aponte falhas', model: 'aso-raciocinio' },
  { name: 'Summarizer', role: 'Resuma a conversa em 3 bullets', model: 'aso-mini' }
];

function renderAgents() {
  $('#agentsList').innerHTML = agents.map((a,i)=>`
    <div class="agent-item">
      <input value="${a.name}" onchange="agents[${i}].name=this.value">
      <input value="${a.role}" onchange="agents[${i}].role=this.value">
      <select onchange="agents[${i}].model=this.value">
        <option value="aso-mini" ${a.model==='aso-mini'?'selected':''}>Aso Mini</option>
        <option value="aso-raciocinio" ${a.model==='aso-raciocinio'?'selected':''}>Aso Raciocínio</option>
      </select>
      <button onclick="agents.splice(${i},1);renderAgents()">×</button>
    </div>`).join('');
}

$('#addAgent').onclick = ()=>{ agents.push({name:'Novo',role:'',model:'aso-mini'}); renderAgents(); };
$('#saveSettings').onclick = ()=>{ localStorage.setItem('aso_agents',JSON.stringify(agents)); localStorage.setItem('aso_system',$('#systemPrompt').value); localStorage.setItem('aso_thinking',$('#thinking').checked); $('#settingsModal').style.display='none'; };
$('#settingsBtn').onclick = ()=>{ $('#settingsModal').style.display='flex'; renderAgents(); $('#systemPrompt').value = localStorage.getItem('aso_system')||'Você é o assistente Aso, útil e direto.'; $('#thinking').checked = localStorage.getItem('aso_thinking')==='true'; };

async function ensureCaptcha() {
  if (captchaPassed) return true;
  const token = await hcaptcha.execute({async:true});
  const res = await fetch('/api/verify-captcha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
  const data = await res.json();
  if (data.success) { captchaPassed=true; sessionStorage.setItem('hcaptcha_ok','1'); return true; }
  alert('Falha no captcha'); return false;
}

$('#send').onclick = async () => {
  const text = $('#input').value.trim(); if(!text) return;
  if (!await ensureCaptcha()) return;

  $('#messages').insertAdjacentHTML('beforeend', `<div class="msg user"><div class="bubble">${text}</div></div>`);
  $('#input').value = ''; logo.classList.add('loading'); $('#messages').scrollTop = $('#messages').scrollHeight;

  try {
    const res = await fetch('/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:text,
        model:$('#model').value,
        systemPrompt:localStorage.getItem('aso_system'),
        thinking:localStorage.getItem('aso_thinking')==='true',
        agents
      })
    });
    const data = await res.json();
    logo.classList.remove('loading');
    let html='';
    data.agents?.forEach(a=> html+=`<div class="msg"><img src="https://www.image2url.com/r2/default/images/1776691290648-eacc2840-7e26-42bb-bd70-73eeae524dba.png" width="28"><div class="bubble"><b>${a.name}:</b> ${a.output}</div></div>`);
    if(data.reasoning) html+=`<div class="msg"><div class="bubble" style="opacity:.7">💭 ${data.reasoning}</div></div>`;
    html+=`<div class="msg"><img src="https://www.image2url.com/r2/default/images/1776691290648-eacc2840-7e26-42bb-bd70-73eeae524dba.png" width="28"><div class="bubble">${data.answer}</div></div>`;
    $('#messages').insertAdjacentHTML('beforeend', html);
    $('#messages').scrollTop = $('#messages').scrollHeight;
  } catch(e){ logo.classList.remove('loading'); alert('Erro: '+e.message); }
};
