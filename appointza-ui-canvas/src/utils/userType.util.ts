import { UsersContext } from '../models/users.model';

export class UserTypeUtil {
  // Staff: has only locationid (no organisationid)
  static isStaff(userContext: UsersContext | null): boolean {
    return userContext?.isStaff === true && 
           (userContext?.organisationlocationid ?? 0) > 0 && 
           (userContext?.organisationid ?? 0) === 0;
  }

  // Normal: has neither organisationid nor locationid
  static isNormalUser(userContext: UsersContext | null): boolean {
    return (userContext?.organisationid ?? 0) === 0 && 
           (userContext?.organisationlocationid ?? 0) === 0;
  }

  // Organization: has organisationid > 0
  static isOrganizationUser(userContext: UsersContext | null): boolean {
    return (userContext?.organisationid ?? 0) > 0;
  }

  static getUserType(userContext: UsersContext | null): string {
    if (!userContext) return 'Unknown';
    
    if (this.isStaff(userContext)) {
      return 'Staff Member';
    } else if (this.isOrganizationUser(userContext)) {
      return 'Organization User';
    } else {
      return 'Normal User';
    }
  }

  static shouldShowOrganizationFeatures(userContext: UsersContext | null): boolean {
    return this.isOrganizationUser(userContext);
  }

  static shouldShowStaffFeatures(userContext: UsersContext | null): boolean {
    return this.isStaff(userContext) || this.isOrganizationUser(userContext);
  }

  static hasLocationAccess(userContext: UsersContext | null): boolean {
    return (userContext?.organisationlocationid ?? 0) > 0;
  }

  static hasOrganizationAccess(userContext: UsersContext | null): boolean {
    return (userContext?.organisationid ?? 0) > 0;
  }

  static getDetailedUserType(userContext: UsersContext | null): string {
    if (!userContext) return 'Unknown';
    
    if (this.isStaff(userContext)) {
      return `Staff Member (Location: ${userContext.organisationlocationname || 'Unknown'})`;
    } else if (this.isOrganizationUser(userContext)) {
      const locationInfo = this.hasLocationAccess(userContext) 
        ? ` - Location: ${userContext.organisationlocationname || 'Unknown'}`
        : ' - No specific location';
      return `Organization User (${userContext.organisationname || 'Unknown'}${locationInfo})`;
    } else {
      return 'Normal User';
    }
  }
}
