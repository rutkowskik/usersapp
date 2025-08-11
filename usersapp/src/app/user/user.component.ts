import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, finalize, Subscription} from "rxjs";
import {User} from "../model/user";
import {UserService} from "../service/user.service";
import {NotificationService} from "../service/notification.service";
import {NotificationType} from "../enum/notification-type.enum";
import {HttpErrorResponse, HttpEvent, HttpEventType} from "@angular/common/http";
import {AuthenticationService} from "../service/authentication.service";
import {NgForm} from "@angular/forms";
import {CustomHttpResponse} from "../model/custom-http-reposne";
import {Router} from "@angular/router";
import {FileUploadStatus} from "../model/file-upload-status";

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users: User[]=[];
  public user: User = new User();
  public refreshing: boolean = false;
  private subscriptions: Subscription [] = [];
  isAdmin: boolean = true;
  selectedUser: User | undefined;
  fileName: string | undefined;
  profileImage: File | undefined;
  processingRequest: boolean = false;
  editUser: User = new User();
  private currentUsername: string = '';
  fileStatus: FileUploadStatus = new FileUploadStatus();

  constructor(private userService: UserService,
              private notificationService: NotificationService,
              private authenticationService: AuthenticationService,
              private router: Router) {}

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

  public onDeleteUser(userId: number): void {
    this.subscriptions.push(this.userService.deleteUser(userId).subscribe({
      next: (customHttpResponse: CustomHttpResponse) => {
        this.notificationService.notify(NotificationType.SUCCESS, 'User deleted successfully');
        this.getUsers(false);
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.notify(NotificationType.ERROR, error.error.message);
      }
    }))
  }

  //todo block multiple method invocation
  public onResetPassword(emailFrom: NgForm): void {
    this.refreshing = true;
    const email = emailFrom.value['reset-password-email'];
    this.subscriptions.push(this.userService.resetPassword(email)
      .pipe(finalize(()=> {
          emailFrom.reset();
          this.refreshing = false;
        }
      ))
      .subscribe({
        next: (response ) => {
          this.notificationService.notify(NotificationType.SUCCESS, 'The password has been reset successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.notificationService.notify(NotificationType.WARNING, error.error.message);
        }
      }));
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
        user.getUserIdAsString().toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
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

  updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  onUpdateCurrentUser(user: User) {
    if(this.processingRequest) return;
    this.refreshing = true;
    this.processingRequest = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormData(this.currentUsername, user, this.profileImage);
    this.subscriptions.push(
      this.userService.updatedUser(formData).subscribe({
        next: (response: User) => {
          this.authenticationService.addUserToLocalCache(response)
          this.getUsers(false);
          this.fileName = undefined;
          this.profileImage = undefined;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
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

  onLogOut() : void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.notificationService.notify(NotificationType.SUCCESS, "You` ve been logged out.");
  }

  onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append("username", this.user.username);
    if(this.profileImage){
      formData.append("image", this.profileImage);
      this.subscriptions.push(
        this.userService.updateProfileImage(formData).subscribe({
          next: (httpEvent: HttpEvent<any>) => {
            this.reportUploadProgress(httpEvent);
          },
          error: (response: HttpErrorResponse) => {
            this.sendNotification(NotificationType.ERROR, response.error.message);
            this.fileStatus.status = 'done';
            }
        })
      )
    }
  }

  private reportUploadProgress(httpEvent: HttpEvent<any>) {
    switch (httpEvent.type) {
      case HttpEventType.UploadProgress:
        if (httpEvent.total)
          this.fileStatus.percentage = Math.round(100 * httpEvent.loaded / httpEvent.total);
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if(httpEvent.status === 200){
          this.user.profileImageUrl = `${httpEvent.body.profileImageUrl}?time=${new Date().getMilliseconds()}`;
          this.notificationService.notify(NotificationType.SUCCESS, `${httpEvent.body.firstName}\'s profile image uploaded successfully`);
          this.fileStatus.status = 'done';
          break;
        } else {
          this.notificationService.notify(NotificationType.ERROR, `Unable to upload image. Please try again`);
          break;
        }
        default:
          `Finished all process`;
    }
  }
}
