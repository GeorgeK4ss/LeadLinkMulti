import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, arrayUnion, Timestamp } from 'firebase/firestore';
import { Lead } from '@/types/lead';
import { User } from '@/types/user';

export interface AssignmentRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  criteria: {
    leadSources?: string[];
    leadStatus?: string[];
    minLeadScore?: number;
    territory?: string[];
    industry?: string[];
    companySize?: string[];
  };
  assignTo: {
    userIds?: string[];
    roles?: string[];
    roundRobin: boolean;
    maxLeadsPerUser?: number;
  };
  priority: number;
  createdAt: string;
  lastUpdated: string;
}

export interface AssignmentResult {
  success: boolean;
  leadId: string;
  assignedTo?: string;
  ruleName?: string;
  message?: string;
}

export interface AssignmentStats {
  userId: string;
  displayName: string;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number;
  avgResponseTime: number; // in hours
  lastAssignedAt?: string;
}

export class LeadAssignmentService {
  /**
   * Get all assignment rules for a tenant
   */
  async getAssignmentRules(tenantId: string): Promise<AssignmentRule[]> {
    const rulesRef = collection(db, 'tenants', tenantId, 'assignmentRules');
    const q = query(rulesRef, orderBy('priority', 'asc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssignmentRule[];
  }
  
  /**
   * Create a new assignment rule
   */
  async createAssignmentRule(
    tenantId: string, 
    rule: Omit<AssignmentRule, 'id' | 'createdAt' | 'lastUpdated'>
  ): Promise<string> {
    const rulesRef = collection(db, 'tenants', tenantId, 'assignmentRules');
    
    const now = new Date().toISOString();
    const ruleWithDates = {
      ...rule,
      createdAt: now,
      lastUpdated: now
    };
    
    const docRef = await doc(rulesRef);
    await updateDoc(docRef, ruleWithDates);
    
    return docRef.id;
  }
  
  /**
   * Update an assignment rule
   */
  async updateAssignmentRule(
    tenantId: string,
    ruleId: string,
    updates: Partial<AssignmentRule>
  ): Promise<void> {
    const ruleRef = doc(db, 'tenants', tenantId, 'assignmentRules', ruleId);
    
    await updateDoc(ruleRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  }
  
  /**
   * Delete an assignment rule
   */
  async deleteAssignmentRule(tenantId: string, ruleId: string): Promise<void> {
    const ruleRef = doc(db, 'tenants', tenantId, 'assignmentRules', ruleId);
    await updateDoc(ruleRef, { isActive: false });
  }
  
  /**
   * Get assignment statistics for users in a tenant
   */
  async getAssignmentStats(tenantId: string): Promise<AssignmentStats[]> {
    // Get all users in the tenant
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('tenantId', '==', tenantId));
    const usersSnapshot = await getDocs(q);
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    
    // Get leads for the tenant
    const leadsRef = collection(db, 'tenants', tenantId, 'leads');
    const leadsSnapshot = await getDocs(leadsRef);
    
    const leads = leadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
    
    // Calculate stats for each user
    const stats: AssignmentStats[] = [];
    
    users.forEach(user => {
      const userLeads = leads.filter(lead => lead.assignedTo === user.id);
      const leadsAssigned = userLeads.length;
      const leadsConverted = userLeads.filter(lead => lead.status === 'closed').length;
      const conversionRate = leadsAssigned > 0 ? (leadsConverted / leadsAssigned) * 100 : 0;
      
      // Calculate average response time (time between assignment and first activity)
      let totalResponseTime = 0;
      let responsesCount = 0;
      
      userLeads.forEach(lead => {
        if (lead.assignedTo && lead.activities && lead.activities.length > 0) {
          // Find first activity after assignment
          // Use lastUpdated as a proxy for assignment time
          const assignmentTime = new Date(lead.lastUpdated).getTime();
          const firstActivityAfterAssignment = lead.activities
            .filter(activity => new Date(activity.createdAt).getTime() > assignmentTime)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          
          if (firstActivityAfterAssignment) {
            const responseTime = new Date(firstActivityAfterAssignment.createdAt).getTime() - assignmentTime;
            totalResponseTime += responseTime / (1000 * 60 * 60); // Convert to hours
            responsesCount++;
          }
        }
      });
      
      const avgResponseTime = responsesCount > 0 ? totalResponseTime / responsesCount : 0;
      
      // Find most recently assigned lead
      const mostRecentLead = userLeads
        .filter(lead => lead.assignedTo)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];

      stats.push({
        userId: user.id,
        displayName: user.displayName,
        leadsAssigned: userLeads.length,
        leadsConverted: userLeads.filter(lead => lead.status === 'closed').length,
        conversionRate,
        avgResponseTime,
        lastAssignedAt: mostRecentLead ? mostRecentLead.lastUpdated : undefined
      });
    });
    
    return stats;
  }
  
  /**
   * Manually assign a lead to a user
   */
  async assignLeadToUser(
    tenantId: string,
    leadId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    const leadRef = doc(db, 'tenants', tenantId, 'leads', leadId);
    const now = new Date().toISOString();
    
    // Update the lead
    await updateDoc(leadRef, {
      assignedTo: userId,
      assignedAt: now,
      lastUpdated: now
    });
    
    // Add an activity record if note is provided
    if (note) {
      await updateDoc(leadRef, {
        activities: arrayUnion({
          id: `assignment_${Date.now()}`,
          type: 'system',
          action: 'assign',
          timestamp: now,
          data: {
            assignedTo: userId,
            note
          }
        }),
      });
    }
  }
  
  /**
   * Auto-assign a lead based on rules
   */
  async autoAssignLead(tenantId: string, leadId: string): Promise<AssignmentResult> {
    // Get the lead
    const leadRef = doc(db, 'tenants', tenantId, 'leads', leadId);
    const leadSnap = await getDoc(leadRef);
    
    if (!leadSnap.exists()) {
      return {
        success: false,
        leadId,
        message: 'Lead not found'
      };
    }
    
    const lead = { id: leadSnap.id, ...leadSnap.data() } as Lead;
    
    // Skip if already assigned
    if (lead.assignedTo) {
      return {
        success: false,
        leadId,
        message: 'Lead is already assigned'
      };
    }
    
    // Get active assignment rules
    const rules = await this.getAssignmentRules(tenantId);
    const activeRules = rules.filter(rule => rule.isActive);
    
    if (activeRules.length === 0) {
      return {
        success: false,
        leadId,
        message: 'No active assignment rules found'
      };
    }
    
    // Find matching rule
    const matchingRule = this.findMatchingRule(lead, activeRules);
    
    if (!matchingRule) {
      return {
        success: false,
        leadId,
        message: 'No matching assignment rules found'
      };
    }
    
    // Determine user to assign to
    const assigneeId = await this.determineAssignee(tenantId, matchingRule);
    
    if (!assigneeId) {
      return {
        success: false,
        leadId,
        message: 'No eligible users found to assign lead'
      };
    }
    
    // Assign the lead
    await this.assignLeadToUser(
      tenantId, 
      leadId, 
      assigneeId, 
      `Automatically assigned via rule: ${matchingRule.name}`
    );
    
    return {
      success: true,
      leadId,
      assignedTo: assigneeId,
      ruleName: matchingRule.name
    };
  }
  
  /**
   * Find matching rule for a lead
   */
  private findMatchingRule(lead: Lead, rules: AssignmentRule[]): AssignmentRule | null {
    for (const rule of rules) {
      let matches = true;
      
      // Check criteria
      if (rule.criteria.leadSources && rule.criteria.leadSources.length > 0) {
        if (!lead.source || !rule.criteria.leadSources.includes(lead.source)) {
          matches = false;
        }
      }
      
      if (rule.criteria.leadStatus && rule.criteria.leadStatus.length > 0) {
        if (!lead.status || !rule.criteria.leadStatus.includes(lead.status)) {
          matches = false;
        }
      }
      
      if (rule.criteria.minLeadScore !== undefined && rule.criteria.minLeadScore > 0) {
        if (!lead.score || lead.score.total < rule.criteria.minLeadScore) {
          matches = false;
        }
      }
      
      if (rule.criteria.territory && rule.criteria.territory.length > 0) {
        const leadTerritory = lead.company?.address?.state || lead.company?.address?.country;
        if (!leadTerritory || !rule.criteria.territory.includes(leadTerritory)) {
          matches = false;
        }
      }
      
      if (rule.criteria.industry && rule.criteria.industry.length > 0) {
        if (!lead.company?.industry || !rule.criteria.industry.includes(lead.company.industry)) {
          matches = false;
        }
      }
      
      if (rule.criteria.companySize && rule.criteria.companySize.length > 0) {
        if (!lead.company?.size || !rule.criteria.companySize.includes(lead.company.size)) {
          matches = false;
        }
      }
      
      if (matches) {
        return rule;
      }
    }
    
    return null;
  }
  
  /**
   * Determine which user to assign a lead to based on a rule
   */
  private async determineAssignee(tenantId: string, rule: AssignmentRule): Promise<string | null> {
    const usersRef = collection(db, 'users');
    let eligibleUsers: User[] = [];
    
    // Filter by specified users if any
    if (rule.assignTo.userIds && rule.assignTo.userIds.length > 0) {
      const userQueries = rule.assignTo.userIds.map(async (userId) => {
        const userRef = doc(usersRef, userId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null;
      });
      
      const users = await Promise.all(userQueries);
      eligibleUsers = users.filter(user => user !== null) as User[];
    } 
    // Filter by roles if any
    else if (rule.assignTo.roles && rule.assignTo.roles.length > 0) {
      const q = query(
        usersRef, 
        where('tenantId', '==', tenantId),
        where('role', 'in', rule.assignTo.roles)
      );
      
      const querySnapshot = await getDocs(q);
      eligibleUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } 
    // No specific criteria, get all users in the tenant
    else {
      const q = query(usersRef, where('tenantId', '==', tenantId));
      const querySnapshot = await getDocs(q);
      eligibleUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    }
    
    // Filter out inactive users
    eligibleUsers = eligibleUsers.filter(user => user.status === 'active');
    
    if (eligibleUsers.length === 0) {
      return null;
    }
    
    // If maxLeadsPerUser is set, check current assignments
    if (rule.assignTo.maxLeadsPerUser) {
      const userAssignmentCounts = await this.getUserAssignmentCounts(tenantId);
      
      // Filter out users who already have max leads
      eligibleUsers = eligibleUsers.filter(user => {
        const count = userAssignmentCounts[user.id] || 0;
        return count < (rule.assignTo.maxLeadsPerUser || Infinity);
      });
      
      if (eligibleUsers.length === 0) {
        return null;
      }
      
      // Sort by assignment count (ascending)
      eligibleUsers.sort((a, b) => {
        const countA = userAssignmentCounts[a.id] || 0;
        const countB = userAssignmentCounts[b.id] || 0;
        return countA - countB;
      });
    }
    
    // Round robin assignment
    if (rule.assignTo.roundRobin) {
      // Get last assigned user for this rule
      const statsRef = doc(db, 'tenants', tenantId, 'stats', 'leadAssignment');
      const statsSnap = await getDoc(statsRef);
      
      let lastIndex = 0;
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        lastIndex = data.ruleLastIndex?.[rule.id] || 0;
      }
      
      // Calculate next index with wrap-around
      const nextIndex = (lastIndex + 1) % eligibleUsers.length;
      
      // Update the last index
      await updateDoc(statsRef, {
        [`ruleLastIndex.${rule.id}`]: nextIndex
      });
      
      return eligibleUsers[nextIndex].id;
    }
    
    // Default: assign to first eligible user
    return eligibleUsers[0].id;
  }
  
  /**
   * Get the number of leads assigned to each user
   */
  private async getUserAssignmentCounts(tenantId: string): Promise<Record<string, number>> {
    const leadsRef = collection(db, 'tenants', tenantId, 'leads');
    const q = query(leadsRef, where('assignedTo', '!=', null));
    
    const querySnapshot = await getDocs(q);
    
    const counts: Record<string, number> = {};
    
    querySnapshot.docs.forEach(doc => {
      const lead = doc.data() as Lead;
      if (lead.assignedTo) {
        counts[lead.assignedTo] = (counts[lead.assignedTo] || 0) + 1;
      }
    });
    
    return counts;
  }
  
  /**
   * Auto-assign all unassigned leads in a tenant
   */
  async autoAssignAllLeads(tenantId: string): Promise<AssignmentResult[]> {
    const leadsRef = collection(db, 'tenants', tenantId, 'leads');
    const q = query(leadsRef, where('assignedTo', '==', null));
    
    const querySnapshot = await getDocs(q);
    const unassignedLeads = querySnapshot.docs.map(doc => doc.id);
    
    const results = await Promise.all(
      unassignedLeads.map(leadId => this.autoAssignLead(tenantId, leadId))
    );
    
    return results;
  }
} 