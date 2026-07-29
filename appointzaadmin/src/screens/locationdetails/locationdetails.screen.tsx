import React, {useState, useEffect, useMemo} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {SafeAreaView, TouchableOpacity, Alert, ScrollView, ActivityIndicator, RefreshControl, Platform} from 'react-native';
import {LucideIcon, LucideIcons} from '../../components/LucideIcons.component';
import {DefaultColor} from '../../styles/default-color.style';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AdminService} from '../../services/admin.service';
import {AdminOrganisationLocation, AdminAppointmentStats, AdminAppointmentStatsReq, AdminGetAllUsersReq, User} from '../../models/admin.model';
import {DatePickerComponent} from '../../components/Datetimepicker.component';
import {Organisation} from '../../models/organisation.model';
import {AdminGetAllOrganisationsReq} from '../../models/admin.model';

export function LocationDetailsScreen() {
  const colors = DefaultColor.instance;
  const navigation = useNavigation();
  const route = useRoute();
  const locationId = (route.params as any)?.locationId as number;
  
  const [location, setLocation] = useState<AdminOrganisationLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Organization and users states
  const [organization, setOrganization] = useState<Organisation | null>(null);
  const [organizationUsers, setOrganizationUsers] = useState<User[]>([]);
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Appointment stats states
  const [appointmentStats, setAppointmentStats] = useState<AdminAppointmentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'single' | 'range'>('all');
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  const adminService = useMemo(() => new AdminService(), []);

  useEffect(() => {
    if (locationId) {
      fetchLocationDetails();
      fetchAppointmentStats();
    }
  }, [locationId]);

  useEffect(() => {
    if (location && location.organisationid) {
      fetchOrganizationDetails();
      fetchOrganizationUsers();
    }
  }, [location]);

  useEffect(() => {
    if (locationId) {
      fetchAppointmentStats();
    }
  }, [filterMode, singleDate, fromDate, toDate]);

  const fetchLocationDetails = async () => {
    setIsLoading(true);
    try {
      const allLocations = await adminService.GetAllOrganisationLocations();
      const foundLocation = allLocations.find(loc => loc.id === locationId);
      setLocation(foundLocation || null);
    } catch (error: any) {
      console.error('Error fetching location details:', error);
      Alert.alert('Error', 'Failed to fetch location details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrganizationDetails = async () => {
    if (!location?.organisationid) return;
    
    setIsLoadingOrganization(true);
    try {
      const req = new AdminGetAllOrganisationsReq();
      req.PageNumber = 1;
      req.PageSize = 1000;
      const organizations = await adminService.GetAllOrganisations(req);
      const foundOrg = organizations.find(org => org.id === location.organisationid);
      setOrganization(foundOrg || null);
    } catch (error: any) {
      console.error('Error fetching organization details:', error);
      Alert.alert('Error', 'Failed to fetch organization details');
    } finally {
      setIsLoadingOrganization(false);
    }
  };

  const fetchOrganizationUsers = async () => {
    if (!location?.organisationid) return;
    
    setIsLoadingUsers(true);
    try {
      const usersReq = new AdminGetAllUsersReq();
      usersReq.OrganisationId = location.organisationid;
      usersReq.PageSize = 1000;
      const users = await adminService.GetAllUsers(usersReq);
      setOrganizationUsers(users || []);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      Alert.alert('Error', 'Failed to fetch organization users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAppointmentStats = async () => {
    setIsLoadingStats(true);
    try {
      const req = new AdminAppointmentStatsReq();
      req.OrganisationLocationId = locationId;
      
      if (filterMode === 'single') {
        req.SingleDate = singleDate;
      } else if (filterMode === 'range') {
        req.FromDate = fromDate;
        req.ToDate = toDate;
      }
      
      const data = await adminService.GetAppointmentStats(req);
      setAppointmentStats(data);
    } catch (error: any) {
      console.error('Error fetching appointment stats:', error);
      Alert.alert('Error', 'Failed to fetch appointment statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocationDetails();
    fetchAppointmentStats();
    if (location?.organisationid) {
      fetchOrganizationDetails();
      fetchOrganizationUsers();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
  };

  function DetailRow({label, value, valueColor}: {label: string; value?: string; valueColor?: string}) {
    if (!value) return null;

    return (
      <AppView style={[$.flex_row, {marginBottom: 8}]}>
        <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_3, width: 120, fontSize: 12}]}>
          {label}:
        </AppText>
        <AppText style={[$.fs_small, {color: valueColor || colors.tint_1, flex: 1, fontSize: 12}]}>
          {value}
        </AppText>
      </AppView>
    );
  }

  if (isLoading && !location) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.tint_7}}>
        <AppView style={[$.flex_1, $.align_items_center, $.justify_content_center]}>
          <ActivityIndicator size="large" color={colors.tint_1} />
          <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
            Loading location details...
          </AppText>
        </AppView>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.tint_7}}>
        <AppView style={[$.flex_1, $.align_items_center, $.justify_content_center, {padding: 20}]}>
          <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
            Location Not Found
          </AppText>
          <AppText style={[$.fs_medium, {color: colors.tint_4, textAlign: 'center'}]}>
            The requested location could not be found.
          </AppText>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: colors.tint_1,
              borderRadius: 8,
            }}>
            <AppText style={[$.fs_medium, $.fw_medium, {color: colors.tint_7}]}>
              Go Back
            </AppText>
          </TouchableOpacity>
        </AppView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.tint_7}}>
      {/* Header */}
      <AppView
        style={{
          backgroundColor: colors.tint_7,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.tint_5,
        }}>
        <AppView style={[$.flex_row, {justifyContent: 'space-between'}, $.align_items_center]}>
          <AppView style={{flex: 1}}>
            <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 2, fontSize: 22}]}>
              Location Details
            </AppText>
            <AppText style={[$.fs_small, {color: colors.tint_4, fontSize: 11}]}>
              {location.name || 'Unnamed Location'}
            </AppText>
          </AppView>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: colors.tint_6,
              borderWidth: 1,
              borderColor: colors.tint_5,
            }}>
            <LucideIcon name={LucideIcons.X} size={16} color={colors.tint_1} />
          </TouchableOpacity>
        </AppView>
      </AppView>

      {/* Content */}
      <ScrollView
        style={{flex: 1, backgroundColor: colors.tint_7}}
        contentContainerStyle={{padding: 12}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint_1]}
            tintColor={colors.tint_1}
          />
        }>
        
        {/* Appointment Statistics */}
        <AppView style={{marginBottom: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
          <AppView style={[$.flex_row, $.align_items_center, {justifyContent: 'space-between'}, {marginBottom: 12}]}>
            <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, fontSize: 16}]}>
              Appointment Statistics
            </AppText>
          </AppView>

          {/* Date Filter Buttons */}
          <AppView style={[$.flex_row, {gap: 8, marginBottom: 12, flexWrap: 'wrap'}]}>
            <TouchableOpacity
              onPress={() => {
                setFilterMode('all');
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: filterMode === 'all' ? colors.tint_1 : colors.tint_6,
                borderWidth: 1,
                borderColor: filterMode === 'all' ? colors.tint_1 : colors.tint_5,
              }}>
              <AppText style={[$.fs_small, $.fw_medium, {color: filterMode === 'all' ? colors.tint_7 : colors.tint_1, fontSize: 11}]}>
                All
              </AppText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setFilterMode('single');
                setShowSingleDatePicker(true);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: filterMode === 'single' ? colors.tint_1 : colors.tint_6,
                borderWidth: 1,
                borderColor: filterMode === 'single' ? colors.tint_1 : colors.tint_5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <LucideIcon name={LucideIcons.Calendar} size={12} color={filterMode === 'single' ? colors.tint_7 : colors.tint_1} />
              <AppText style={[$.fs_small, $.fw_medium, {color: filterMode === 'single' ? colors.tint_7 : colors.tint_1, fontSize: 11, marginLeft: 4}]}>
                {filterMode === 'single' ? formatDate(singleDate) : 'Single Date'}
              </AppText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setFilterMode('range');
                setShowFromDatePicker(true);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: filterMode === 'range' ? colors.tint_1 : colors.tint_6,
                borderWidth: 1,
                borderColor: filterMode === 'range' ? colors.tint_1 : colors.tint_5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <LucideIcon name={LucideIcons.Calendar} size={12} color={filterMode === 'range' ? colors.tint_7 : colors.tint_1} />
              <AppText style={[$.fs_small, $.fw_medium, {color: filterMode === 'range' ? colors.tint_7 : colors.tint_1, fontSize: 11, marginLeft: 4}]}>
                {filterMode === 'range' ? `${formatDate(fromDate)} - ${formatDate(toDate)}` : 'Date Range'}
              </AppText>
            </TouchableOpacity>
          </AppView>

          {/* Date Range Inputs */}
          {filterMode === 'range' && (
            <AppView style={[$.flex_row, {gap: 8, marginBottom: 12}]}>
              <TouchableOpacity
                onPress={() => setShowFromDatePicker(true)}
                style={{
                  flex: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: colors.tint_7,
                  borderWidth: 1,
                  borderColor: colors.tint_5,
                }}>
                <AppText style={[$.fs_tiny, {color: colors.tint_4, marginBottom: 2, fontSize: 9}]}>
                  From Date
                </AppText>
                <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, fontSize: 11}]}>
                  {formatDate(fromDate)}
                </AppText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowToDatePicker(true)}
                style={{
                  flex: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: colors.tint_7,
                  borderWidth: 1,
                  borderColor: colors.tint_5,
                }}>
                <AppText style={[$.fs_tiny, {color: colors.tint_4, marginBottom: 2, fontSize: 9}]}>
                  To Date
                </AppText>
                <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, fontSize: 11}]}>
                  {formatDate(toDate)}
                </AppText>
              </TouchableOpacity>
            </AppView>
          )}

          {/* Appointment Stats */}
          {isLoadingStats ? (
            <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
              <ActivityIndicator size="large" color={colors.tint_1} />
              <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
                Loading appointment statistics...
              </AppText>
            </AppView>
          ) : (
            <>
              {/* Total Appointments */}
              <AppView style={[$.flex_row, {flexWrap: 'wrap', gap: 8, marginBottom: 12}]}>
                <AppView
                  style={{
                    minWidth: '30%',
                    backgroundColor: colors.tint_7,
                    borderRadius: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: colors.tint_5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <AppView style={[$.flex_row, $.align_items_center, {flex: 1}]}>
                    <LucideIcon name={LucideIcons.Calendar} size={14} color={colors.tint_1} />
                    <AppText style={[$.fs_tiny, $.fw_medium, {color: colors.tint_3, marginLeft: 6, fontSize: 9}]}>
                      Total
                    </AppText>
                  </AppView>
                  <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, fontSize: 16, marginLeft: 4}]}>
                    {appointmentStats?.TotalAppointments || 0}
                  </AppText>
                </AppView>

                {/* Status Code Counts */}
                {appointmentStats?.StatusCounts && appointmentStats.StatusCounts.map((statusCount, index) => {
                  const statusCodeLower = statusCount.StatusCode.toLowerCase();
                  let statusColor = colors.tint_4;
                  if (statusCodeLower.includes('confirm') || statusCodeLower.includes('completed')) {
                    statusColor = colors.success;
                  } else if (statusCodeLower.includes('pending') || statusCodeLower.includes('testing')) {
                    statusColor = colors.warn;
                  } else if (statusCodeLower.includes('cancel') || statusCodeLower.includes('reject')) {
                    statusColor = colors.danger;
                  } else if (statusCodeLower.includes('not responsed') || statusCodeLower === '') {
                    statusColor = colors.tint_4;
                  }

                  return (
                    <AppView
                      key={index}
                      style={{
                        minWidth: '30%',
                        backgroundColor: statusColor + '15',
                        borderRadius: 8,
                        padding: 8,
                        borderWidth: 1,
                        borderColor: statusColor + '40',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <AppView style={[$.flex_row, $.align_items_center, {flex: 1}]}>
                        <AppView
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: statusColor,
                            marginRight: 6,
                          }}
                        />
                        <AppText 
                          style={[$.fs_tiny, $.fw_medium, {color: colors.tint_3, fontSize: 9}]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {statusCount.StatusCode || 'Not Responsed'}
                        </AppText>
                      </AppView>
                      <AppText style={[$.fs_medium, $.fw_bold, {color: statusColor, fontSize: 16, marginLeft: 4}]}>
                        {statusCount.Count}
                      </AppText>
                    </AppView>
                  );
                })}
              </AppView>
            </>
          )}
        </AppView>

        {/* Organization Details */}
        {location && location.organisationid && (
          <AppView style={{marginBottom: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
            <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 16}]}>
              Organization Details
            </AppText>
            
            {isLoadingOrganization ? (
              <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                <ActivityIndicator size="large" color={colors.tint_1} />
                <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
                  Loading organization details...
                </AppText>
              </AppView>
            ) : organization ? (
              <AppView style={{padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
                <DetailRow label="Name" value={organization.name} />
                <DetailRow label="GST Number" value={organization.gstnumber} />
                <DetailRow label="Primary Type" value={organization.primarytypecode} />
                <DetailRow label="Secondary Type" value={organization.secondarytypecode} />
                {organization.attributes && (
                  <>
                    {(organization.attributes as any).mobile && (
                      <DetailRow label="Mobile" value={(organization.attributes as any).mobile} />
                    )}
                    {(organization.attributes as any).phone && (
                      <DetailRow label="Phone" value={(organization.attributes as any).phone} />
                    )}
                    {(organization.attributes as any).email && (
                      <DetailRow label="Email" value={(organization.attributes as any).email} />
                    )}
                  </>
                )}
                {organization.createdon && (
                  <DetailRow
                    label="Created On"
                    value={new Date(organization.createdon).toLocaleDateString()}
                  />
                )}
                {organization.modifiedon && (
                  <DetailRow
                    label="Modified On"
                    value={new Date(organization.modifiedon).toLocaleDateString()}
                  />
                )}
              </AppView>
            ) : (
              <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                <AppText style={[$.fs_medium, {color: colors.tint_4}]}>
                  Organization details not available
                </AppText>
              </AppView>
            )}
          </AppView>
        )}

        {/* Organization Users */}
        {location && location.organisationid && (
          <AppView style={{marginBottom: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
            <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 16}]}>
              Linked Users ({organizationUsers.length})
            </AppText>
            
            {isLoadingUsers ? (
              <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                <ActivityIndicator size="large" color={colors.tint_1} />
                <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
                  Loading users...
                </AppText>
              </AppView>
            ) : organizationUsers.length === 0 ? (
              <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                <AppText style={[$.fs_medium, {color: colors.tint_4}]}>
                  No users found for this organization
                </AppText>
              </AppView>
            ) : (
              <AppView>
                {organizationUsers.map((user, index) => (
                  <AppView
                    key={user.id}
                    style={{
                      padding: 12,
                      backgroundColor: colors.tint_7,
                      borderRadius: 8,
                      marginBottom: index < organizationUsers.length - 1 ? 12 : 0,
                      borderWidth: 1,
                      borderColor: colors.tint_5,
                    }}>
                    <AppView style={[$.flex_row, $.justify_content_space_between, $.align_items_center]}>
                      <AppView style={{flex: 1}}>
                        <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 4}]}>
                          {user.name || 'N/A'}
                        </AppText>
                        {user.designation && (
                          <AppText style={[$.fs_small, {color: colors.tint_3, marginBottom: 2, fontSize: 12}]}>
                            {user.designation}
                          </AppText>
                        )}
                        {user.mobile && (
                          <AppText style={[$.fs_small, {color: colors.tint_3, marginBottom: 2, fontSize: 12}]}>
                            Mobile: {user.mobilecountrycode ? `${user.mobilecountrycode} ` : ''}{user.mobile}
                          </AppText>
                        )}
                        {user.email && (
                          <AppText style={[$.fs_small, {color: colors.tint_3, fontSize: 12}]}>
                            Email: {user.email}
                          </AppText>
                        )}
                      </AppView>
                      <AppView style={[$.flex_row, {gap: 8}]}>
                        <AppView
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            backgroundColor: user.isactive ? colors.success + '20' : colors.danger + '20',
                          }}>
                          <AppText style={[$.fs_tiny, {color: user.isactive ? colors.success : colors.danger, fontSize: 9}]}>
                            {user.isactive ? 'Active' : 'Inactive'}
                          </AppText>
                        </AppView>
                        {user.isverified && (
                          <AppView
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                              backgroundColor: colors.success + '20',
                            }}>
                            <AppText style={[$.fs_tiny, {color: colors.success, fontSize: 9}]}>
                              Verified
                            </AppText>
                          </AppView>
                        )}
                        {user.issuspended && (
                          <AppView
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                              backgroundColor: colors.warn + '20',
                            }}>
                            <AppText style={[$.fs_tiny, {color: colors.warn, fontSize: 9}]}>
                              Suspended
                            </AppText>
                          </AppView>
                        )}
                      </AppView>
                    </AppView>
                  </AppView>
                ))}
              </AppView>
            )}
          </AppView>
        )}

        {/* Location Details */}
        <AppView style={{marginBottom: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
          <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 16}]}>
            Location Details
          </AppText>
          
          {/* Organization Info (Quick Reference) */}
          <AppView style={{marginBottom: 16, padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
            <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
              Organization (Quick Info)
            </AppText>
            <DetailRow label="Name" value={location.organisationname} />
            <DetailRow label="GST Number" value={location.organisationgstnumber} />
            <DetailRow label="Primary Type" value={location.organisationprimarytypecode} />
            <DetailRow label="Secondary Type" value={location.organisationsecondarytypecode} />
            <DetailRow label="Mobile" value={location.organisationmobile || location.usermobile} />
          </AppView>

          {/* Location Info */}
          <AppView style={{marginBottom: 16, padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
            <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
              Location
            </AppText>
            <DetailRow label="Name" value={location.name} />
            <DetailRow label="Address Line 1" value={location.addressline1} />
            <DetailRow label="Address Line 2" value={location.addressline2} />
            <DetailRow label="City" value={location.city} />
            <DetailRow label="State" value={location.state} />
            <DetailRow label="Country" value={location.country} />
            <DetailRow label="Pincode" value={location.pincode} />
            <DetailRow label="Latitude" value={location.latitude?.toString()} />
            <DetailRow label="Longitude" value={location.longitude?.toString()} />
            {location.googlelocation && (
              <DetailRow label="Google Location" value={location.googlelocation} />
            )}
          </AppView>

          {/* Status Info */}
          <AppView style={{padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
            <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
              Status
            </AppText>
            <DetailRow
              label="Verified"
              value={location.isverified ? 'Yes' : 'No'}
              valueColor={location.isverified ? colors.success : colors.danger}
            />
            <DetailRow
              label="Active"
              value={location.isactive ? 'Yes' : 'No'}
              valueColor={location.isactive ? colors.success : colors.danger}
            />
            {location.createdon && (
              <DetailRow
                label="Created On"
                value={new Date(location.createdon).toLocaleDateString()}
              />
            )}
          </AppView>
        </AppView>
      </ScrollView>

      {/* Date Pickers */}
      {Platform.OS === 'ios' && (
        <>
          <DatePickerComponent
            date={singleDate}
            show={showSingleDatePicker}
            mode="date"
            setShow={setShowSingleDatePicker}
            setDate={setSingleDate}
          />
          <DatePickerComponent
            date={fromDate}
            show={showFromDatePicker}
            mode="date"
            setShow={setShowFromDatePicker}
            setDate={setFromDate}
          />
          <DatePickerComponent
            date={toDate}
            show={showToDatePicker}
            mode="date"
            setShow={setShowToDatePicker}
            setDate={setToDate}
          />
        </>
      )}
      
      {Platform.OS === 'android' && (
        <>
          {showSingleDatePicker && (
            <DatePickerComponent
              date={singleDate}
              show={showSingleDatePicker}
              mode="date"
              setShow={setShowSingleDatePicker}
              setDate={setSingleDate}
            />
          )}
          {showFromDatePicker && (
            <DatePickerComponent
              date={fromDate}
              show={showFromDatePicker}
              mode="date"
              setShow={setShowFromDatePicker}
              setDate={setFromDate}
            />
          )}
          {showToDatePicker && (
            <DatePickerComponent
              date={toDate}
              show={showToDatePicker}
              mode="date"
              setShow={setShowToDatePicker}
              setDate={setToDate}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

