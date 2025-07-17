// src/lib/firebase/service.ts
import { db } from './config';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import type { Project, User } from '@/lib/types';

export async function getProjects(): Promise<Project[]> {
  const projectsCol = collection(db, 'projects');
  const projectSnapshot = await getDocs(projectsCol);
  const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  return projectList;
}

export async function getProject(id: string): Promise<Project | undefined> {
    const projectDocRef = doc(db, 'projects', id);
    const projectSnap = await getDoc(projectDocRef);

    if (projectSnap.exists()) {
        const projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
        
        // Firestore likely stores timestamps, so we need to convert them.
        // This is a simplification. A real app might need more complex logic.
        if(projectData.tasks) {
            projectData.tasks = projectData.tasks.map(task => ({
                ...task,
                plannedStartDate: new Date(task.plannedStartDate).toISOString(),
                plannedEndDate: new Date(task.plannedEndDate).toISOString(),
                 // Ensure nested properties are handled correctly if they are Firestore Timestamps
                actualStartDate: task.actualStartDate ? new Date(task.actualStartDate).toISOString() : undefined,
                actualEndDate: task.actualEndDate ? new Date(task.actualEndDate).toISOString() : undefined,
                baselineStartDate: task.baselineStartDate ? new Date(task.baselineStartDate).toISOString() : undefined,
                baselineEndDate: task.baselineEndDate ? new Date(task.baselineEndDate).toISOString() : undefined,
            }));
        }
        
        return projectData;

    } else {
        console.log("No such document!");
        return undefined;
    }
}

export async function getUsers(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  const userSnapshot = await getDocs(usersCol);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  return userList;
}

export async function createProject(projectData: Omit<Project, 'id'>): Promise<string> {
  const projectsCol = collection(db, 'projects');
  const docRef = await addDoc(projectsCol, projectData);
  return docRef.id;
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
    const projectDocRef = doc(db, 'projects', projectId);
    await updateDoc(projectDocRef, data);
}
