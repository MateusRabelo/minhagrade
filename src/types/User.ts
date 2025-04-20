export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  institution?: string; // Nome da instituição acadêmica
  studentId?: string;   // Matrícula do aluno
  integrationStatus?: 'none' | 'pending' | 'complete' | 'error'; // Status da integração
  lastSync?: string;    // Data da última sincronização
}

export type AcademicInstitution = {
  id: string;
  name: string;
  domain: string;
  loginUrl: string;
  systemType: 'sigaa' | 'moodle' | 'blackboard' | 'other';
};

export interface IntegrationCredentials {
  username: string;
  password: string;
  institution: string;
} 