"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { EmailTemplate, EmailCategory, getEmailCategories, extractTemplateVariables } from '@/lib/emailUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Mail, 
  FileText, 
  Edit, 
  Trash, 
  Copy, 
  Check, 
  AlertCircle,
  Eye,
  Code
} from 'lucide-react';

export default function EmailTemplatesPage() {
  const { user, tenant } = useAuth();
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, initializeDefaultTemplates } = useEmailTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'custom' as EmailCategory
  });
  
  const categories = getEmailCategories();
  
  useEffect(() => {
    if (selectedTemplate) {
      setFormData({
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
        category: selectedTemplate.category
      });
    }
  }, [selectedTemplate]);
  
  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view this page.</p>
      </div>
    );
  }
  
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateTemplate = async () => {
    try {
      await createTemplate(formData);
      setIsCreating(false);
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'custom'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    }
  };
  
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateTemplate(selectedTemplate.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template. Please try again.');
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteTemplate(id);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };
  
  const handleInitializeDefaults = async () => {
    if (!confirm('This will add default templates to your account. Continue?')) return;
    
    try {
      await initializeDefaultTemplates();
    } catch (error) {
      console.error('Error initializing default templates:', error);
      alert('Failed to initialize default templates. Please try again.');
    }
  };
  
  const getTemplateVariables = (template: EmailTemplate) => {
    return extractTemplateVariables(template);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
            <p className="text-muted-foreground">
              Create and manage email templates for your communications.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleInitializeDefaults}>
              <FileText className="mr-2 h-4 w-4" />
              Load Defaults
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Categories</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div 
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${selectedCategory === 'all' ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <span>All Templates</span>
                    <Badge>{templates.length}</Badge>
                  </div>
                  
                  {categories.map(category => (
                    <div 
                      key={category.value}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${selectedCategory === category.value ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      <span>{category.label}</span>
                      <Badge>{templates.filter(t => t.category === category.value).length}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Email Templates</CardTitle>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search templates..."
                      className="w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-red-500">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span>Error loading templates. Please try again.</span>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No templates found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
                      Create your first template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTemplates.map(template => (
                      <div 
                        key={template.id}
                        className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-muted/50 border-primary' : ''}`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{template.category}</Badge>
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setIsEditing(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedTemplate && !isEditing && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <CardDescription>Template Details</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <div className="mt-1 p-2 border rounded-md bg-muted/50">
                        {selectedTemplate.subject}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <div className="mt-1">
                        <Badge>{selectedTemplate.category}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Template Variables</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {getTemplateVariables(selectedTemplate).map(variable => (
                          <Badge key={variable} variant="outline" className="bg-muted">
                            <Code className="mr-1 h-3 w-3" />
                            {variable}
                          </Badge>
                        ))}
                        {getTemplateVariables(selectedTemplate).length === 0 && (
                          <span className="text-sm text-muted-foreground">No variables found</span>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-sm font-medium">Email Body</Label>
                      <div className="mt-1 p-3 border rounded-md bg-muted/50 max-h-[300px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Template Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for your communications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Welcome to Our Platform!"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as EmailCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label htmlFor="body">Email Body (HTML)</Label>
                <Textarea
                  id="body"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="<h1>Hello {{name}},</h1><p>Welcome to our platform...</p>"
                  className="min-h-[200px] font-mono"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use {'{{'} variableName {'}}' } syntax for dynamic content.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Make changes to your email template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="edit-subject">Email Subject</Label>
                <Input
                  id="edit-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as EmailCategory }))}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label htmlFor="edit-body">Email Body (HTML)</Label>
                <Textarea
                  id="edit-body"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  className="min-h-[200px] font-mono"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use {'{{'} variableName {'}}' } syntax for dynamic content.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
            {selectedTemplate && (
              <>
                <div className="bg-muted p-2 rounded mb-4">
                  <p className="text-sm font-medium">Subject: {selectedTemplate.subject}</p>
                </div>
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 