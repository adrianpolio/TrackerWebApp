import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { LoginComponent } from './components/login/login';
import { UsersCreate } from './components/users-create/users-create';
import { ShipmentsCreate } from './components/shipments/shipments-create/shipments-create';
import { ShipmentsList } from './components/shipments/shipments-list/shipments-list';
import { ShipmentsDetail } from './components/shipments/shipments-detail/shipments-detail';
import { ShipmentsEdit } from './components/shipments/shipments-edit/shipments-edit';
import { TrackComponent } from './components/track/track';
import { CustomersComponent } from './components/admin.1/customers/customers';
import { UsersComponent } from './components/admin.1/users/users';
import { ShipmentsComponent } from './components/admin.1/shipments/shipments';

export const routes: Routes = [
    { path: '', component: Home }, 
//    { path: '**', redirectTo: '' },
    { path: 'login', component: LoginComponent},
    { path: 'register', component: UsersCreate },
    { path: 'shipments/create', component: ShipmentsCreate },
    { path: 'shipments/list', component: ShipmentsList },
    { path: 'shipments/detail/:id', component: ShipmentsDetail},
    { path: 'shipments/edit/:id', component: ShipmentsEdit},
    { path: 'track', component: TrackComponent }, 
    { path: 'admin/customers', component: CustomersComponent},
    { path: 'admin/users', component: UsersComponent},
    { path: 'admin/shipments', component: ShipmentsComponent}
];
