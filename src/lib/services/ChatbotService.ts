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
  Timestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Enum for supported chatbot platforms
export enum ChatbotPlatform {
  DIALOGFLOW = 'dialogflow',
  WATSON = 'watson',
  CUSTOM = 'custom',
  RASA = 'rasa',
  BOTPRESS = 'botpress'
}

// Enum for chatbot integration status
export enum ChatbotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CONFIGURING = 'configuring',
  ERROR = 'error'
}

// Interface for chatbot conversation
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

// Interface for chat session
export interface ChatSession {
  id: string;
  userId: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  messages: ChatMessage[];
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Interface for chatbot configuration
export interface ChatbotConfig {
  id: string;
  name: string;
  platform: ChatbotPlatform;
  status: ChatbotStatus;
  apiKey?: string;
  projectId?: string;
  endpointUrl?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  created: Timestamp;
  updated: Timestamp;
  metadata?: Record<string, any>;
}

// Interface for chatbot intent
export interface ChatbotIntent {
  id: string;
  chatbotId: string;
  name: string;
  trainingPhrases: string[];
  responses: string[];
  parameters?: Array<{
    name: string;
    entityType: string;
    required: boolean;
    prompts?: string[];
  }>;
  contexts?: string[];
  metadata?: Record<string, any>;
}

/**
 * Service for managing chatbot integrations and conversations
 */
export class ChatbotService {
  private firebaseApp: FirebaseApp;
  private db: ReturnType<typeof getFirestore>;
  private storage: ReturnType<typeof getStorage>;
  private auth: ReturnType<typeof getAuth>;

  constructor(firebaseApp: FirebaseApp) {
    this.firebaseApp = firebaseApp;
    this.db = getFirestore(firebaseApp);
    this.storage = getStorage(firebaseApp);
    this.auth = getAuth(firebaseApp);
  }

  /**
   * Create a new chatbot configuration
   */
  async createChatbot(config: Omit<ChatbotConfig, 'id' | 'created' | 'updated'>): Promise<ChatbotConfig> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create a chatbot');
      }

      const chatbotData = {
        ...config,
        created: Timestamp.now(),
        updated: Timestamp.now()
      };

