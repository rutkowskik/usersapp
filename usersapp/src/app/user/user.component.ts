import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {User} from "../model/user";
import {UserService} from "../service/user.service";
import {Router} from "@angular/router";
import {NotificationService} from "../service/notification.service";
import {NotificationType} from "../enum/notification-type.enum";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthenticationService} from "../service/authentication.service";
import {NgForm} from "@angular/forms";

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
  fileName: string | undefined;
  profileImage: File | undefined;
  processingRequest: boolean = false;
  editUser: User = new User();
  private currentUsername: string = '';

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

  onEditUser(editUser: User) {
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit');

  }

  onUpdateUser(){
    if(this.processingRequest) return;
    this.processingRequest = true;
    const formData = this.userService.createUserFormData(this.currentUsername, this.editUser, this.profileImage);
    this.subscriptions.push(
      this.userService.updatedUser(formData).subscribe({
        next: (user: User) => {
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.fileName = undefined;
          this.profileImage = undefined;
          this.sendNotification(NotificationType.SUCCESS, `${user.firstName} ${user.lastName} updated successfully`);
          this.processingRequest = false;
        },
        error: (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
          this.refreshing = false;
          this.processingRequest = false;
        }
      })
    )
  }

  onSelectUser(selectedUser: User) {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }

  searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()) {
      if(user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        ||
        user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        ||
        user.userId.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        ||
        user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
      ) {
        results.push(user);
      }
    }
    this.users = results;
    if (!searchTerm) {
      //todo if the users are empty list return some information
      this.users = this.userService.getUsersFromLocalCache();
    }
  }

  saveNewUser() {
    this.clickButton('new-user-save');
  }

  onAddNewUser(userForm: NgForm) {
    if(this.processingRequest) return;
    this.processingRequest = true;
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe({
        next: (user: User) => {
          this.clickButton('new-user-close');
          this.getUsers(false);
          this.fileName = undefined;
          this.profileImage = undefined;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS, `${user.firstName} ${user.lastName} added successfully`);
          this.processingRequest = false;
        },
        error: (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
          this.refreshing = false;
          this.processingRequest = false;
        }
      })
    )
  }

  onProfileImageChange(event: Event): void {
    const  input = event.target as HTMLInputElement
    if(input.files && input.files[0]) {
      this.profileImage = input.files[0];
      this.fileName = this.profileImage.name;
    }
  }

  private clickButton(buttonId: string): void {
    let button = document.getElementById(buttonId);
    if(button)
      button.click();
  }

}
