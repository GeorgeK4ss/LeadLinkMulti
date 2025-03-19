import { FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Enum for document types
export enum DocumentType {
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  REPORT = 'report',
  LETTER = 'letter',
  FORM = 'form',
  CUSTOM = 'custom'
}

// Enum for document formats
export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
  TXT = 'txt',
  MARKDOWN = 'md'
}

// Enum for document generation status
export enum DocumentGenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Enum for placeholder types
export enum PlaceholderType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  TABLE = 'table',
  LIST = 'list',
  CONDITIONAL = 'conditional'
}

// Interface for document template
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  format: DocumentFormat;
  content: string;
  placeholders: Array<{
    key: string;
    type: PlaceholderType;
    label: string;
    description?: string;
    required: boolean;
    defaultValue?: any;
    options?: any[];
  }>;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  tags?: string[];
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// Interface for generated document
export interface GeneratedDocument {
  id: string;
  templateId: string;
  name: string;
  type: DocumentType;
  format: DocumentFormat;
  fileUrl: string;
  fileSize?: number;
  placeholderValues: Record<string, any>;
  status: DocumentGenerationStatus;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  version: number;
  metadata?: Record<string, any>;
}

// Interface for document generation request
export interface DocumentGenerationRequest {
  templateId: string;
  documentName: string;
  placeholderValues: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for generating documents from templates
 */
export class DocumentGenerationService {
  private firebaseApp: FirebaseApp;
  private db: ReturnType<typeof getFirestore>;
  private auth: ReturnType<typeof getAuth>;
  private storage: ReturnType<typeof getStorage>;
  private functions: ReturnType<typeof getFunctions>;

  constructor(firebaseApp: FirebaseApp) {
    this.firebaseApp = firebaseApp;
    this.db = getFirestore(firebaseApp);
    this.auth = getAuth(firebaseApp);
    this.storage = getStorage(firebaseApp);
    this.functions = getFunctions(firebaseApp);
  }

  /**
   * Create a new document template
   */
  async createTemplate(templateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create a document template');
      }

      const now = Timestamp.now();
      const template = {
        ...templateData,
        createdAt: now,
        updatedAt: now
      };

      const templateRef = await addDoc(collection(this.db, 'document_templates'), template);
      
