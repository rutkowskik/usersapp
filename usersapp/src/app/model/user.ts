export class User {
  private id: number;
  private userId: string;
  public firstName: string;
  public lastName: string;
  public username: string;
  public password: string;
  public email: string;
  public profileImageUrl: string;
  private lastLoginDate: Date;
  private lastLoginDateDisplay: Date;
  private joinDate: Date;
  public role: string;
  public authorities: [];
  public isActive: boolean;
  public isNotLocked: boolean;


  constructor(firstName: string, lastName: string, username: string, password: string, email: string, profileImageUrl: string, role: string, authorities: [], isActive: boolean, isNotLocked: boolean) {
    this.firstName = '';
    this.lastName = '';
    this.username = '';
    this.password = '';
    this.email = '';
    this.profileImageUrl = '';
    this.role = '';
    this.authorities = [];
    this.isActive = false;
    this.isNotLocked = false;
  }

}

