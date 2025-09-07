const fileInput = document.getElementById('fileInput');
const meta = document.getElementById('meta');
const searchBox = document.getElementById('searchBox');
const clearBtn = document.getElementById('clearBtn');
const printBtn = document.getElementById('printBtn');
const suggestionsDiv = document.getElementById('suggestions');
const detailBox = document.getElementById('detailBox');
const clockDate = document.getElementById('clockDate');
let workbookData = [];
let currentFocus = -1;

// Clock & Date
function updateClock(){
  const now = new Date();
  clockDate.textContent = now.toLocaleTimeString() + " | " + now.toLocaleDateString();
}
setInterval(updateClock,1000);
updateClock();

// File Upload
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    try{
      const data = ev.target.result;
      const wb = XLSX.read(data,{type:(f.name.match(/\.csv$/i)?'string':'binary')});
      workbookData = [];
      wb.SheetNames.forEach(sheetName => {
        const sheet = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {defval:''});
        workbookData = workbookData.concat(sheet);
      });
      if(workbookData.length>0){
        meta.textContent = `Loaded ${workbookData.length} records from ${wb.SheetNames.length} sheet(s).`;
        searchBox.disabled = false;
      }
    }catch(err){meta.textContent='Error reading file.'; console.error(err);}
  };
  if(f.name.match(/\.csv$/i)){reader.readAsText(f);} else {reader.readAsBinaryString(f);}
});

// Search
searchBox.addEventListener('input', ()=>{
  const val = searchBox.value.toLowerCase();
  suggestionsDiv.innerHTML = '';
  currentFocus = -1;
  if(val === '' || !workbookData) { suggestionsDiv.style.display='none'; clearBtn.style.display='none'; return;}
  clearBtn.style.display='block';
  const matches = workbookData.filter(record => Object.values(record).some(v => String(v).toLowerCase().includes(val)));
  if(matches.length===0){ suggestionsDiv.innerHTML = '<div class="suggestion-item">No match found.</div>'; } 
  else{
    matches.forEach(r=>{
      const allText = Object.values(r).join(' ');
      const div = document.createElement('div');
      div.classList.add('suggestion-item');
      div.textContent = allText.length > 120 ? allText.substring(0,120)+'...' : allText;
      div.addEventListener('click', ()=>{ showDetails(r); suggestionsDiv.style.display='none'; searchBox.value=allText; });
      suggestionsDiv.appendChild(div);
    });
  }
  suggestionsDiv.style.display='block';
});

// Keyboard navigation
searchBox.addEventListener('keydown', e=>{
  const items = suggestionsDiv.getElementsByClassName('suggestion-item');
  if(items.length==0) return;
  if(e.key==='ArrowDown'){ currentFocus = (currentFocus+1) % items.length; addActive(items); }
  else if(e.key==='ArrowUp'){ currentFocus = (currentFocus-1 + items.length) % items.length; addActive(items); }
  else if(e.key==='Enter'){ e.preventDefault(); if(currentFocus>-1){ items[currentFocus].click(); }}
});
function addActive(items){ for(let i=0;i<items.length;i++){items[i].classList.remove('suggestion-active');} if(currentFocus>=0 && currentFocus<items.length){items[currentFocus].classList.add('suggestion-active');} }

// Clear button
clearBtn.addEventListener('click', ()=>{
  searchBox.value=''; suggestionsDiv.innerHTML=''; suggestionsDiv.style.display='none'; clearBtn.style.display='none'; detailBox.textContent='Select a record to view details.';
});

// Print button
printBtn.addEventListener('click', ()=>{
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write('<html><head><title>Print Record</title></head><body>');
  printWindow.document.write('<pre style="font-family:Segoe UI,Roboto,Arial;">' + detailBox.innerHTML + '</pre>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
});

// Show details
function showDetails(record){
  if(!record){ detailBox.textContent='Select a record to view details.'; return; }
  let html='<strong>Details:</strong><br>';
  for(const key in record){ html+=`<div><b>${key}:</b> ${record[key]}</div>`; }
  detailBox.innerHTML = html;
}
