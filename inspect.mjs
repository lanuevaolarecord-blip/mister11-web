import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyAIsUQOnmsMLOt16kwis2s7ODv-mpzeeWo',
  authDomain:        'mister11.firebaseapp.com',
  projectId:         'mister11',
  storageBucket:     'mister11.firebasestorage.app',
  messagingSenderId: '954668402587',
  appId:             '1:954668402587:web:ccae27f1bba1396d2b833e',
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth);
  console.log("✅ Autenticado de forma anónima.");
  
  const db = getFirestore(app);

  console.log("=== Buscando equipos de club ===");
  const clubsSnap = await getDocs(collection(db, 'clubs'));
  for (const clubDoc of clubsSnap.docs) {
    const clubData = clubDoc.data();
    console.log(`Club ID: ${clubDoc.id}, Nombre: ${clubData.name}, OwnerId: ${clubData.ownerId}`);
    
    const teamsSnap = await getDocs(collection(db, 'clubs', clubDoc.id, 'teams'));
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data();
      console.log(`  Team ID: ${teamDoc.id}, Nombre: ${teamData.nombre}, Categoria: ${teamData.categoria}, source: ${teamData.source}`);
      console.log(`    assignedCoaches:`, teamData.assignedCoaches);
    }
  }

  console.log("\n=== Buscando usuarios y perfiles ===");
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    console.log(`User ID: ${userDoc.id}, Email: ${userData.email}, clubId: ${userData.clubId}, clubRole: ${userData.clubRole}`);
    
    const personalTeamsSnap = await getDocs(collection(db, 'users', userDoc.id, 'teams'));
    for (const teamDoc of personalTeamsSnap.docs) {
      const teamData = teamDoc.data();
      console.log(`  Personal Team ID: ${teamDoc.id}, Nombre: ${teamData.nombre}, source: ${teamData.source}`);
    }
  }
}

main().catch(console.error);
