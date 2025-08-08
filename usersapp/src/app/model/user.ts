export class User {
  public id: number;
  public userId: string;
  public firstName: string;
  public lastName: string;
  public username: string;
  public password: string;
  public email: string;
  public profileImageUrl: string;
  public lastLoginDate: Date;
  public lastLoginDateDisplay: Date;
  public joinDate: Date;
  public role: string;
  public authorities: [];
  public active: boolean;
  public notLocked: boolean;


  constructor() {
    this.id = 0;
    this.userId = '';
    this.firstName = '';
    this.lastName = '';
    this.username = '';
    this.password = '';
    this.email = '';
    this.lastLoginDate = new Date();
    this.lastLoginDateDisplay = new Date();
    this.joinDate = new Date();
    this.profileImageUrl = '';
    this.role = '';
    this.authorities = [];
    this.active = false;
    this.notLocked = false;
  }

}

