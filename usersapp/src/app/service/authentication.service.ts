import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {environment} from "../../environments/environment";
import {Observable} from "rxjs";
import { User } from '../model/user';
import { JwtHelperService } from "@auth0/angular-jwt";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  public host = environment.apiUrl;
  private token: any;
  private loggedInUsername: any;
  private jtwHelper = new JwtHelperService();

  constructor(private http: HttpClient) { }

  public login(user: User): Observable<HttpResponse<User>> {
    return this.http.post<User>(`${this.host}/user/login`, user, {observe: 'response'});
  }

  public register(user: User): Observable<User> {
    return this.http.post<User>(`${this.host}/user/register`, user);
  }

  public logOut(): void {
    this.token = null;
    this.loggedInUsername = null;
    if (typeof window !== 'undefined' && localStorage){
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('users');
    }

  }

  public saveToken(token: string): void {
    this.token = token;
    if(typeof window !== 'undefined' && localStorage){
      localStorage.setItem('token', token);
    }

  }

  public addUserToLocalCache(user: User): void {
    if(typeof window !== 'undefined' && localStorage){
      localStorage.setItem('user', JSON.stringify(user));
    }

  }

  public getUserFromLocalCache(): User | null {
    if(typeof window !== 'undefined' && localStorage){
      return JSON.parse(<string>localStorage.getItem('user'));
    }
    return null;
  }

  public loadToken(): void {
    if(typeof window !== 'undefined' && localStorage){
      this.token = localStorage.getItem('token');
    }
  }

  public getToken(): string {
    return this.token;
  }

  public isLoggedIn(): boolean {
    this.loadToken();
    if(this.token != null && this.token !== '') {
      if(this.jtwHelper.decodeToken(this.token).sub != null || '') {
        if(!this.jtwHelper.isTokenExpired(this.token)) {
          this.loggedInUsername = this.jtwHelper.decodeToken(this.token).sub;
          return true;
        }
      }
    }
    this.logOut();
    return false;
  }
}
