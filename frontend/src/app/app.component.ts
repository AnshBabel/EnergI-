import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { TenantService } from './services/tenant.service';
import { BrandingManagerComponent } from './components/branding-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BrandingManagerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    // Initialize tenant branding from subdomain first
    this.tenantService.init();
    
    // Initialize auth state (check localStorage, fetch me info)
    this.authService.init();
  }
}
