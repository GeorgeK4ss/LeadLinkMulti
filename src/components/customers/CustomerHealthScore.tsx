import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CustomerService } from '@/lib/services/CustomerService';
import { Customer } from '@/types/customer';

interface CustomerHealthScoreProps {
  customer: Customer;
  tenantId: string;
  onUpdate?: () => void;
}

export function CustomerHealthScore({ customer, tenantId, onUpdate }: CustomerHealthScoreProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState({
    engagement: customer.healthScore.engagement,
    support: customer.healthScore.support,
    growth: customer.healthScore.growth,
    satisfaction: customer.healthScore.satisfaction,
    financials: customer.healthScore.financials,
  });
  const [notes, setNotes] = useState('');
  
  const customerService = new CustomerService();
  
  const handleScoreChange = (category: keyof typeof scores, value: number[]) => {
    setScores({
      ...scores,
      [category]: value[0],
    });
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await customerService.updateHealthScore(tenantId, customer.id, scores);
      
      // Add a note about the health score update if provided
      if (notes.trim()) {
        await customerService.addNote(tenantId, customer.id, {
          content: `Health Score Updated: ${notes}`,
          createdBy: 'system',
          pinned: false,
          category: 'general',
        });
      }
      
      toast({
        title: 'Health Score Updated',
        description: 'Customer health score has been successfully updated',
      });
      
      if (onUpdate) {
        onUpdate();
      }
      
      setNotes('');
    } catch (error) {
      console.error('Error updating health score:', error);
      toast({
        title: 'Error',
        description: 'Failed to update health score',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const calculateOverallScore = () => {
    return Math.round(
      (scores.engagement + 
       scores.support + 
       scores.growth + 
       scores.satisfaction + 
       scores.financials) / 5
    );
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    if (trend === 'improving') return '↗️';
    if (trend === 'declining') return '↘️';
    return '→';
  };
  
  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 40) return 'Needs Attention';
    if (score >= 25) return 'At Risk';
    return 'Critical';
  };
  
  const overallScore = calculateOverallScore();
  const overallScoreColor = getScoreColor(overallScore);
  const currentOverallScore = customer.healthScore.overall;
  const currentScoreColor = getScoreColor(currentOverallScore);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Health Score</CardTitle>
            <CardDescription>
              Last updated: {new Date(customer.healthScore.lastAssessmentDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className={`text-6xl font-bold ${currentScoreColor} mb-2`}>
                  {currentOverallScore}
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <span>{getScoreDescription(currentOverallScore)}</span>
                  <span className="ml-2 text-lg">
                    {getTrendIcon(customer.healthScore.trend)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Engagement</span>
                  <span className={getScoreColor(customer.healthScore.engagement)}>
                    {customer.healthScore.engagement}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${customer.healthScore.engagement >= 75 ? 'bg-green-500' : customer.healthScore.engagement >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${customer.healthScore.engagement}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Support</span>
                  <span className={getScoreColor(customer.healthScore.support)}>
                    {customer.healthScore.support}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${customer.healthScore.support >= 75 ? 'bg-green-500' : customer.healthScore.support >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${customer.healthScore.support}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Growth</span>
                  <span className={getScoreColor(customer.healthScore.growth)}>
                    {customer.healthScore.growth}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${customer.healthScore.growth >= 75 ? 'bg-green-500' : customer.healthScore.growth >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${customer.healthScore.growth}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Satisfaction</span>
                  <span className={getScoreColor(customer.healthScore.satisfaction)}>
                    {customer.healthScore.satisfaction}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${customer.healthScore.satisfaction >= 75 ? 'bg-green-500' : customer.healthScore.satisfaction >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${customer.healthScore.satisfaction}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <div className="flex justify-between text-sm">
                  <span>Financials</span>
                  <span className={getScoreColor(customer.healthScore.financials)}>
                    {customer.healthScore.financials}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${customer.healthScore.financials >= 75 ? 'bg-green-500' : customer.healthScore.financials >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${customer.healthScore.financials}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Update Health Score</CardTitle>
            <CardDescription>
              Adjust the sliders to update customer's health score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${overallScoreColor}`}>
                  {overallScore}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {getScoreDescription(overallScore)}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Engagement</Label>
                  <span className={getScoreColor(scores.engagement)}>{scores.engagement}</span>
                </div>
                <Slider
                  value={[scores.engagement]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleScoreChange('engagement', value)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Support</Label>
                  <span className={getScoreColor(scores.support)}>{scores.support}</span>
                </div>
                <Slider
                  value={[scores.support]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleScoreChange('support', value)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Growth</Label>
                  <span className={getScoreColor(scores.growth)}>{scores.growth}</span>
                </div>
                <Slider
                  value={[scores.growth]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleScoreChange('growth', value)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Satisfaction</Label>
                  <span className={getScoreColor(scores.satisfaction)}>{scores.satisfaction}</span>
                </div>
                <Slider
                  value={[scores.satisfaction]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleScoreChange('satisfaction', value)}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Financials</Label>
                  <span className={getScoreColor(scores.financials)}>{scores.financials}</span>
                </div>
                <Slider
                  value={[scores.financials]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleScoreChange('financials', value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this health score update..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Health Score'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Health Score Guidance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="font-semibold mb-2">Engagement (1-100)</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>75-100: Highly engaged, regular communication</li>
                <li>50-74: Moderate engagement, occasional contact</li>
                <li>0-49: Low engagement, minimal interaction</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold mb-2">Support (1-100)</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>75-100: Few support issues, quick resolution</li>
                <li>50-74: Moderate support needs</li>
                <li>0-49: High volume of support issues</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold mb-2">Growth (1-100)</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>75-100: Expanding usage, adding services</li>
                <li>50-74: Stable usage patterns</li>
                <li>0-49: Decreasing usage or downsizing</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold mb-2">Satisfaction (1-100)</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>75-100: Highly satisfied, provides referrals</li>
                <li>50-74: Generally satisfied with some concerns</li>
                <li>0-49: Dissatisfied, has expressed concerns</li>
              </ul>
            </div>
            
            <div>
              <div className="font-semibold mb-2">Financials (1-100)</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>75-100: On-time payments, increasing value</li>
                <li>50-74: Generally pays on time, stable value</li>
                <li>0-49: Payment issues, decreasing value</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 