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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);
const storage = getStorage(app);

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

async function writePath(path, value){ return set(ref(db, path), value); }
async function updatePath(path, value){ return update(ref(db, path), value); }
async function removePath(path){ return remove(ref(db, path)); }
async function pushPath(path, value){
  const r = push(ref(db, path));
  await set(r, value);
  return r.key;
}

function isAdmin(user){
  return !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function uploadProductImage(file, folder="products"){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeName = (file.name || "image")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase();
  const path = `${folder}/${Date.now()}-${safeName}`;
  const imgRef = storageRef(storage, path);
  await uploadBytes(imgRef, file);
  return await getDownloadURL(imgRef);
}

export {
  auth, db, storage, provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  readPath, writePath, updatePath, removePath, pushPath,
  uploadProductImage,
  isAdmin, ADMIN_EMAIL
};