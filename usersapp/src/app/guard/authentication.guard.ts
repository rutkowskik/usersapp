import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Injectable} from "@angular/core";
import {AuthenticationService} from "../service/authentication.service";


@Injectable({providedIn: 'root'})
export class AuthenticationGuard implements CanActivate {

  constructor(private authenticationService : AuthenticationService, private router: Router) {}

  //if you call backend then return Observable
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) : boolean {
    return this.isUserLoggedIn();
  }

  private isUserLoggedIn() : boolean {
    if(this.authenticationService.isLoggedIn()){
      return true;
    }
    this.router.navigate(['/login']);
    // TODO send notification to user
    return false;
  }

}