      return {
        id: templateRef.id,
        ...template
      };
    } catch (error) {
      console.error('Error creating document template:', error);
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a document template
   */
  async updateTemplate(id: string, updates: Partial<Omit<DocumentTemplate, 'id' | 'createdAt' | 'createdBy'>>): Promise<DocumentTemplate> {
    try {
      const templateRef = doc(this.db, 'document_templates', id);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        throw new Error(`Document template with ID ${id} not found`);
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(templateRef, updatedData);

      const updatedDoc = await getDoc(templateRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as DocumentTemplate;
    } catch (error) {
      console.error('Error updating document template:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a document template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const templateRef = doc(this.db, 'document_templates', id);
      await deleteDoc(templateRef);
      return true;
    } catch (error) {
      console.error('Error deleting document template:', error);
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a document template by ID
   */
  async getTemplate(id: string): Promise<DocumentTemplate> {
    try {
      const templateRef = doc(this.db, 'document_templates', id);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        throw new Error(`Document template with ID ${id} not found`);
      }

      return {
        id: templateDoc.id,
        ...templateDoc.data()
      } as DocumentTemplate;
    } catch (error) {
      console.error('Error getting document template:', error);
      throw new Error(`Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all document templates
   */
  async getAllTemplates(options: {
    type?: DocumentType,
    isPublic?: boolean,
    tags?: string[],
    createdBy?: string,
    limit?: number
  } = {}): Promise<DocumentTemplate[]> {
    try {
      const {
        type,
        isPublic,
        tags,
        createdBy,
        limit: resultLimit = 50
      } = options;

      let templatesQuery = query(collection(this.db, 'document_templates'));

      if (type) {
        templatesQuery = query(templatesQuery, where('type', '==', type));
      }

      if (isPublic !== undefined) {
        templatesQuery = query(templatesQuery, where('isPublic', '==', isPublic));
      }

      if (createdBy) {
        templatesQuery = query(templatesQuery, where('createdBy', '==', createdBy));
      }

      if (tags && tags.length > 0) {
        // Firestore array-contains-any only supports up to 10 values
        const firstTenTags = tags.slice(0, 10);
        templatesQuery = query(templatesQuery, where('tags', 'array-contains-any', firstTenTags));
      }

      templatesQuery = query(templatesQuery, orderBy('createdAt', 'desc'), limit(resultLimit));

      const templatesSnapshot = await getDocs(templatesQuery);

      return templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentTemplate[];
    } catch (error) {
      console.error('Error getting document templates:', error);
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a document from a template
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<GeneratedDocument> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to generate a document');
      }

      // Get the template
      const template = await this.getTemplate(request.templateId);
      
      // Validate placeholder values
      this.validatePlaceholderValues(template, request.placeholderValues);

      // Create a document generation request in Firestore
      const now = Timestamp.now();
      const generationRequest: Omit<GeneratedDocument, 'id' | 'fileUrl'> = {
        templateId: template.id,
        name: request.documentName,
        type: template.type,
        format: template.format,
        placeholderValues: request.placeholderValues,
        status: DocumentGenerationStatus.PENDING,
        createdBy: currentUser.uid,
        createdAt: now,
        relatedEntityId: request.relatedEntityId,
        relatedEntityType: request.relatedEntityType,
        version: 1,
        metadata: request.metadata || {}
      };

      const documentRef = await addDoc(collection(this.db, 'generated_documents'), generationRequest);
      const documentId = documentRef.id;

      // Update status to processing
      await updateDoc(documentRef, {
        status: DocumentGenerationStatus.PROCESSING
      });

      try {
        // Call the document generation function (Cloud Function or custom implementation)
        const fileUrl = await this.processDocumentGeneration(documentId, template, request.placeholderValues);
        
        // Update the document with the file URL and status
        await updateDoc(documentRef, {
          fileUrl,
          status: DocumentGenerationStatus.COMPLETED,
          completedAt: Timestamp.now()
        });
        
        return {
          id: documentId,
          fileUrl,
          ...generationRequest,
          status: DocumentGenerationStatus.COMPLETED,
          completedAt: Timestamp.now()
        };
      } catch (error) {
        console.error('Error processing document generation:', error);
        
        // Update with error status
        await updateDoc(documentRef, {
          status: DocumentGenerationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    } catch (error) {
      console.error('Error generating document:', error);
      throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a generated document by ID
   */
  async getGeneratedDocument(id: string): Promise<GeneratedDocument> {
    try {
      const documentRef = doc(this.db, 'generated_documents', id);
      const documentDoc = await getDoc(documentRef);

      if (!documentDoc.exists()) {
        throw new Error(`Generated document with ID ${id} not found`);
      }

      return {
        id: documentDoc.id,
        ...documentDoc.data()
      } as GeneratedDocument;
    } catch (error) {
      console.error('Error getting generated document:', error);
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get generated documents by related entity
   */
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    limitCount = 20
  ): Promise<GeneratedDocument[]> {
    try {
      const documentsQuery = query(
        collection(this.db, 'generated_documents'),
        where('relatedEntityType', '==', entityType),
        where('relatedEntityId', '==', entityId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const documentsSnapshot = await getDocs(documentsQuery);

      return documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedDocument[];
    } catch (error) {
      console.error('Error getting documents by entity:', error);
      throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get generated documents by user
   */
  async getDocumentsByUser(
    userId: string,
    options: {
      type?: DocumentType,
      status?: DocumentGenerationStatus,
      limit?: number
    } = {}
  ): Promise<GeneratedDocument[]> {
    try {
      const {
        type,
        status,
        limit: resultLimit = 20
      } = options;

      let documentsQuery = query(
        collection(this.db, 'generated_documents'),
        where('createdBy', '==', userId)
      );

      if (type) {
        documentsQuery = query(documentsQuery, where('type', '==', type));
      }

      if (status) {
        documentsQuery = query(documentsQuery, where('status', '==', status));
      }

      documentsQuery = query(documentsQuery, orderBy('createdAt', 'desc'), limit(resultLimit));

      const documentsSnapshot = await getDocs(documentsQuery);

      return documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedDocument[];
    } catch (error) {
      console.error('Error getting documents by user:', error);
      throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a generated document
   */
  async deleteGeneratedDocument(id: string): Promise<boolean> {
    try {
      const documentRef = doc(this.db, 'generated_documents', id);
      await deleteDoc(documentRef);
      return true;
    } catch (error) {
      console.error('Error deleting generated document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a template file (HTML, DOCX, etc.)
   */
  async uploadTemplateFile(templateId: string, file: File | Blob | string, contentType: string): Promise<string> {
    try {
      const filePath = `document_templates/${templateId}/${Date.now()}_template`;
      const storageRef = ref(this.storage, filePath);
      
      let uploadTask;
      if (typeof file === 'string') {
        uploadTask = await uploadString(storageRef, file, 'raw', { contentType });
      } else {
        uploadTask = await uploadBytes(storageRef, file, { contentType });
      }
      
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the template with the file URL
      await this.updateTemplate(templateId, {
        content: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading template file:', error);
      throw new Error(`Failed to upload template file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a template thumbnail
   */
  async uploadTemplateThumbnail(templateId: string, file: File | Blob): Promise<string> {
    try {
      const filePath = `document_templates/${templateId}/thumbnail`;
      const storageRef = ref(this.storage, filePath);
      
      await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
      
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the template with the thumbnail URL
      await this.updateTemplate(templateId, {
        thumbnailUrl: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading template thumbnail:', error);
      throw new Error(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create document from scratch with HTML content
   */
  async createDocumentFromHtml(
    name: string,
    htmlContent: string,
    format: DocumentFormat,
    type: DocumentType = DocumentType.CUSTOM,
    options: {
      relatedEntityId?: string,
      relatedEntityType?: string,
      metadata?: Record<string, any>
    } = {}
  ): Promise<GeneratedDocument> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create a document');
      }

      // Create a temporary template
      const templateName = `${name}_template`;
      const now = Timestamp.now();
      
      const tempTemplate: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: templateName,
        type,
        format,
        content: htmlContent,
        placeholders: [],
        createdBy: currentUser.uid,
        isPublic: false,
        metadata: {
          isTemporary: true,
          generatedAt: now.toDate().toISOString()
        }
      };
      
      const template = await this.createTemplate(tempTemplate);
      
      // Generate the document using the temporary template
      const document = await this.generateDocument({
        templateId: template.id,
        documentName: name,
        placeholderValues: {},
        relatedEntityId: options.relatedEntityId,
        relatedEntityType: options.relatedEntityType,
        metadata: {
          ...options.metadata,
          isDirectGeneration: true
        }
      });
      
      return document;
    } catch (error) {
      console.error('Error creating document from HTML:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate placeholder values against template requirements
   * @private
   */
  private validatePlaceholderValues(template: DocumentTemplate, values: Record<string, any>): void {
    const requiredPlaceholders = template.placeholders.filter(p => p.required);
    
    for (const placeholder of requiredPlaceholders) {
      if (values[placeholder.key] === undefined || values[placeholder.key] === null) {
        throw new Error(`Missing required placeholder value: ${placeholder.label} (${placeholder.key})`);
      }
      
      // Type validation
      const value = values[placeholder.key];
      
      switch (placeholder.type) {
        case PlaceholderType.NUMBER:
          if (typeof value !== 'number') {
            throw new Error(`Invalid type for placeholder ${placeholder.label} (${placeholder.key}). Expected number, got ${typeof value}`);
          }
          break;
        case PlaceholderType.DATE:
          if (!(value instanceof Date) && !(typeof value === 'string' && !isNaN(Date.parse(value)))) {
            throw new Error(`Invalid date for placeholder ${placeholder.label} (${placeholder.key})`);
          }
          break;
        case PlaceholderType.BOOLEAN:
          if (typeof value !== 'boolean') {
            throw new Error(`Invalid type for placeholder ${placeholder.label} (${placeholder.key}). Expected boolean, got ${typeof value}`);
          }
          break;
      }
    }
  }

  /**
   * Process document generation
   * @private
   */
  private async processDocumentGeneration(
    documentId: string,
    template: DocumentTemplate,
    placeholderValues: Record<string, any>
  ): Promise<string> {
    try {
      // In a real implementation, this would handle document generation
      // This could be done via a Cloud Function, or using a third-party service
      
      // For this example, we'll mock the behavior
      if (template.format === DocumentFormat.PDF) {
        return await this.generatePdf(template, placeholderValues, documentId);
      } else if (template.format === DocumentFormat.DOCX) {
        return await this.generateDocx(template, placeholderValues, documentId);
      } else if (template.format === DocumentFormat.HTML) {
        return await this.generateHtml(template, placeholderValues, documentId);
      } else {
        throw new Error(`Unsupported document format: ${template.format}`);
      }
    } catch (error) {
      console.error('Error processing document generation:', error);
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF document
   * @private
   */
  private async generatePdf(
    template: DocumentTemplate,
    placeholderValues: Record<string, any>,
    documentId: string
  ): Promise<string> {
    try {
      // In a real implementation, this would use a PDF generation library or service
      // For this example, we'll call a Cloud Function
      const generatePdfFunction = httpsCallable<
        { templateId: string; documentId: string; placeholderValues: Record<string, any> },
        { fileUrl: string }
      >(this.functions, 'generatePdf');
      
      const result = await generatePdfFunction({
        templateId: template.id,
        documentId,
        placeholderValues
      });
      
      return result.data.fileUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate DOCX document
   * @private
   */
  private async generateDocx(
    template: DocumentTemplate,
    placeholderValues: Record<string, any>,
    documentId: string
  ): Promise<string> {
    try {
      // In a real implementation, this would use a DOCX generation library or service
      // For this example, we'll call a Cloud Function
      const generateDocxFunction = httpsCallable<
        { templateId: string; documentId: string; placeholderValues: Record<string, any> },
        { fileUrl: string }
      >(this.functions, 'generateDocx');
      
      const result = await generateDocxFunction({
        templateId: template.id,
        documentId,
        placeholderValues
      });
      
      return result.data.fileUrl;
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw error;
    }
  }

  /**
   * Generate HTML document
   * @private
   */
  private async generateHtml(
    template: DocumentTemplate,
    placeholderValues: Record<string, any>,
    documentId: string
  ): Promise<string> {
    try {
      let content = template.content;
      
      // Simple placeholder replacement for HTML
      for (const [key, value] of Object.entries(placeholderValues)) {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }
      
      // Save the generated HTML to storage
      const filePath = `generated_documents/${documentId}.html`;
      const storageRef = ref(this.storage, filePath);
      
      await uploadString(storageRef, content, 'raw', { contentType: 'text/html' });
      
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw error;
    }
  }

  /**
   * Get available templates for an entity type
   */
  async getTemplatesForEntityType(entityType: string): Promise<DocumentTemplate[]> {
    try {
      const templatesQuery = query(
        collection(this.db, 'document_templates'),
        where('metadata.applicableEntityTypes', 'array-contains', entityType),
        where('isPublic', '==', true),
        orderBy('name')
      );
      
      const templatesSnapshot = await getDocs(templatesQuery);
      
      return templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentTemplate[];
    } catch (error) {
      console.error('Error getting templates for entity type:', error);
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clone a template
   */
  async cloneTemplate(templateId: string, newName: string): Promise<DocumentTemplate> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to clone a template');
      }
      
      const template = await this.getTemplate(templateId);
      
      const clonedTemplateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        ...template,
        name: newName,
        createdBy: currentUser.uid,
        isPublic: false, // Default to private for cloned templates
        metadata: {
          ...template.metadata,
          clonedFrom: templateId,
          clonedAt: Timestamp.now().toDate().toISOString()
        }
      };
      
      return await this.createTemplate(clonedTemplateData);
    } catch (error) {
      console.error('Error cloning template:', error);
      throw new Error(`Failed to clone template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 