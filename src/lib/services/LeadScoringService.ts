import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Lead, LeadScore } from '@/types/lead';

// Define LeadQuality type locally
type LeadQuality = 'hot' | 'warm' | 'cold';

export interface ScoringCriteria {
  // Engagement metrics
  emailClicks: number;
  websiteVisits: number;
  formSubmits: number;
  documentDownloads: number;
  callAttendance: number;
  
  // Fit metrics
  budgetMatch: number;
  industryMatch: number;
  companySize: number;
  techStack: number;
  
  // Interest metrics
  responseTime: number;
  meetingRequests: number;
  productQuestions: number;
  pricingInquiries: number;
  
  // Timeline metrics
  purchaseTimeframe: number;
  decisionMakerInvolved: number;
  requirementsClarity: number;
  competitorEvaluation: number;
  
  // Weights
  weights: {
    engagement: number;
    fit: number;
    interest: number;
    timeline: number;
  };
}

export class LeadScoringService {
  private defaultCriteria: ScoringCriteria = {
    // Engagement metrics (max 25 points)
    emailClicks: 1,         // 1 point per click, max 5
    websiteVisits: 2,       // 2 points per visit, max 10
    formSubmits: 3,         // 3 points per submission, max 6
    documentDownloads: 2,   // 2 points per download, max 4
    callAttendance: 5,      // 5 points per call attendance
    
    // Fit metrics (max 25 points)
    budgetMatch: 10,        // 0-10 points based on budget alignment
    industryMatch: 5,       // 0-5 points for target industry
    companySize: 5,         // 0-5 points based on company size fit
    techStack: 5,           // 0-5 points for compatible tech stack
    
    // Interest metrics (max 25 points)
    responseTime: 5,        // 0-5 points (faster = higher)
    meetingRequests: 10,    // 10 points for requesting meetings
    productQuestions: 5,    // 5 points for detailed product questions
    pricingInquiries: 5,    // 5 points for pricing inquiries
    
    // Timeline metrics (max 25 points)
    purchaseTimeframe: 10,  // 0-10 points (sooner = higher)
    decisionMakerInvolved: 5, // 5 points if decision maker is involved
    requirementsClarity: 5, // 0-5 points for clear requirements
    competitorEvaluation: 5, // 0-5 points (fewer competitors = higher)
    
    // Weights for each category
    weights: {
      engagement: 0.3,
      fit: 0.3,
      interest: 0.2,
      timeline: 0.2
    }
  };
  
