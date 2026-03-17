import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

async function getFallbackData(){
  const res = await fetch("js/fallback-data.json");
  return await res.json();
}

async function readPath(path){
  try{
    const snap = await get(ref(db, path));
    if(snap.exists()) return snap.val();
  }catch(e){
    console.warn("Firebase read fallback:", e?.message || e);
  }
  const fb = await getFallbackData();
  return path.split("/").reduce((acc, key) => acc?.[key], fb);
}

async function writePath(path, value){
  return set(ref(db, path), value);
}
async function updatePath(path, value){
  return update(ref(db, path), value);
}
async function removePath(path){
  return remove(ref(db, path));
}
async function pushPath(path, value){
  const r = push(ref(db, path));
  await set(r, value);
  return r.key;
}

function isAdmin(user){
  return !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export {
  auth, db, provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  readPath, writePath, updatePath, removePath, pushPath,
  isAdmin, ADMIN_EMAIL
};