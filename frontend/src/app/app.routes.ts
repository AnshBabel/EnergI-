import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

// Admin Pages
import { DashboardComponent as AdminDashboard } from './pages/admin/dashboard.component';
import { UsersComponent as AdminUsers } from './pages/admin/users.component';
import { TariffComponent as AdminTariff } from './pages/admin/tariff.component';
import { BillsComponent as AdminBills } from './pages/admin/bills.component';
import { DisputesComponent as AdminDisputes } from './pages/admin/disputes.component';
import { AdminPaymentsComponent } from './pages/admin/payments.component';

import { NotificationsComponent } from './pages/shared/notifications/notifications.component';
import { PaymentStatusComponent } from './pages/shared/payment-status/payment-status.component';


// Consumer Pages
import { DashboardComponent as ConsumerDashboard } from './pages/consumer/dashboard.component';
import { BillsComponent as ConsumerBills } from './pages/consumer/bills.component';
import { DisputesComponent as ConsumerDisputes } from './pages/consumer/disputes.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'payment/status', component: PaymentStatusComponent, canActivate: [authGuard] },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: AdminUsers },
      { path: 'tariff', component: AdminTariff },
      { path: 'bills', component: AdminBills },
      { path: 'disputes', component: AdminDisputes },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Consumer Routes
  {
    path: 'consumer',
    canActivate: [authGuard, roleGuard('CONSUMER')],
    children: [
      { path: 'dashboard', component: ConsumerDashboard },
      { path: 'bills', component: ConsumerBills },
      { path: 'disputes', component: ConsumerDisputes },
      { path: 'notifications', component: NotificationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
