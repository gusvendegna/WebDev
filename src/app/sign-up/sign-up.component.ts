import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValueServiceService } from '../value-service.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  public validInfo: boolean;
  public first: string;
  public last: string;
  public email: string;
  public password: string;
  public passwordOne: string;
  public passwordTwo: string;
  public clickedSignUp: boolean;
  
  public response: Object[];

  constructor(private valueService: ValueServiceService, private router : Router){
    this.clickedSignUp = false;
    this.validInfo = true;
  }

  public createAccount(){
    if (this.first == null || this.last == null || this.email == null || this.passwordOne == null || this.passwordTwo == null) {
      console.log("Empty fields found.")
      this.validInfo = false;
    }
    
    if (this.email.includes('@chevron.com') || this.email.includes('@tengizchevroil.com')){
      console.log("Email is valid");
    }
    else{
      console.log("Email does not belong to a chevron domain or Email is a duplicate!");
      this.validInfo = false;
    }
    
    if (this.passwordOne === this.passwordTwo && this.passwordOne != null) {
      console.log("Provided passwords match!");
    }
    else{
      console.log("Passwords do not match!");
      this.validInfo = false;
    }

    if (this.passwordOne.length >= 8) {
	    console.log("minimum length achieved");
    } else {
	    console.log("not minimum length");
	    this.validInfo = false;
    }

    var character = '';
    var i = 0;
    while (i < this.passwordOne.length) {
	    character = this.passwordOne.charAt(i);
      if (character.match(character.toUpperCase()) && isNaN(parseInt(character))) {
			  console.log("character is uppercase");
			  break;
		  } else {
        console.log("character is not uppercase");
      }
      if (i === this.passwordOne.length - 1) {
        this.validInfo = false;
        break;
      }
	    i++;
    }

    character = '';
    i = 0;
    while (i < this.passwordOne.length){
	    character = this.passwordOne.charAt(i);
	    if (!isNaN(parseInt(character))) {
		    console.log("character is a number");
		    break;
	
	    } else {
        console.log("character is not a number");
      }
      if (i === this.passwordOne.length - 1) {
        this.validInfo = false;
        break;
      }
      i++;
    }

    this.valueService.checkEmail(this.email).subscribe((data:Object[]) => {
      if (data['status'] == '0') {
        console.log("Email is not a duplicate");
      } else {
        console.log('Email is a duplicate');
        this.validInfo = false;
        //alert('Duplicate Email');
      }      
      if (this.validInfo){ // all info on the sign up page was interpreted to be correct
        console.log("Sending information to database.");
        this.password = this.passwordOne;
  
        this.valueService.addUser(this.first, this.last, this.email, this.password, true, false)?.subscribe(_ => {
          //this.login();
        });
  
        // we need to route
        this.router.navigate(["/login"]);
      }
    })
    


  }

}
