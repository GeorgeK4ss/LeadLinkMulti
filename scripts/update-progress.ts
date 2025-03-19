import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ProgressUpdate {
  phase: string;
  task: string;
  status: '🟢' | '🟡' | '🔴' | '⭐' | '🐛' | '🔄';
  notes?: string;
}

interface BugReport {
  id: string;
  description: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
}

interface FeatureRequest {
  id: string;
  feature: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  requestedBy: string;
}

interface PerformanceMetric {
  metric: string;
  target: string;
  current: string;
  status: '🟢' | '🟡' | '🔴';
}

class ProgressTracker {
  private progressFilePath: string;
  private content: string;

  constructor() {
    this.progressFilePath = path.join(process.cwd(), 'PROGRESS.md');
    this.content = fs.readFileSync(this.progressFilePath, 'utf8');
  }

  public updateTask(update: ProgressUpdate): void {
    const pattern = new RegExp(`- \\[[ x]\\] ${update.task}`);
    const replacement = `- [${update.status === '🟢' ? 'x' : ' '}] ${update.task}`;
    this.content = this.content.replace(pattern, replacement);

    if (update.notes) {
      const today = new Date().toISOString().split('T')[0];
      const noteEntry = `- ${today}: ${update.notes}\n`;
      const notesSection = '## Notes & Updates';
      const notesIndex = this.content.indexOf(notesSection);
      this.content = this.content.slice(0, notesIndex + notesSection.length + 1) +
        noteEntry + this.content.slice(notesIndex + notesSection.length + 1);
    }
  }

  public addBug(bug: BugReport): void {
    const bugSection = '## Bug Tracking';
    const tableRow = `|${bug.id}|${bug.description}|${bug.status}|${bug.priority}|${bug.assignedTo}|\n`;
    this.addToTable(bugSection, tableRow);
  }

  public addFeature(feature: FeatureRequest): void {
    const featureSection = '## Feature Requests';
    const tableRow = `|${feature.id}|${feature.feature}|${feature.status}|${feature.priority}|${feature.requestedBy}|\n`;
    this.addToTable(featureSection, tableRow);
  }

  public updateMetric(metric: PerformanceMetric): void {
    const pattern = new RegExp(`\\|${metric.metric}.*\\|`);
    const replacement = `|${metric.metric}|${metric.target}|${metric.current}|${metric.status}|`;
    this.content = this.content.replace(pattern, replacement);
  }

  private addToTable(section: string, row: string): void {
    const sectionIndex = this.content.indexOf(section);
    const tableEnd = this.content.indexOf('\n\n', sectionIndex);
    this.content = this.content.slice(0, tableEnd) + row + this.content.slice(tableEnd);
  }

  public save(): void {
    const today = new Date().toISOString().split('T')[0];
    this.content = this.content.replace(/Last Updated: \[DATE\]/, `Last Updated: ${today}`);
    
    // Calculate next review date (1 week from now)
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 7);
    const nextReviewDate = nextReview.toISOString().split('T')[0];
    this.content = this.content.replace(/Next Review: \[DATE\]/, `Next Review: ${nextReviewDate}`);

    fs.writeFileSync(this.progressFilePath, this.content);
    
    // Commit changes if in a git repository
    try {
      execSync('git add PROGRESS.md');
      execSync('git commit -m "Update progress tracking [automated]"');
    } catch (error) {
      console.warn('Could not commit changes automatically:', error);
    }
  }
}

// Example usage:
const tracker = new ProgressTracker();

// Update a task
tracker.updateTask({
  phase: 'Project Setup',
  task: 'Initialize Next.js 14.1.0 project',
  status: '🟢',
  notes: 'Successfully initialized Next.js project with TypeScript configuration'
});

// Add a bug
tracker.addBug({
  id: 'BUG-001',
  description: 'Authentication token not refreshing properly',
  status: 'Open',
  priority: 'High',
  assignedTo: 'John Doe'
});

// Add a feature request
tracker.addFeature({
  id: 'FEAT-001',
  feature: 'Dark mode support',
  status: 'Under Review',
  priority: 'Medium',
  requestedBy: 'UX Team'
});

// Update a performance metric
tracker.updateMetric({
  metric: 'Page Load Time',
  target: '< 3s',
  current: '2.8s',
  status: '🟢'
});

// Save all changes
tracker.save(); 