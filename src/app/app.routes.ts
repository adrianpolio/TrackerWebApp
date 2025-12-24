import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { LoginComponent } from './components/login/login';
import { UsersCreate } from './components/users/users-create/users-create';
import { ShipmentsCreate } from './components/shipments/shipments-create/shipments-create';

export const routes: Routes = [
    { path: '', component: Home }, 
//    { path: '**', redirectTo: '' },
    { path: 'login', component: LoginComponent},
    { path: 'register', component: UsersCreate },
    { path: 'shipments/create', component: ShipmentsCreate }
];
