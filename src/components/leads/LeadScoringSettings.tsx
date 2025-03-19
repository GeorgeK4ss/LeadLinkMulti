import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LeadScoringService, ScoringCriteria } from '@/lib/services/LeadScoringService';

interface LeadScoringSettingsProps {
  tenantId: string;
}

export function LeadScoringSettings({ tenantId }: LeadScoringSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [criteria, setCriteria] = useState<ScoringCriteria | null>(null);
  const [activeTab, setActiveTab] = useState('engagement');
  
  const leadScoringService = new LeadScoringService();
  
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const tenantCriteria = await leadScoringService.getScoringCriteria(tenantId);
        setCriteria(tenantCriteria);
        setLoading(false);
      } catch (error) {
        console.error('Error loading scoring criteria:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scoring criteria. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    
    loadCriteria();
  }, [tenantId, toast]);
  
  const handleCriteriaChange = (category: keyof ScoringCriteria, value: number) => {
    if (!criteria) return;
    
    setCriteria({
      ...criteria,
      [category]: value
    });
  };
  
  const handleSave = async () => {
    if (!criteria) return;
    
    setLoading(true);
    try {
      await leadScoringService.updateScoringCriteria(tenantId, criteria);
      toast({
        title: 'Success',
        description: 'Scoring criteria updated successfully.',
      });
    } catch (error) {
      console.error('Error updating scoring criteria:', error);
      toast({
        title: 'Error',
        description: 'Failed to update scoring criteria. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecalculateScores = async () => {
    setRecalculating(true);
    try {
      await leadScoringService.updateAllLeadScores(tenantId);
      toast({
        title: 'Success',
        description: 'All lead scores have been recalculated.',
      });
    } catch (error) {
      console.error('Error recalculating lead scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate lead scores. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRecalculating(false);
    }
  };
  
  if (loading || !criteria) {
    return <div className="flex justify-center items-center h-64">Loading scoring criteria...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring Settings</h2>
          <p className="text-muted-foreground">Configure how leads are scored in your system.</p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRecalculateScores} 
            disabled={recalculating}
          >
            {recalculating ? 'Recalculating...' : 'Recalculate All Scores'}
          </Button>
          <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="fit">Fit</TabsTrigger>
          <TabsTrigger value="interest">Interest</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Configure scoring for lead engagement activities (max 25 points)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="emailClicks">Email Clicks (per click)</Label>
                    <span className="text-muted-foreground">{criteria.emailClicks} points</span>
                  </div>
                  <Slider
                    id="emailClicks"
                    value={[criteria.emailClicks]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('emailClicks', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="websiteVisits">Website Visits (per visit)</Label>
                    <span className="text-muted-foreground">{criteria.websiteVisits} points</span>
                  </div>
                  <Slider
                    id="websiteVisits"
                    value={[criteria.websiteVisits]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('websiteVisits', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="formSubmits">Form Submissions (per submission)</Label>
                    <span className="text-muted-foreground">{criteria.formSubmits} points</span>
                  </div>
                  <Slider
                    id="formSubmits"
                    value={[criteria.formSubmits]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('formSubmits', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="documentDownloads">Document Downloads (per download)</Label>
                    <span className="text-muted-foreground">{criteria.documentDownloads} points</span>
                  </div>
                  <Slider
                    id="documentDownloads"
                    value={[criteria.documentDownloads]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('documentDownloads', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="callAttendance">Call Attendance (per call)</Label>
                    <span className="text-muted-foreground">{criteria.callAttendance} points</span>
                  </div>
                  <Slider
                    id="callAttendance"
                    value={[criteria.callAttendance]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('callAttendance', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fit">
          <Card>
            <CardHeader>
              <CardTitle>Fit Metrics</CardTitle>
              <CardDescription>Configure scoring for how well the lead fits your ideal customer profile (max 25 points)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="budgetMatch">Budget Match</Label>
                    <span className="text-muted-foreground">Max {criteria.budgetMatch} points</span>
                  </div>
                  <Slider
                    id="budgetMatch"
                    value={[criteria.budgetMatch]}
                    min={0}
                    max={15}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('budgetMatch', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="industryMatch">Industry Match</Label>
                    <span className="text-muted-foreground">Max {criteria.industryMatch} points</span>
                  </div>
                  <Slider
                    id="industryMatch"
                    value={[criteria.industryMatch]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('industryMatch', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="companySize">Company Size</Label>
                    <span className="text-muted-foreground">Max {criteria.companySize} points</span>
                  </div>
                  <Slider
                    id="companySize"
                    value={[criteria.companySize]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('companySize', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="techStack">Technology Stack</Label>
                    <span className="text-muted-foreground">Max {criteria.techStack} points</span>
                  </div>
                  <Slider
                    id="techStack"
                    value={[criteria.techStack]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('techStack', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interest">
          <Card>
            <CardHeader>
              <CardTitle>Interest Metrics</CardTitle>
              <CardDescription>Configure scoring for indicators of lead interest (max 25 points)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="responseTime">Response Time</Label>
                    <span className="text-muted-foreground">Max {criteria.responseTime} points</span>
                  </div>
                  <Slider
                    id="responseTime"
                    value={[criteria.responseTime]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('responseTime', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="meetingRequests">Meeting Requests</Label>
                    <span className="text-muted-foreground">{criteria.meetingRequests} points</span>
                  </div>
                  <Slider
                    id="meetingRequests"
                    value={[criteria.meetingRequests]}
                    min={0}
                    max={15}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('meetingRequests', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="productQuestions">Product Questions</Label>
                    <span className="text-muted-foreground">{criteria.productQuestions} points</span>
                  </div>
                  <Slider
                    id="productQuestions"
                    value={[criteria.productQuestions]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('productQuestions', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pricingInquiries">Pricing Inquiries</Label>
                    <span className="text-muted-foreground">{criteria.pricingInquiries} points</span>
                  </div>
                  <Slider
                    id="pricingInquiries"
                    value={[criteria.pricingInquiries]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('pricingInquiries', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Metrics</CardTitle>
              <CardDescription>Configure scoring for purchase timeline factors (max 25 points)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="purchaseTimeframe">Purchase Timeframe</Label>
                    <span className="text-muted-foreground">Max {criteria.purchaseTimeframe} points</span>
                  </div>
                  <Slider
                    id="purchaseTimeframe"
                    value={[criteria.purchaseTimeframe]}
                    min={0}
                    max={15}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('purchaseTimeframe', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="decisionMakerInvolved">Decision Maker Involved</Label>
                    <span className="text-muted-foreground">{criteria.decisionMakerInvolved} points</span>
                  </div>
                  <Slider
                    id="decisionMakerInvolved"
                    value={[criteria.decisionMakerInvolved]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('decisionMakerInvolved', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="requirementsClarity">Requirements Clarity</Label>
                    <span className="text-muted-foreground">Max {criteria.requirementsClarity} points</span>
                  </div>
                  <Slider
                    id="requirementsClarity"
                    value={[criteria.requirementsClarity]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('requirementsClarity', value[0])}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="competitorEvaluation">Competitor Evaluation</Label>
                    <span className="text-muted-foreground">Max {criteria.competitorEvaluation} points</span>
                  </div>
                  <Slider
                    id="competitorEvaluation"
                    value={[criteria.competitorEvaluation]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => handleCriteriaChange('competitorEvaluation', value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Scoring Breakdown</CardTitle>
          <CardDescription>How leads are categorized based on their score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>Hot Leads:</div>
              <div>75-100 points</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>Warm Leads:</div>
              <div>40-74 points</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>Cold Leads:</div>
              <div>0-39 points</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Lead scores are calculated automatically based on the criteria above. 
            Each category can contribute up to 25 points to the total score.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 