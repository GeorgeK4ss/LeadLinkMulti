import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import type { Company, CompanyStatus, CompanyPlan } from '@/types/company';

export class CompanyService {
  /**
   * Get the collection reference for companies
   */
  private getCompaniesRef() {
    return collection(db, 'companies');
  }

  /**
   * Create a new company
   */
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const companyWithDates = {
      ...company,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: company.status || 'active',
    };

    const docRef = await addDoc(this.getCompaniesRef(), companyWithDates);
    return docRef.id;
  }

  /**
   * Get a company by ID
   */
  async getCompany(id: string): Promise<Company | null> {
    const docRef = doc(this.getCompaniesRef(), id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as Company;
  }

  /**
   * Get all companies
   */
  async getCompanies(): Promise<Company[]> {
    const querySnapshot = await getDocs(
      query(this.getCompaniesRef(), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Company[];
  }

  /**
   * Get companies by status
   */
  async getCompaniesByStatus(status: CompanyStatus): Promise<Company[]> {
    const q = query(
      this.getCompaniesRef(),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Company[];
  }

  /**
   * Get companies by plan
   */
  async getCompaniesByPlan(plan: CompanyPlan): Promise<Company[]> {
    const q = query(
      this.getCompaniesRef(),
      where('plan', '==', plan),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Company[];
  }

  /**
   * Update a company
   */
  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    const companyRef = doc(this.getCompaniesRef(), id);
    
    await updateDoc(companyRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Update company status
   */
  async updateCompanyStatus(id: string, status: CompanyStatus): Promise<void> {
    await this.updateCompany(id, { status });
  }

  /**
   * Update company plan
   */
  async updateCompanyPlan(id: string, plan: CompanyPlan): Promise<void> {
    // Get the current company data
    const company = await this.getCompany(id);
    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }
    
    // Update only the plan in the billing object
    await this.updateCompany(id, { 
      billing: {
        ...company.billing,
        plan
      }
    });
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    const companyRef = doc(this.getCompaniesRef(), id);
    await deleteDoc(companyRef);
  }

  /**
   * Get tenants by company ID
   */
  async getCompanyTenants(companyId: string): Promise<string[]> {
    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.id);
  }

  /**
   * Get users by company ID
   */
  async getCompanyUsers(companyId: string): Promise<string[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.id);
  }
} 