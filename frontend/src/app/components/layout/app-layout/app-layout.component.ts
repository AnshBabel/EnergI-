import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthState, User, Org } from '../../../state/auth.state';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.component.html',
  styles: []
})
export class AppLayoutComponent implements OnInit {
  user: User | null = null;
  org: Org | null = null;

  constructor(
    private authState: AuthState,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authState.user$.subscribe(user => this.user = user);
    this.authState.org$.subscribe(org => this.org = org);
  }

  handleLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
