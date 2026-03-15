import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  baseCurrency: string;
  dateFormat: string;
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  receiptProcessing: boolean;
  currencyAlerts: boolean;
  weeklyReports: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  industry?: string;
  address?: CompanyAddress;
  contact?: CompanyContact;
  settings: CompanySettings;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CompanyContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface CompanySettings {
  baseCurrency: string;
  fiscalYear: string;
  taxId?: string;
  registrationNumber?: string;
  invoicePrefix: string;
  receiptPrefix: string;
  reportPrefix: string;
  branding: CompanyBranding;
}

export interface CompanyBranding {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showLogo: boolean;
  showCompanyInfo: boolean;
  customFooter?: string;
}

export interface WelcomeMessage {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

class UserCompanyService {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private userCompanies: Map<string, string[]> = new Map(); // userId -> companyIds

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const usersData = localStorage.getItem('users');
      if (usersData) {
        const users = JSON.parse(usersData);
        users.forEach((user: User) => {
          this.users.set(user.id, user);
        });
      }

      const companiesData = localStorage.getItem('companies');
      if (companiesData) {
        const companies = JSON.parse(companiesData);
        companies.forEach((company: Company) => {
          this.companies.set(company.id, company);
        });
      }

      const userCompaniesData = localStorage.getItem('user-companies');
      if (userCompaniesData) {
        const userCompanies = JSON.parse(userCompaniesData);
        Object.entries(userCompanies).forEach(([userId, companyIds]) => {
          this.userCompanies.set(userId, companyIds as string[]);
        });
      }
    } catch (error) {
      console.error('Failed to load user/company data:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('users', JSON.stringify(Array.from(this.users.values())));
      localStorage.setItem('companies', JSON.stringify(Array.from(this.companies.values())));
      const userCompaniesObj: Record<string, string[]> = {};
      this.userCompanies.forEach((companyIds, userId) => {
        userCompaniesObj[userId] = companyIds;
      });
      localStorage.setItem('user-companies', JSON.stringify(userCompaniesObj));
    } catch (error) {
      console.error('Failed to save user/company data:', error);
    }
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const user: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        baseCurrency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          receiptProcessing: true,
          currencyAlerts: false,
          weeklyReports: false,
        },
        ...userData.preferences,
      },
    };

    this.users.set(user.id, user);
    this.userCompanies.set(user.id, []);
    this.saveToStorage();

    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
      preferences: {
        ...user.preferences,
        ...updates.preferences,
        notifications: {
          ...user.preferences.notifications,
          ...updates.preferences?.notifications,
        },
      },
    };

    this.users.set(userId, updatedUser);
    this.saveToStorage();

    return updatedUser;
  }

  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  getUserByEmail(email: string): User | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company {
    const company: Company = {
      ...companyData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        baseCurrency: 'USD',
        fiscalYear: 'calendar',
        invoicePrefix: 'INV',
        receiptPrefix: 'RCP',
        reportPrefix: 'RPT',
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          fontFamily: 'Inter',
          logoPosition: 'left',
          showLogo: true,
          showCompanyInfo: true,
        },
        ...companyData.settings,
      },
    };

    this.companies.set(company.id, company);

    // Add to user's companies
    const userCompanies = this.userCompanies.get(company.ownerId) || [];
    userCompanies.push(company.id);
    this.userCompanies.set(company.ownerId, userCompanies);

    this.saveToStorage();

    return company;
  }

  updateCompany(companyId: string, updates: Partial<Company>): Company | null {
    const company = this.companies.get(companyId);
    if (!company) return null;

    const updatedCompany = {
      ...company,
      ...updates,
      updatedAt: new Date(),
      settings: {
        ...company.settings,
        ...updates.settings,
        branding: {
          ...company.settings.branding,
          ...updates.settings?.branding,
        },
      },
    };

    this.companies.set(companyId, updatedCompany);
    this.saveToStorage();

    return updatedCompany;
  }

  getCompany(companyId: string): Company | null {
    return this.companies.get(companyId) || null;
  }

  getUserCompanies(userId: string): Company[] {
    const companyIds = this.userCompanies.get(userId) || [];
    return companyIds
      .map(id => this.companies.get(id))
      .filter(Boolean) as Company[];
  }

  addUserToCompany(userId: string, companyId: string): boolean {
    const user = this.users.get(userId);
    const company = this.companies.get(companyId);

    if (!user || !company) return false;

    const userCompanies = this.userCompanies.get(userId) || [];
    if (!userCompanies.includes(companyId)) {
      userCompanies.push(companyId);
      this.userCompanies.set(userId, userCompanies);
      this.saveToStorage();
    }

    return true;
  }

  removeUserFromCompany(userId: string, companyId: string): boolean {
    const userCompanies = this.userCompanies.get(userId);
    if (!userCompanies) return false;

    const index = userCompanies.indexOf(companyId);
    if (index > -1) {
      userCompanies.splice(index, 1);
      this.userCompanies.set(userId, userCompanies);
      this.saveToStorage();
      return true;
    }

    return false;
  }

  generateWelcomeMessage(user: User, company?: Company): WelcomeMessage {
    const userName = user.name.split(' ')[0]; // First name only
    const companyName = company?.name || 'your business';

    const messages = [
      {
        title: `Welcome to 2K AI Accounting Systems, ${userName}!`,
        message: `Your company, ${companyName}, is now fully set up and ready to thrive with our intelligent tools. Start by uploading your first receipt to see the magic happen!`,
        actionText: 'Upload Receipt',
        actionUrl: '/transactions',
      },
      {
        title: `🎉 Welcome aboard, ${userName}!`,
        message: `${companyName} is now powered by 2K AI Accounting Systems. Our AI will help you process receipts, manage expenses, and generate beautiful reports automatically.`,
        actionText: 'Get Started',
        actionUrl: '/dashboard',
      },
      {
        title: `You're all set, ${userName}!`,
        message: `${companyName} has been successfully configured with 2K AI Accounting Systems. Experience the future of accounting with smart receipt scanning, currency conversion, and automated reporting.`,
        actionText: 'View Dashboard',
        actionUrl: '/dashboard',
      },
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  updateUserAvatar(userId: string, avatarUrl: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.avatar = avatarUrl;
    user.updatedAt = new Date();
    this.saveToStorage();

    return true;
  }

  updateCompanyLogo(companyId: string, logoUrl: string): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;

    company.logo = logoUrl;
    company.updatedAt = new Date();
    this.saveToStorage();

    return true;
  }

  getDefaultCompany(): Company {
    return {
      id: '',
      name: '',
      description: '',
      industry: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      contact: {
        phone: '',
        email: '',
        website: '',
      },
      settings: {
        baseCurrency: 'USD',
        fiscalYear: 'calendar',
        invoicePrefix: 'INV',
        receiptPrefix: 'RCP',
        reportPrefix: 'RPT',
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          fontFamily: 'Inter',
          logoPosition: 'left',
          showLogo: true,
          showCompanyInfo: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: '',
    };
  }

  getDefaultUser(): User {
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        baseCurrency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          receiptProcessing: true,
          currencyAlerts: false,
          weeklyReports: false,
        },
      },
    };
  }

  // Statistics and analytics
  getUserCount(): number {
    return this.users.size;
  }

  getCompanyCount(): number {
    return this.companies.size;
  }

  getActiveUsers(): User[] {
    return Array.from(this.users.values()).filter(user => {
      // Consider user active if updated in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return user.updatedAt > thirtyDaysAgo;
    });
  }

  getCompaniesByIndustry(): Record<string, number> {
    const industryCount: Record<string, number> = {};
    
    this.companies.forEach(company => {
      const industry = company.industry || 'Other';
      industryCount[industry] = (industryCount[industry] || 0) + 1;
    });

    return industryCount;
  }
}

export const userCompanyService = new UserCompanyService();
