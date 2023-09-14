import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as bcrypt from "bcryptjs";

@Injectable({
  providedIn: 'root'
})
export class ValueServiceService {

  constructor(private http: HttpClient) { }

  configUrl = 'http://localhost:5000';

  addUser(first:string, last:string, email:string, password:string, is_enabled:boolean, is_admin:boolean){
    now: String;
    var username: string = email.substring(0, email.lastIndexOf('@'));
    const now = formatDate(new Date());
    return this.http.post(`${this.configUrl}/addUser`, { first, last, email, password, now, is_enabled, is_admin, username})
    .pipe(
      catchError(err => { return this.handleError(err) })
    );

  }

  getUser(email:string){
    result:Array<Object>; 
    let params = new HttpParams();
    params = params.append('email', email);
    return this.http.get<Object[]>(`${this.configUrl}/getUser`, {params: params});
  }

  checkEmail(email:string) {
    result:Array<Object>;
    let params = new HttpParams();
    params = params.append('email', email);
    return this.http.get<Object[]>(`${this.configUrl}/checkUniqueEmail`, {params:params});
  }

  getTargetUserInfo(email:string){
    result:Array<Object>; 
    let params = new HttpParams();
    params = params.append('email', email);
    return this.http.get<Object[]>(`${this.configUrl}/getTargetUserInfo`, {params: params});
  }

  getLeaderboardInfo(testFlag: string){
    result:Array<Object>; 
    let params = new HttpParams();
    const now = formatDate(new Date());
    const UID = localStorage.getItem('UID')
    params = params.append('CID', localStorage.getItem('current_challenge'));
    params = params.append('curr_date', now);
    params = params.append('UID', UID);
    params = params.append('testFlag', testFlag);
    return this.http.get<Object[]>(`${this.configUrl}/getLeaderboardInfo`, {params : params});
  }

  updateTargetUser(is_enabled:boolean, is_admin:boolean, email:string, ){
    now: String;
    const now = formatDate(new Date());
    return this.http.post(`${this.configUrl}/updateTargetUser`, { is_enabled, is_admin, email, now})
    .pipe(
      catchError(err => { return this.handleError(err) })
    );
    
  }



  updatePassword(email:string, password:string){
    now: String;
    const now = formatDate(new Date());
    return this.http.post(`${this.configUrl}/changePassword`, { email, password, now})
    .pipe(
      catchError(err => { return this.handleError(err) })
    );
  }

  getChallengeInfo(){
    result:Array<Object>; 
    let params = new HttpParams();
    params = params.append('CID', localStorage.getItem('current_challenge'));
    return this.http.get<Object[]>(`${this.configUrl}/getChallengeInfo`, {params : params});
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  public getChallanges(){
    return this.http.get<Object[]>(`${this.configUrl}/challenges`);
  }

  public downloadSample(){
    let params = new HttpParams();
    params = params.append('CID', localStorage.getItem('current_challenge'));
    return this.http.get(`${this.configUrl}/downloadSampleFile` , {params : params, responseType: 'blob'} );
  }
  
}

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

function formatDate(date: Date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
  );
}