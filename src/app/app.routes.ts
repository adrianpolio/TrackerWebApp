import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { LoginComponent } from './components/login/login';

export const routes: Routes = [
    { path: '', component: Home }, 
//    { path: '**', redirectTo: '' },
    { path: 'login', component: LoginComponent}
];