  /**
   * Calculate lead score based on activities and attributes
   */
  calculateLeadScore(
    lead: Lead,
    tenantId: string,
    criteria: Partial<ScoringCriteria> = {}
  ): LeadScore {
    // Merge default criteria with any tenant-specific overrides
    const scoringCriteria = { ...this.defaultCriteria, ...criteria };
    
    // Initialize score components
    let engagementScore = 0;
    let fitScore = 0;
    let interestScore = 0;
    let timelineScore = 5; // Default timeline score
    
    // Calculate engagement score
    if (lead.activities) {
      const emailClickCount = lead.activities.filter(a => a.type === 'email' && a.description.includes('click')).length;
      engagementScore += Math.min(emailClickCount * scoringCriteria.emailClicks, 5);
      
      const callAttendanceCount = lead.activities.filter(a => a.type === 'call' && a.description.includes('attended')).length;
      engagementScore += Math.min(callAttendanceCount * scoringCriteria.callAttendance, 5);
    }
    
    // Calculate fit score
    if (lead.company) {
      // Budget match (assuming lead.value is estimated deal value)
      if (lead.value) {
        const budgetTiers = [1000, 5000, 10000, 25000, 50000];
        const budgetIndex = budgetTiers.findIndex(tier => lead.value! <= tier);
        if (budgetIndex >= 0) {
          fitScore += Math.ceil((budgetIndex + 1) * 2 * scoringCriteria.budgetMatch / 10);
        } else {
          fitScore += scoringCriteria.budgetMatch; // Max score for highest tier
        }
      }
      
      // Industry match
      if (lead.company.industry) {
        // This would typically check against target industries for the tenant
        // For now, we'll give a fixed score if industry is provided
        fitScore += scoringCriteria.industryMatch;
      }
      
      // Company size fit
      if (lead.company.size) {
        // This would typically check against target company sizes for the tenant
        // For now, we'll give a score based on size categories
        const sizeMap: Record<string, number> = {
          '1-10': 1,
          '11-50': 2,
          '51-200': 3,
          '201-1000': 4,
          '1000+': 5
        };
        
        fitScore += (sizeMap[lead.company.size] || 0) * scoringCriteria.companySize / 5;
      }
    }
    
    // Calculate interest score
    if (lead.activities) {
      // Meeting requests
      const meetingRequests = lead.activities.filter(a => a.type === 'meeting').length;
      interestScore += meetingRequests > 0 ? scoringCriteria.meetingRequests : 0;
      
      // Product questions
      const productQuestions = lead.activities.filter(a => 
        (a.type === 'email' || a.type === 'call' || a.type === 'meeting') && 
        a.description.includes('product')
      ).length;
      interestScore += productQuestions > 0 ? scoringCriteria.productQuestions : 0;
      
      // Pricing questions
      const pricingQuestions = lead.activities.filter(a => 
        (a.type === 'email' || a.type === 'call' || a.type === 'meeting') && 
        a.description.includes('pricing')
      ).length;
      interestScore += pricingQuestions > 0 ? scoringCriteria.pricingInquiries : 0;
    }
    
    // Calculate total score (weighted)
    const totalScore = Math.round(
      (engagementScore * scoringCriteria.weights.engagement) +
      (fitScore * scoringCriteria.weights.fit) +
      (interestScore * scoringCriteria.weights.interest) +
      (timelineScore * scoringCriteria.weights.timeline)
    );
    
    // Determine lead quality based on score
    let quality: LeadQuality = 'cold';
    
    if (totalScore >= 80) {
      quality = 'hot';
    } else if (totalScore >= 50) {
      quality = 'warm';
    }
    
    // Return the score object
    return {
      total: totalScore,
      components: {
        engagement: engagementScore,
        fit: fitScore,
        interest: interestScore,
        timeline: timelineScore
      },
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Get scoring criteria for a tenant
   */
  async getScoringCriteria(tenantId: string): Promise<ScoringCriteria> {
    const criteriaRef = doc(db, 'tenants', tenantId, 'settings', 'leadScoring');
    const criteriaSnap = await getDoc(criteriaRef);
    
    if (criteriaSnap.exists()) {
      return { ...this.defaultCriteria, ...criteriaSnap.data() as Partial<ScoringCriteria> };
    }
    
    return this.defaultCriteria;
  }
  
  /**
   * Update scoring criteria for a tenant
   */
  async updateScoringCriteria(tenantId: string, criteria: Partial<ScoringCriteria>): Promise<void> {
    const criteriaRef = doc(db, 'tenants', tenantId, 'settings', 'leadScoring');
    await updateDoc(criteriaRef, criteria);
  }
  
  /**
   * Calculate and update scores for all leads in a tenant
   */
  async updateAllLeadScores(tenantId: string): Promise<number> {
    const leadsRef = collection(db, 'tenants', tenantId, 'leads');
    const leadsSnap = await getDocs(leadsRef);
    
    const criteria = await this.getScoringCriteria(tenantId);
    let updatedCount = 0;
    
    for (const leadDoc of leadsSnap.docs) {
      const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead;
      const score = this.calculateLeadScore(lead, tenantId, criteria);
      
      const leadRef = doc(db, 'tenants', tenantId, 'leads', lead.id);
      await updateDoc(leadRef, { score });
      
      updatedCount++;
    }
    
    return updatedCount;
  }
  
  /**
   * Get leads by quality (hot, warm, cold)
   */
  async getLeadsByQuality(tenantId: string, quality: LeadQuality): Promise<Lead[]> {
    const leadsRef = collection(db, 'tenants', tenantId, 'leads');
    const q = query(
      leadsRef,
      where('score.quality', '==', quality)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
  }
} 