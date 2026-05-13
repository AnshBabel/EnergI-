import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OrgService } from './org.service';

export interface TenantInfo {
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private tenantSubject = new BehaviorSubject<TenantInfo | null>(null);
  public tenant$ = this.tenantSubject.asObservable();
  
  private renderer: Renderer2;

  constructor(
    private orgService: OrgService,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public init(): void {
    const slug = this.detectTenantSlug();
    if (slug) {
      this.orgService.getPublicBrandingBySlug(slug).subscribe({
        next: (res) => {
          if (res && res.org) {
            const tenantInfo: TenantInfo = {
              slug: res.org.slug,
              name: res.org.name,
              logoUrl: res.org.logoUrl,
              primaryColor: res.org.primaryColor || '#7C3AED'
            };
            this.tenantSubject.next(tenantInfo);
            this.applyTenantBranding(tenantInfo.primaryColor);
            console.log(`[TenantService] Loaded tenant: ${tenantInfo.name}`);
          }
        },
        error: (err) => {
          console.warn(`[TenantService] Could not load tenant branding for slug: ${slug}`);
        }
      });
    }
  }

  public get currentTenant(): TenantInfo | null {
    return this.tenantSubject.value;
  }

  private detectTenantSlug(): string | null {
    const hostname = window.location.hostname;
    // For localhost testing, e.g., 'green-valley.localhost'
    // For production, e.g., 'green-valley.energi.app'
    
    const parts = hostname.split('.');
    
    // Check if it's an IP address or simply 'localhost'
    if (hostname === 'localhost' || hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/)) {
      return null; // No subdomain
    }

    if (parts.length >= 2) {
      // Typically the first part is the subdomain
      // (e.g. green-valley in green-valley.energi.app or green-valley.localhost)
      const subdomain = parts[0];
      
      // If the domain is something like 'www.energi.app', we might want to ignore 'www'
      if (subdomain !== 'www') {
        return subdomain;
      }
    }
    return null;
  }

  private applyTenantBranding(color: string): void {
    const root = document.documentElement;
    this.renderer.setStyle(root, '--color-primary', color);
    this.renderer.setStyle(root, '--color-primary-light', `${color}cc`);
    this.renderer.setStyle(root, '--color-primary-dark', `${color}ee`);
  }
}
