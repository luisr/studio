// src/lib/supabase/service.ts
import { supabase } from './config';
import type { Project, User } from '@/lib/types';
import { DEFAULT_PASSWORD, DEFAULT_AVATAR } from '../constants';

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      manager:users!projects_manager_id_fkey(*),
      team:project_team(
        role,
        user:users(*)
      )
    `);

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data || [];
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      manager:users!projects_manager_id_fkey(*),
      team:project_team(
        role,
        user:users(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return undefined; // Not found
    }
    console.error('Error fetching project:', error);
    throw error;
  }

  return data;
}

export async function getUsers(): Promise<User[]> {
  // Super admin hardcoded
  const superAdmin: User = {
    id: 'super-admin-001',
    name: 'Luis Ribeiro',
    email: 'luis.ribeiro@beachpark.com.br',
    password: DEFAULT_PASSWORD,
    role: 'Admin',
    avatar: DEFAULT_AVATAR,
    status: 'active',
    mustChangePassword: false,
  };

  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  const userList = data || [];
  
  // Ensure the super admin is always present and is the first user
  const adminExists = userList.some(u => u.email === superAdmin.email);
  if (!adminExists) {
    return [superAdmin, ...userList];
  }

  // If admin exists from DB, make sure it's up-to-date and first
  return [superAdmin, ...userList.filter(u => u.email !== superAdmin.email)];
}

export async function createProject(projectData: Omit<Project, 'id'>): Promise<string> {
  // First, insert the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description,
      manager_id: projectData.manager.id,
      planned_start_date: projectData.plannedStartDate,
      planned_end_date: projectData.plannedEndDate,
      actual_start_date: projectData.actualStartDate,
      actual_end_date: projectData.actualEndDate,
      planned_budget: projectData.plannedBudget,
      actual_cost: projectData.actualCost,
      tasks: projectData.tasks,
      kpis: projectData.kpis,
      baseline_saved_at: projectData.baselineSavedAt,
      configuration: projectData.configuration,
      critical_path: projectData.criticalPath,
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
    throw projectError;
  }

  // Then, insert team members
  if (projectData.team && projectData.team.length > 0) {
    const teamInserts = projectData.team.map(member => ({
      project_id: project.id,
      user_id: member.user.id,
      role: member.role,
    }));

    const { error: teamError } = await supabase
      .from('project_team')
      .insert(teamInserts);

    if (teamError) {
      console.error('Error creating team members:', teamError);
      // Note: In a real app, you might want to rollback the project creation
      throw teamError;
    }
  }

  return project.id;
}

export async function updateProject(projectId: string, data: Partial<Omit<Project, 'id'>>): Promise<void> {
  // Convert the data to match database schema
  const updateData: any = {};
  
  if (data.name) updateData.name = data.name;
  if (data.description) updateData.description = data.description;
  if (data.manager) updateData.manager_id = data.manager.id;
  if (data.plannedStartDate) updateData.planned_start_date = data.plannedStartDate;
  if (data.plannedEndDate) updateData.planned_end_date = data.plannedEndDate;
  if (data.actualStartDate) updateData.actual_start_date = data.actualStartDate;
  if (data.actualEndDate) updateData.actual_end_date = data.actualEndDate;
  if (data.plannedBudget !== undefined) updateData.planned_budget = data.plannedBudget;
  if (data.actualCost !== undefined) updateData.actual_cost = data.actualCost;
  if (data.tasks) updateData.tasks = data.tasks;
  if (data.kpis) updateData.kpis = data.kpis;
  if (data.baselineSavedAt) updateData.baseline_saved_at = data.baselineSavedAt;
  if (data.configuration) updateData.configuration = data.configuration;
  if (data.criticalPath) updateData.critical_path = data.criticalPath;

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  // Update team if provided
  if (data.team) {
    // Delete existing team members
    await supabase
      .from('project_team')
      .delete()
      .eq('project_id', projectId);

    // Insert new team members
    if (data.team.length > 0) {
      const teamInserts = data.team.map(member => ({
        project_id: projectId,
        user_id: member.user.id,
        role: member.role,
      }));

      const { error: teamError } = await supabase
        .from('project_team')
        .insert(teamInserts);

      if (teamError) {
        console.error('Error updating team members:', teamError);
        throw teamError;
      }
    }
  }
}

export async function createUser(userData: Omit<User, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      avatar: userData.avatar,
      status: userData.status,
      phone: userData.phone,
      must_change_password: userData.mustChangePassword,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data.id;
}

export async function updateUser(userId: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
  const updateData: any = {};
  
  if (userData.name) updateData.name = userData.name;
  if (userData.email) updateData.email = userData.email;
  if (userData.password) updateData.password = userData.password;
  if (userData.role) updateData.role = userData.role;
  if (userData.avatar) updateData.avatar = userData.avatar;
  if (userData.status) updateData.status = userData.status;
  if (userData.phone) updateData.phone = userData.phone;
  if (userData.mustChangePassword !== undefined) updateData.must_change_password = userData.mustChangePassword;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}