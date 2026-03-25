import { Project, AppSettings } from "../types";

const PROJECTS_KEY = "ai_web_builder_projects";
const SETTINGS_KEY = "ai_web_builder_settings";

export const storage = {
  // Projects
  getProjects: (): Project[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      if (!data) return [];
      return JSON.parse(data, (key, value) => {
        if (key === "createdAt" || key === "updatedAt" || key === "timestamp") {
          return new Date(value);
        }
        return value;
      });
    } catch {
      return [];
    }
  },

  saveProjects: (projects: Project[]): void => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  getProject: (id: string): Project | undefined => {
    const projects = storage.getProjects();
    return projects.find((p) => p.id === id);
  },

  addProject: (project: Project): void => {
    const projects = storage.getProjects();
    projects.unshift(project);
    storage.saveProjects(projects);
  },

  updateProject: (id: string, updates: Partial<Project>): void => {
    const projects = storage.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date() };
      storage.saveProjects(projects);
    }
  },

  deleteProject: (id: string): void => {
    const projects = storage.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    storage.saveProjects(filtered);
  },

  // Settings
  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        return {
          uiStyle: "auto",
          baseUrl: "https://api.openai.com/v1",
          apiKey: "",
        };
      }
      return JSON.parse(data);
    } catch {
      return {
        uiStyle: "auto",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
      };
    }
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};
