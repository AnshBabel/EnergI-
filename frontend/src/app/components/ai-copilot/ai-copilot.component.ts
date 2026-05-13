import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AuthState, User } from '../../state/auth.state';
import { Subscription } from 'rxjs';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating AI Toggle Button -->
    <button *ngIf="currentUser" class="ai-float-btn animate-in" (click)="toggleChat()" [class.active]="isOpen">
      <span class="ai-icon" *ngIf="!isOpen">⚡</span>
      <span class="ai-icon close-icon" *ngIf="isOpen">✕</span>
      <div class="glow-ring"></div>
    </button>

    <!-- Glassmorphic Chat Container -->
    <div *ngIf="currentUser && isOpen" class="ai-chat-drawer" [class.open]="isOpen">
      <div class="ai-header">
        <div class="ai-header-info">
          <div class="pulse-indicator"></div>
          <div>
            <h4 class="ai-title">EnergI Copilot</h4>
            <span class="ai-subtitle">Live Energy Assistant</span>
          </div>
        </div>
        <span *ngIf="isShowcaseActive" class="demo-badge">SHOWCASE</span>
      </div>

      <!-- Messages Body -->
      <div class="ai-body" #chatBody>
        <div *ngFor="let msg of messages" class="msg-row" [class.user]="msg.sender === 'user'">
          <div class="msg-bubble" [class.user]="msg.sender === 'user'" [innerHTML]="formatText(msg.text)">
          </div>
          <span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span>
        </div>

        <!-- Typing Indicator -->
        <div *ngIf="isTyping" class="msg-row">
          <div class="msg-bubble typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Chips -->
      <div class="ai-quick-chips">
        <button *ngFor="let chip of quickChips" class="chip-btn" (click)="sendQuickQuery(chip)">
          {{ chip }}
        </button>
      </div>

      <!-- Input Footer -->
      <form class="ai-footer" (submit)="sendMessage()">
        <input 
          type="text" 
          [(ngModel)]="userInput" 
          name="message" 
          placeholder="Ask about bills, forecasting, tariffs..."
          [disabled]="isTyping"
          autocomplete="off"
        />
        <button type="submit" class="send-btn" [disabled]="!userInput.trim() || isTyping">
          ➔
        </button>
      </form>
    </div>
  `,
  styles: [`
    .ai-float-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary, #7c3aed), #4c1d95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ai-float-btn:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 12px 40px rgba(124, 58, 237, 0.6);
    }
    .ai-float-btn.active {
      background: var(--color-surface-3, #1f2937);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transform: rotate(90deg);
    }
    .glow-ring {
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      border: 2px solid rgba(167, 139, 250, 0.4);
      opacity: 0.8;
      animation: pulseGlow 2s infinite;
    }
    @keyframes pulseGlow {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.2); opacity: 0; }
    }

    .ai-chat-drawer {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 520px;
      border-radius: 20px;
      backdrop-filter: blur(20px);
      background: rgba(30, 41, 59, 0.8); /* Sleek dark theme */
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    .ai-header {
      padding: 16px;
      background: rgba(15, 23, 42, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ai-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulseGreen 2.5s infinite;
    }
    @keyframes pulseGreen {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .ai-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.3px;
    }
    .ai-subtitle {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    }
    .demo-badge {
      background: rgba(124, 58, 237, 0.2);
      color: #a78bfa;
      border: 1px solid rgba(124, 58, 237, 0.3);
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .ai-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      max-width: 85%;
    }
    .msg-row.user {
      align-self: flex-end;
      align-items: flex-end;
    }
    .msg-bubble {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
      font-size: 13.5px;
      line-height: 1.45;
    }
    .msg-bubble.user {
      background: var(--color-primary, #7c3aed);
      color: white;
      border-bottom-right-radius: 2px;
    }
    .msg-time {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.35);
      padding: 0 4px;
    }

    /* Typing Animation */
    .typing-bubble {
      display: flex;
      gap: 5px;
      padding: 12px 16px;
    }
    .typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      animation: dotBounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes dotBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Quick Chips */
    .ai-quick-chips {
      padding: 8px 12px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      background: rgba(15, 23, 42, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      scrollbar-width: none;
    }
    .ai-quick-chips::-webkit-scrollbar {
      display: none;
    }
    .chip-btn {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      padding: 6px 12px;
      font-size: 11.5px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chip-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: white;
    }

    .ai-footer {
      padding: 12px;
      background: rgba(15, 23, 42, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      gap: 10px;
    }
    .ai-footer input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
      transition: all 0.3s ease;
    }
    .ai-footer input:focus {
      border-color: var(--color-primary, #7c3aed);
      background: rgba(255, 255, 255, 0.08);
    }
    .send-btn {
      background: var(--color-primary, #7c3aed);
      border: none;
      color: white;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .send-btn:hover {
      background: #6d28d9;
      transform: translateY(-1px);
    }
    .send-btn:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class AiCopilotComponent implements OnInit, OnDestroy {
  @ViewChild('chatBody') private chatBody?: ElementRef;

  isOpen = false;
  isTyping = false;
  userInput = '';
  currentUser: User | null = null;
  isShowcaseActive = false;

  messages: ChatMessage[] = [];
  quickChips: string[] = [
    'Predict my bill',
    'Show unpaid bills',
    'Explain active tariffs',
    'Scan for anomalies'
  ];

  private sub = new Subscription();

  constructor(
    private aiService: AiService,
    private showcaseService: ShowcaseService,
    private authState: AuthState,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Watch current user status to hide AI button if logged out
    this.sub.add(this.authState.user$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.isOpen = false;
      } else {
        this.resetChat();
      }
    }));

    // Watch showcase mode to switch simulation flows
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(mode => {
      this.isShowcaseActive = mode;
      if (this.currentUser) {
        this.resetChat();
      }
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  private resetChat(): void {
    this.messages = [
      {
        sender: 'assistant',
        text: `### Welcome, ${this.currentUser?.name}! ⚡
I am your **EnergI AI Copilot**. I analyze your smart meter and billing history in real-time to give you direct insights!

Ask me anything, or try selecting a quick action below.`,
        timestamp: new Date()
      }
    ];
    this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isTyping) return;

    // 1. Append User Message
    this.messages.push({
      sender: 'user',
      text,
      timestamp: new Date()
    });
    this.userInput = '';
    this.scrollToBottom();

    // 2. Trigger Typing Indicator
    this.isTyping = true;
    this.scrollToBottom();

    // 3. Make HTTP request
    this.aiService.getChatResponse(text, this.isShowcaseActive).subscribe({
      next: (res) => {
        this.messages.push({
          sender: 'assistant',
          text: res.response,
          timestamp: new Date()
        });
      },
      error: (err) => {
        this.messages.push({
          sender: 'assistant',
          text: `⚠️ **System Connection Interrupted**
Failed to communicate with the Copilot AI engine. Please ensure your development server is active.`,
          timestamp: new Date()
        });
      },
      complete: () => {
        this.isTyping = false;
        this.scrollToBottom();
      }
    });
  }

  sendQuickQuery(chip: string): void {
    this.userInput = chip;
    this.sendMessage();
  }

  scrollToBottom(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    }, 50);
  }

  /**
   * Safe text formatter that converts standard markdown bullet points, 
   * bolding, and headers into tidy HTML tags for proper Angular rendering.
   */
  formatText(raw: string): string {
    if (!raw) return '';
    let html = raw;

    // Headings (e.g. ### Title)
    html = html.replace(/^### (.*$)/gim, '<strong style="display:block; font-size: 15px; color: #a78bfa; margin-bottom: 6px;">$1</strong>');
    html = html.replace(/^## (.*$)/gim, '<strong style="display:block; font-size: 16px; color: #a78bfa; margin-bottom: 8px;">$1</strong>');

    // Bold text (e.g. **text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: white; font-weight: 600;">$1</strong>');

    // Code blocks/Inline highlights
    html = html.replace(/\`(.*?)\`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px;">$1</code>');

    // Bullet points
    html = html.replace(/^\* (.*$)/gim, '<div style="margin-left: 8px; margin-top: 4px; display: flex; align-items: flex-start; gap: 6px;"><span style="color: #a78bfa;">•</span> <span>$1</span></div>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }
}
