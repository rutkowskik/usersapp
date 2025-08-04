import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {User} from "../model/user";
import {UserService} from "../service/user.service";
import {Router} from "@angular/router";
import {NotificationService} from "../service/notification.service";
import {NotificationType} from "../enum/notification-type.enum";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthenticationService} from "../service/authentication.service";

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users: User[]=[];
  public user: User | undefined;
  public refreshing: boolean = false;
  private subscriptions: Subscription [] = [];
  isAdmin: boolean = true;
  selectedUser: User | undefined;
  fileName: any;

  constructor(private userService: UserService,
              private notificationService: NotificationService,
              private router: Router,
              private authenticationService: AuthenticationService) {}

  ngOnInit() {
    this.user = this.authenticationService.getUserFromLocalCache();
    this.getUsers(true);
  }

  changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe({
        next: (users: User[]) => {
          this.userService.addUsersToLocalCache(users);
          this.users = users;
          this.refreshing = false;
          if(showNotification) {
            this.sendNotification(NotificationType.SUCCESS, `${users.length} users(s) loaded successfully`);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, `${error.message}`);
          this.refreshing = false;
        }
      }));
  }

  public onDeleteUser(username: string | undefined): void {

  }

  private sendNotification(errorType: NotificationType, message: string): void {
    if(message) {
      this.notificationService.notify(errorType, message);
    } else {
      this.notificationService.notify(errorType, 'An error has occurred. Please try again later.');
    }
  }

  onEditUser(appUser: User) {

  }

  onSelectUser(selectedUser: User) {
    this.selectedUser = selectedUser;
    // @ts-ignore
    document.getElementById('openUserInfo').click();
  }

  searchUsers(value: any) {

  }

  saveNewUser() {

  }
}
