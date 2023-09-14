import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { HomeComponent } from './home/home.component';
import { SubmissionsComponent } from './submissions/submissions.component';
import { SettingsComponent } from './settings/settings.component';
import { AuthGuard } from './shared/auth.guard';

const routes: Routes = [

  {path: '', component:LoginComponent},
  {path: 'login', component:LoginComponent},
  {path: 'signup', component:SignUpComponent},
  {path: 'home', component:HomeComponent, canActivate: [AuthGuard]},
  {path: 'submissions', component:SubmissionsComponent, canActivate: [AuthGuard] },
  {path: 'settings', component:SettingsComponent, canActivate: [AuthGuard]}

];

@NgModule({
  imports: [RouterModule.forRoot(routes), IonicModule],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
