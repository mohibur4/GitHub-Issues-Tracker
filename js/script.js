const API = "https://phi-lab-server.vercel.app/api/v1/lab/issues";

if(localStorage.getItem("isLoggedIn") !== "true"){

window.location.href = "index.html";

}

function logout(){

localStorage.removeItem("isLoggedIn");

window.location.href = "../dashboard.html";

}

let issues = [];

async function loadIssues(){

const res = await fetch(API);

const data = await res.json();

issues = data.data || data;

renderIssues(issues);

}

loadIssues();

function renderIssues(data){

const area = document.getElementById("cardsArea");

area.innerHTML = data.map(issue => `

<div class="bg-white p-4 rounded shadow mb-4">

<h3 class="font-bold">${issue.title}</h3>

<p class="text-sm text-gray-500">
${issue.description || ""}
</p>

<p class="text-xs text-gray-400 mt-2">
${issue.author}
</p>

</div>

`).join("");

}

document.getElementById("searchInput")
.addEventListener("input",function(){

const q = this.value.toLowerCase();

const filtered = issues.filter(i =>
(i.title || "").toLowerCase().includes(q)
);

renderIssues(filtered);

});