import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { AuthState } from '../state/auth.state';

@Component({
  selector: 'app-branding-manager',
  standalone: true,
  template: '',
})
export class BrandingManagerComponent {
  private renderer: Renderer2;

  constructor(
    private authState: AuthState,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    
    this.authState.org$.subscribe(org => {
      if (org) {
        this.updateBranding(org.primaryColor || '#7C3AED');
      } else {
        this.resetBranding();
      }
    });
  }

  private updateBranding(color: string): void {
    // Inject dynamic CSS variables into the :root
    const root = document.documentElement;
    this.renderer.setStyle(root, '--color-primary', color);
    
    // Calculate lighter/darker shades (simplified for now)
    this.renderer.setStyle(root, '--color-primary-light', `${color}cc`);
    this.renderer.setStyle(root, '--color-primary-dark', `${color}ee`);
    
    console.log(`🎨 White-Label Branding Applied: ${color}`);
  }

  private resetBranding(): void {
    const root = document.documentElement;
    this.renderer.removeStyle(root, '--color-primary');
    this.renderer.removeStyle(root, '--color-primary-light');
    this.renderer.removeStyle(root, '--color-primary-dark');
  }
}

import { Component } from '@angular/core';
