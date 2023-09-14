import { NgModule, Component, ContentChild } from '@angular/core';
import { AppComponent } from '../app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValueServiceService } from '../value-service.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as bcrypt from "bcryptjs";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public email: string;
  public password: string;
  public passwordValid: boolean;
  
  public response: Object[];

  constructor(private valueService: ValueServiceService, private router : Router){}
  
  public login() {
    
    if (/\s/.test(this.email)){
      // a space exists, maybe someone is trying SQL injection?
      // either way, make them try again
      alert("invalid email");
      return;
    }

    this.valueService.getUser(this.email).subscribe((data: Object[]) => {
      this.response = data;
      this.passwordValid = false;
    
      // check response to see if the user exists
      resp : String;
      var resp = JSON.stringify(this.response[0]);
      try {
        resp = resp.replaceAll(":", ",");
        var splitResp = resp.split(",");
      }
      catch {
        alert("invalid username or password")
      }
      
      if (bcrypt.compareSync(this.password, splitResp[9].replaceAll("\"", "")) == true) {
        this.passwordValid = true;
      }

      if ((this.response.length == 1 && splitResp[15]) && this.passwordValid == true) { // account is enabled as well
        // backend found a single entry in the databse that matches the provided credentials
        localStorage.setItem('is_admin', splitResp[21]);
        var first_name = splitResp[3].substring(1);
        first_name = first_name.slice(0, -1);
        localStorage.setItem('first_name', first_name);
        localStorage.setItem('UID', splitResp[1]);
        localStorage.setItem('current_challenge', '1');
        localStorage.setItem('email', this.email);
        localStorage.setItem('password', this.password); // probably not needed? It's the hash, so just in case!
        this.router.navigate(['home']); // authguard should let us do this now
      }
      else {
        alert("invalid username or password")
      }

    });
  }
}
