import {
  auth, provider, isAdmin,
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
    await signInWithPopup(auth, provider);
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
onAuthStateChanged(auth, user => {
  if(user){
    accountArea.classList.remove("hidden");
    accountText.textContent = `${user.displayName || "Cliente"} • ${user.email}`;
    adminLink.classList.toggle("hidden", !isAdmin(user));
  }else{
    accountArea.classList.add("hidden");
  }
});