      const chatbotRef = await addDoc(collection(this.db, 'chatbots'), chatbotData);
      return {
        id: chatbotRef.id,
        ...chatbotData
      } as ChatbotConfig;
    } catch (error) {
      console.error('Error creating chatbot:', error);
      throw new Error(`Failed to create chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing chatbot configuration
   */
  async updateChatbot(id: string, updates: Partial<Omit<ChatbotConfig, 'id' | 'created'>>): Promise<ChatbotConfig> {
    try {
      const chatbotRef = doc(this.db, 'chatbots', id);
      const chatbotDoc = await getDoc(chatbotRef);

      if (!chatbotDoc.exists()) {
        throw new Error(`Chatbot with ID ${id} not found`);
      }

      const updatedData = {
        ...updates,
        updated: Timestamp.now()
      };

      await updateDoc(chatbotRef, updatedData);

      const updatedDoc = await getDoc(chatbotRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ChatbotConfig;
    } catch (error) {
      console.error('Error updating chatbot:', error);
      throw new Error(`Failed to update chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a chatbot configuration
   */
  async deleteChatbot(id: string): Promise<boolean> {
    try {
      const chatbotRef = doc(this.db, 'chatbots', id);
      await deleteDoc(chatbotRef);
      return true;
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      throw new Error(`Failed to delete chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a chatbot configuration by ID
   */
  async getChatbot(id: string): Promise<ChatbotConfig> {
    try {
      const chatbotRef = doc(this.db, 'chatbots', id);
      const chatbotDoc = await getDoc(chatbotRef);

      if (!chatbotDoc.exists()) {
        throw new Error(`Chatbot with ID ${id} not found`);
      }

      return {
        id: chatbotDoc.id,
        ...chatbotDoc.data()
      } as ChatbotConfig;
    } catch (error) {
      console.error('Error getting chatbot:', error);
      throw new Error(`Failed to retrieve chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all chatbot configurations
   */
  async getAllChatbots(): Promise<ChatbotConfig[]> {
    try {
      const chatbotsQuery = query(collection(this.db, 'chatbots'));
      const chatbotsSnapshot = await getDocs(chatbotsQuery);

      return chatbotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatbotConfig[];
    } catch (error) {
      console.error('Error getting all chatbots:', error);
      throw new Error(`Failed to retrieve chatbots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new intent for a chatbot
   */
  async createIntent(intent: Omit<ChatbotIntent, 'id'>): Promise<ChatbotIntent> {
    try {
      const intentRef = await addDoc(collection(this.db, 'chatbot_intents'), intent);
      return {
        id: intentRef.id,
        ...intent
      };
    } catch (error) {
      console.error('Error creating intent:', error);
      throw new Error(`Failed to create intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing intent
   */
  async updateIntent(id: string, updates: Partial<Omit<ChatbotIntent, 'id'>>): Promise<ChatbotIntent> {
    try {
      const intentRef = doc(this.db, 'chatbot_intents', id);
      await updateDoc(intentRef, updates);

      const updatedDoc = await getDoc(intentRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ChatbotIntent;
    } catch (error) {
      console.error('Error updating intent:', error);
      throw new Error(`Failed to update intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an intent
   */
  async deleteIntent(id: string): Promise<boolean> {
    try {
      const intentRef = doc(this.db, 'chatbot_intents', id);
      await deleteDoc(intentRef);
      return true;
    } catch (error) {
      console.error('Error deleting intent:', error);
      throw new Error(`Failed to delete intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all intents for a specific chatbot
   */
  async getChatbotIntents(chatbotId: string): Promise<ChatbotIntent[]> {
    try {
      const intentsQuery = query(
        collection(this.db, 'chatbot_intents'),
        where('chatbotId', '==', chatbotId)
      );
      const intentsSnapshot = await getDocs(intentsQuery);

      return intentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatbotIntent[];
    } catch (error) {
      console.error('Error getting chatbot intents:', error);
      throw new Error(`Failed to retrieve intents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start a new chat session
   */
  async startChatSession(userId: string, metadata?: Record<string, any>): Promise<ChatSession> {
    try {
      const session = {
        userId,
        startedAt: Timestamp.now(),
        messages: [],
        metadata: metadata || {}
      };

      const sessionRef = await addDoc(collection(this.db, 'chat_sessions'), session);
      
      return {
        id: sessionRef.id,
        ...session
      } as ChatSession;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw new Error(`Failed to start chat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * End a chat session
   */
  async endChatSession(sessionId: string): Promise<ChatSession> {
    try {
      const sessionRef = doc(this.db, 'chat_sessions', sessionId);
      await updateDoc(sessionRef, {
        endedAt: Timestamp.now()
      });

      const updatedDoc = await getDoc(sessionRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ChatSession;
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw new Error(`Failed to end chat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to the chatbot and get a response
   */
  async sendMessage(
    sessionId: string, 
    content: string, 
    chatbotId: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    try {
      // Get the session
      const sessionRef = doc(this.db, 'chat_sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error(`Chat session with ID ${sessionId} not found`);
      }
      
      const session = sessionDoc.data() as ChatSession;
      
      // Check if session is still active
      if (session.endedAt) {
        throw new Error('Cannot send message to ended chat session');
      }
      
      // Get the chatbot configuration
      const chatbot = await this.getChatbot(chatbotId);
      
      // Create user message
      const userMessage: ChatMessage = {
        id: doc(collection(this.db, 'temp')).id, // Generate a unique ID
        sender: 'user',
        content,
        timestamp: Timestamp.now(),
        metadata
      };
      
      // Process the message based on the chatbot platform
      const botResponse = await this.processChatbotResponse(chatbot, content, session);
      
      // Save both messages to the session
      const updatedMessages = [...(session.messages || []), userMessage, botResponse];
      
      await updateDoc(sessionRef, {
        messages: updatedMessages,
        updated: Timestamp.now()
      });
      
      return botResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a user message and generate a response based on the chatbot platform
   * @private
   */
  private async processChatbotResponse(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<ChatMessage> {
    // This is a simplified implementation
    // In a real app, this would integrate with the specific chatbot platform's API
    try {
      let responseContent = '';
      
      switch (chatbot.platform) {
        case ChatbotPlatform.DIALOGFLOW:
          responseContent = await this.callDialogflowAPI(chatbot, userMessage, session);
          break;
        case ChatbotPlatform.WATSON:
          responseContent = await this.callWatsonAPI(chatbot, userMessage, session);
          break;
        case ChatbotPlatform.RASA:
          responseContent = await this.callRasaAPI(chatbot, userMessage, session);
          break;
        case ChatbotPlatform.BOTPRESS:
          responseContent = await this.callBotpressAPI(chatbot, userMessage, session);
          break;
        case ChatbotPlatform.CUSTOM:
          responseContent = await this.callCustomAPI(chatbot, userMessage, session);
          break;
        default:
          responseContent = chatbot.fallbackMessage || "I'm sorry, I couldn't process your request.";
      }
      
      // Create bot response message
      return {
        id: doc(collection(this.db, 'temp')).id, // Generate a unique ID
        sender: 'bot',
        content: responseContent,
        timestamp: Timestamp.now()
      };
    } catch (error) {
      console.error('Error processing chatbot response:', error);
      
      // Return a fallback message if there's an error
      return {
        id: doc(collection(this.db, 'temp')).id,
        sender: 'bot',
        content: chatbot.fallbackMessage || "I'm sorry, I encountered an error processing your request.",
        timestamp: Timestamp.now(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Call DialogFlow API
   * @private
   */
  private async callDialogflowAPI(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<string> {
    // Implement DialogFlow API integration
    // This is a placeholder - actual implementation would use the DialogFlow API
    if (!chatbot.apiKey || !chatbot.projectId) {
      throw new Error('DialogFlow integration requires API key and project ID');
    }

    try {
      // In a real implementation, you would call the DialogFlow API here
      // This is a simplified mock implementation
      return `DialogFlow response to: ${userMessage}`;
    } catch (error) {
      console.error('Error calling DialogFlow API:', error);
      throw error;
    }
  }

  /**
   * Call Watson API
   * @private
   */
  private async callWatsonAPI(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<string> {
    // Implement Watson API integration
    if (!chatbot.apiKey || !chatbot.endpointUrl) {
      throw new Error('Watson integration requires API key and endpoint URL');
    }

    try {
      // In a real implementation, you would call the Watson API here
      return `Watson response to: ${userMessage}`;
    } catch (error) {
      console.error('Error calling Watson API:', error);
      throw error;
    }
  }

  /**
   * Call Rasa API
   * @private
   */
  private async callRasaAPI(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<string> {
    if (!chatbot.endpointUrl) {
      throw new Error('Rasa integration requires endpoint URL');
    }

    try {
      // In a real implementation, you would call the Rasa API here
      return `Rasa response to: ${userMessage}`;
    } catch (error) {
      console.error('Error calling Rasa API:', error);
      throw error;
    }
  }

  /**
   * Call Botpress API
   * @private
   */
  private async callBotpressAPI(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<string> {
    if (!chatbot.apiKey || !chatbot.endpointUrl) {
      throw new Error('Botpress integration requires API key and endpoint URL');
    }

    try {
      // In a real implementation, you would call the Botpress API here
      return `Botpress response to: ${userMessage}`;
    } catch (error) {
      console.error('Error calling Botpress API:', error);
      throw error;
    }
  }

  /**
   * Call Custom API
   * @private
   */
  private async callCustomAPI(
    chatbot: ChatbotConfig, 
    userMessage: string, 
    session: ChatSession
  ): Promise<string> {
    if (!chatbot.endpointUrl) {
      throw new Error('Custom integration requires endpoint URL');
    }

    try {
      // For custom integrations, make a generic API call to the provided endpoint
      const response = await fetch(chatbot.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(chatbot.apiKey ? { 'Authorization': `Bearer ${chatbot.apiKey}` } : {})
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: session.id,
          context: session.context || {}
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.message || data.content || 'No response provided';
    } catch (error) {
      console.error('Error calling custom API:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user
   */
  async getUserChatHistory(userId: string): Promise<ChatSession[]> {
    try {
      const sessionsQuery = query(
        collection(this.db, 'chat_sessions'),
        where('userId', '==', userId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      return sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
    } catch (error) {
      console.error('Error getting user chat history:', error);
      throw new Error(`Failed to retrieve chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a chat session by ID
   */
  async getChatSession(sessionId: string): Promise<ChatSession> {
    try {
      const sessionRef = doc(this.db, 'chat_sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error(`Chat session with ID ${sessionId} not found`);
      }

      return {
        id: sessionDoc.id,
        ...sessionDoc.data()
      } as ChatSession;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error(`Failed to retrieve chat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a training file for a chatbot (e.g., for custom intents or training data)
   */
  async uploadTrainingFile(
    chatbotId: string, 
    file: File, 
    fileType: string
  ): Promise<string> {
    try {
      const filename = `chatbots/${chatbotId}/training/${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, filename);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Optionally, you could store a reference to this file in Firestore
      await addDoc(collection(this.db, 'chatbot_files'), {
        chatbotId,
        filename,
        downloadURL,
        fileType,
        uploadedAt: Timestamp.now()
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading training file:', error);
      throw new Error(`Failed to upload training file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 