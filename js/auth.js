import {
  auth, provider, isAdmin, writePath,
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, onAuthStateChanged, signOut, updateProfile
} from "./firebase.js";

const notice = document.getElementById("authNotice");
const accountArea = document.getElementById("accountArea");
const accountText = document.getElementById("accountText");
const adminLink = document.getElementById("adminLink");

function msg(text, error=false){
  notice.innerHTML = `<div class="notice ${error?'error':''}">${text}</div>`;
}
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try{
    await signInWithEmailAndPassword(auth, email, password);
    msg("Login realizado com sucesso.");
  }catch(e){ msg(e.message, true); }
});
document.getElementById("googleBtn")?.addEventListener("click", async () => {
  try{
    const cred = await signInWithPopup(auth, provider);
    await writePath(`users/${cred.user.uid}`, {
      name: cred.user.displayName || "Cliente",
      email: cred.user.email || "",
      createdAt: new Date().toISOString(),
      role: isAdmin(cred.user) ? "admin" : "cliente"
    });
    msg("Login com Google realizado.");
  }catch(e){ msg(e.message, true); }
});
document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if(name) await updateProfile(cred.user, { displayName:name });
    await writePath(`users/${cred.user.uid}`, {
      name: name || "Cliente",
      email,
      createdAt: new Date().toISOString(),
      role: isAdmin(cred.user) ? "admin" : "cliente"
    });
    msg("Conta criada com sucesso.");
  }catch(e){ msg(e.message, true); }
});
document.getElementById("resetBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if(!email){ msg("Digite seu email no campo de login.", true); return; }
  try{
    await sendPasswordResetEmail(auth, email);
    msg("Email de redefinição enviado.");
  }catch(e){ msg(e.message, true); }
});
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});
onAuthStateChanged(auth, async user => {
  if(user){
    accountArea.classList.remove("hidden");
    accountText.textContent = `${user.displayName || "Cliente"} • ${user.email}`;
    adminLink.classList.toggle("hidden", !isAdmin(user));
    try{
      await writePath(`users/${user.uid}`, {
        name: user.displayName || "Cliente",
        email: user.email || "",
        createdAt: new Date().toISOString(),
        role: isAdmin(user) ? "admin" : "cliente"
      });
    }catch(e){}
  }else{
    accountArea.classList.add("hidden");
  }
});