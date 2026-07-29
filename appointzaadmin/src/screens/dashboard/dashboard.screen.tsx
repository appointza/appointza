import React, {useState, useEffect, useMemo, useRef} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {SafeAreaView, TouchableOpacity, Alert, ScrollView, ActivityIndicator, RefreshControl, Platform, FlatList} from 'react-native';
import {LucideIcon, LucideIcons} from '../../components/LucideIcons.component';
import {DefaultColor} from '../../styles/default-color.style';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch} from '../../redux/hooks.redux';
import {iscustomeractions} from '../../redux/iscustomer.redux';
import {usercontextactions} from '../../redux/usercontext.redux';
import {AdminService} from '../../services/admin.service';
import {AdminOrganizationLocationStats, AdminAppointmentStats, AdminAppointmentStatsReq, AdminOrganisationLocation, AdminGetAllOrganisationsReq, AdminGetAllUsersReq, User} from '../../models/admin.model';
import {DatePickerComponent} from '../../components/Datetimepicker.component';
import {Organisation} from '../../models/organisation.model';
import {AppSingleSelect} from '../../components/appsingleselect.component';

export function DashboardScreen() {
  const colors = DefaultColor.instance;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<AdminOrganizationLocationStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AdminAppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date filter states
  const [filterMode, setFilterMode] = useState<'all' | 'single' | 'range'>('all');
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  // Organization states
  const [organizations, setOrganizations] = useState<Organisation[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organisation | null>(null);
  const [organizationLocations, setOrganizationLocations] = useState<AdminOrganisationLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AdminOrganisationLocation | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showOrganizationsView, setShowOrganizationsView] = useState(false);
  
  // Users states
  const [organizationUsers, setOrganizationUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Location appointment stats states
  const [locationAppointmentStats, setLocationAppointmentStats] = useState<AdminAppointmentStats | null>(null);
  const [isLoadingLocationStats, setIsLoadingLocationStats] = useState(false);
  const [locationFilterMode, setLocationFilterMode] = useState<'all' | 'single' | 'range'>('all');
  const [locationSingleDate, setLocationSingleDate] = useState<Date>(new Date());
  const [locationFromDate, setLocationFromDate] = useState<Date>(new Date());
  const [locationToDate, setLocationToDate] = useState<Date>(new Date());
  const [showLocationSingleDatePicker, setShowLocationSingleDatePicker] = useState(false);
  const [showLocationFromDatePicker, setShowLocationFromDatePicker] = useState(false);
  const [showLocationToDatePicker, setShowLocationToDatePicker] = useState(false);
  
  const adminService = useMemo(() => new AdminService(), []);

  useEffect(() => {
    fetchStats();
    fetchAppointmentStats();
  }, []);

  useEffect(() => {
    // Only fetch when filter mode changes or when dates are actually selected
    if (filterMode === 'all' || (filterMode === 'single' && singleDate) || (filterMode === 'range' && fromDate && toDate)) {
      fetchAppointmentStats();
    }
  }, [filterMode, singleDate, fromDate, toDate]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.GetOrganizationLocationStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      Alert.alert('Error', 'Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAppointmentStats = async () => {
    try {
      const req = new AdminAppointmentStatsReq();
      
      if (filterMode === 'single') {
        req.SingleDate = singleDate;
      } else if (filterMode === 'range') {
        req.FromDate = fromDate;
        req.ToDate = toDate;
      }
      // If filterMode is 'all', no date filters are applied
      
      const data = await adminService.GetAppointmentStats(req);
      setAppointmentStats(data);
    } catch (error: any) {
      console.error('Error fetching appointment stats:', error);
      Alert.alert('Error', 'Failed to fetch appointment statistics');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchAppointmentStats();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
  };

  const fetchOrganizations = async () => {
    setIsLoadingOrganizations(true);
    try {
      const req = new AdminGetAllOrganisationsReq();
      req.PageNumber = 1;
      req.PageSize = 1000; // Get all organizations
      const result = await adminService.GetAllOrganisations(req);
      setOrganizations(result || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      Alert.alert('Error', 'Failed to fetch organizations');
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  const handleOrganizationSelect = async (organization: Organisation) => {
    setSelectedOrganization(organization);
    setIsLoadingLocations(true);
    setIsLoadingUsers(true);
    try {
      const allLocations = await adminService.GetAllOrganisationLocations();
      const filteredLocations = allLocations.filter(loc => loc.organisationid === organization.id);
      setOrganizationLocations(filteredLocations);
      
      // Fetch users for this organization
      const usersReq = new AdminGetAllUsersReq();
      usersReq.OrganisationId = organization.id;
      usersReq.PageSize = 1000; // Get all users
      const users = await adminService.GetAllUsers(usersReq);
      setOrganizationUsers(users || []);
    } catch (error: any) {
      console.error('Error fetching locations/users:', error);
      Alert.alert('Error', 'Failed to fetch organization data');
    } finally {
      setIsLoadingLocations(false);
      setIsLoadingUsers(false);
    }
  };

  const handleLocationSelect = (location: AdminOrganisationLocation) => {
    setSelectedLocation(location);
    fetchLocationAppointmentStats(location.id);
  };

  const fetchLocationAppointmentStats = async (locationId: number) => {
    setIsLoadingLocationStats(true);
    try {
      const req = new AdminAppointmentStatsReq();
      req.OrganisationLocationId = locationId;
      
      if (locationFilterMode === 'single') {
        req.SingleDate = locationSingleDate;
      } else if (locationFilterMode === 'range') {
        req.FromDate = locationFromDate;
        req.ToDate = locationToDate;
      }
      
      const data = await adminService.GetAppointmentStats(req);
      setLocationAppointmentStats(data);
    } catch (error: any) {
      console.error('Error fetching location appointment stats:', error);
      Alert.alert('Error', 'Failed to fetch location appointment statistics');
    } finally {
      setIsLoadingLocationStats(false);
    }
  };

  useEffect(() => {
    if (selectedLocation && selectedLocation.id > 0) {
      fetchLocationAppointmentStats(selectedLocation.id);
    }
  }, [locationFilterMode, locationSingleDate, locationFromDate, locationToDate]);

  const handleOpenOrganizationsView = () => {
    setShowOrganizationsView(true);
    setSelectedOrganization(null);
    setSelectedLocation(null);
    setOrganizationLocations([]);
    fetchOrganizations();
  };


  const handleCloseOrganizationsView = () => {
    setShowOrganizationsView(false);
    setSelectedOrganization(null);
    setSelectedLocation(null);
    setOrganizationLocations([]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear user context and login state
            dispatch(usercontextactions.clear());
            dispatch(iscustomeractions.setLoginStatus(false));
            dispatch(iscustomeractions.setIsCustomer(false));
            
            // Navigate to login screen
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.tint_7}}>
      {/* Header */}
      <AppView 
        style={[
          {
            backgroundColor: colors.tint_7,
            paddingTop: 12,
            paddingBottom: 12,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.tint_5,
          },
        ]}>
        <AppView style={[$.flex_row, $.justify_content_space_between, $.align_items_center]}>
          <AppView style={{flex: 1}}>
            <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 2, fontSize: 22}]}>
              Dashboard
            </AppText>
            <AppText style={[$.fs_small, {color: colors.tint_4, fontSize: 12}]}>
              Welcome back! Here's your overview
            </AppText>
          </AppView>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={[
              {
                backgroundColor: colors.tint_6,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.tint_5,
              },
            ]}>
            <LucideIcon
              name={LucideIcons.LogOut}
              size={16}
              color={colors.tint_1}
            />
            <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, fontSize: 12, marginLeft: 6}]}>
              Logout
            </AppText>
          </TouchableOpacity>
        </AppView>
      </AppView>

      {/* Content Area */}
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
        {isLoading && !stats ? (
          <AppView style={[$.flex_1, $.align_items_center, $.justify_content_center, {minHeight: 200}]}>
            <ActivityIndicator size="large" color={colors.tint_1} />
            <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
              Loading statistics...
            </AppText>
          </AppView>
        ) : (
          <>
            {/* Compact Stats Grid */}
            <AppView style={[$.flex_row, {flexWrap: 'wrap', gap: 8}]}>
              {/* Organizations Count */}
              <AppView
                style={{
                  flex: 1,
                  minWidth: '48%',
                  backgroundColor: colors.tint_7,
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: colors.tint_5,
                }}>
                <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 6}]}>
                  <LucideIcon name={LucideIcons.Building} size={16} color={colors.tint_1} />
                  <AppText style={[$.fs_small, $.fw_bold, {color: colors.tint_1, marginLeft: 6, fontSize: 11}]}>
                    Organizations
                  </AppText>
                </AppView>
                <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, fontSize: 20}]}>
                  {stats?.TotalOrganizations || 0}
                </AppText>
              </AppView>

              {/* Total Locations */}
              <AppView
                style={{
                  flex: 1,
                  minWidth: '48%',
                  backgroundColor: colors.tint_7,
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: colors.tint_5,
                }}>
                <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 6}]}>
                  <LucideIcon name={LucideIcons.MapPin} size={16} color={colors.tint_1} />
                  <AppText style={[$.fs_small, $.fw_bold, {color: colors.tint_1, marginLeft: 6, fontSize: 11}]}>
                    Total Locations
                  </AppText>
                </AppView>
                <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, fontSize: 20}]}>
                  {stats?.TotalLocations || 0}
                </AppText>
              </AppView>

            </AppView>

            {/* Single Line Status Stats */}
            <AppView style={[$.flex_row, {marginTop: 8, gap: 8}]}>
              {/* Verified Locations */}
              <AppView
                style={{
                  flex: 1,
                  backgroundColor: colors.success + '15',
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.success + '40',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  <AppView
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.success,
                      marginRight: 6,
                    }}
                  />
                  <AppText style={[$.fs_tiny, $.fw_medium, {color: colors.tint_3, fontSize: 9}]}>
                    Verified
                  </AppText>
                </AppView>
                <AppText style={[$.fs_medium, $.fw_bold, {color: colors.success, fontSize: 16}]}>
                  {stats?.VerifiedLocations || 0}
                </AppText>
              </AppView>

              {/* Not Verified Locations */}
              <AppView
                style={{
                  flex: 1,
                  backgroundColor: colors.warn + '15',
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.warn + '40',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  <AppView
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.warn,
                      marginRight: 6,
                    }}
                  />
                  <AppText style={[$.fs_tiny, $.fw_medium, {color: colors.tint_3, fontSize: 9}]}>
                    Not Verified
                  </AppText>
                </AppView>
                <AppText style={[$.fs_medium, $.fw_bold, {color: colors.warn, fontSize: 16}]}>
                  {stats?.NotVerifiedLocations || 0}
                </AppText>
              </AppView>

              {/* Rejected Locations */}
              <AppView
                style={{
                  flex: 1,
                  backgroundColor: colors.danger + '15',
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.danger + '40',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  <AppView
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.danger,
                      marginRight: 6,
                    }}
                  />
                  <AppText style={[$.fs_tiny, $.fw_medium, {color: colors.tint_3, fontSize: 9}]}>
                    Rejected
                  </AppText>
                </AppView>
                <AppText style={[$.fs_medium, $.fw_bold, {color: colors.danger, fontSize: 16}]}>
                  {stats?.RejectedLocations || 0}
                </AppText>
              </AppView>
            </AppView>

            {/* Appointment Stats Section */}
            <AppView style={{marginTop: 16}}>
              <AppView style={[$.flex_row, $.align_items_center, $.justify_content_space_between, {marginBottom: 12}]}>
                <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, fontSize: 16}]}>
                  Appointment Statistics
                </AppText>
              </AppView>

              {/* Date filter chips: horizontal scroll avoids wrap → large empty band below row */}
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{marginBottom: 6}}
                contentContainerStyle={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingRight: 4,
                }}>
                <TouchableOpacity
                  onPress={() => setFilterMode('all')}
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
              </ScrollView>

              {/* Date Range Inputs (shown when range mode is active) */}
              {filterMode === 'range' && (
                <AppView style={[$.flex_row, {gap: 8, marginBottom: 8}]}>
                  <TouchableOpacity
                    onPress={() => setShowFromDatePicker(true)}
                    style={{
                      flex: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor: colors.tint_6,
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
                      backgroundColor: colors.tint_6,
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

              {/* Appointment Stats Cards - Total and Status Codes together */}
              <AppView style={[$.flex_row, {flexWrap: 'wrap', gap: 8}]}>
                {/* Total Appointments - Smaller card */}
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

                {/* Status Code Counts - Display all statuscode groups */}
                {appointmentStats?.StatusCounts && appointmentStats.StatusCounts.map((statusCount, index) => {
                  // Determine color based on statuscode
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
            </AppView>

            {/* Locations Button */}
            <AppView style={{marginTop: 16}}>
              <TouchableOpacity
                onPress={handleOpenOrganizationsView}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: colors.tint_1,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}>
                <LucideIcon name={LucideIcons.Building} size={14} color={colors.tint_7} />
                <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_7, marginLeft: 6, fontSize: 12}]}>
                  Locations
                </AppText>
              </TouchableOpacity>
            </AppView>

            {/* Organizations and Locations View */}
            {showOrganizationsView && (
              <AppView style={{marginTop: 16}}>
                <AppView style={[$.flex_row, $.align_items_center, $.justify_content_space_between, {marginBottom: 12}]}>
                  <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, fontSize: 16}]}>
                    Organizations & Locations
                  </AppText>
                  <TouchableOpacity
                    onPress={handleCloseOrganizationsView}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: colors.tint_6,
                      borderWidth: 1,
                      borderColor: colors.tint_5,
                    }}>
                    <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, fontSize: 11}]}>
                      Close
                    </AppText>
                  </TouchableOpacity>
                </AppView>

                {/* Organization Selection */}
                {isLoadingOrganizations ? (
                  <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                    <ActivityIndicator size="large" color={colors.tint_1} />
                    <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
                      Loading organizations...
                    </AppText>
                  </AppView>
                ) : (
                  <AppView style={{marginBottom: 16}}>
                    <AppSingleSelect<Organisation>
                      title="Select Organization"
                      data={organizations}
                      selecteditem={selectedOrganization || undefined}
                      onSelect={handleOrganizationSelect}
                      onClear={() => {
                        setSelectedOrganization(null);
                        setOrganizationLocations([]);
                        setSelectedLocation(null);
                      }}
                      renderItemLabel={(item) => (
                        <AppView>
                          <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                            {item.name}
                          </AppText>
                          {item.gstnumber && (
                            <AppText style={[$.fs_tiny, {color: colors.tint_4, marginTop: 2}]}>
                              GST: {item.gstnumber}
                            </AppText>
                          )}
                          {item.primarytypecode && (
                            <AppText style={[$.fs_tiny, {color: colors.tint_4}]}>
                              {item.primarytypecode} {item.secondarytypecode ? `- ${item.secondarytypecode}` : ''}
                            </AppText>
                          )}
                        </AppView>
                      )}
                      keyExtractor={(item) => item.id.toString()}
                      searchKeyExtractor={(item) => `${item.name || ''} ${item.gstnumber || ''} ${item.primarytypecode || ''} ${item.secondarytypecode || ''}`}
                      isloading={isLoadingOrganizations}
          style={{marginBottom: 16}}
        />
                  </AppView>
                )}

                {/* Location Selection */}
                {selectedOrganization && (
                  <>
                    {isLoadingLocations ? (
                      <AppView style={[$.align_items_center, $.justify_content_center, {padding: 40}]}>
                        <ActivityIndicator size="large" color={colors.tint_1} />
                        <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
                          Loading locations...
                        </AppText>
                      </AppView>
                    ) : (
                      <AppView style={{marginBottom: 16}}>
                        <AppSingleSelect<AdminOrganisationLocation>
                          title="Select Location"
                          data={organizationLocations}
                          selecteditem={selectedLocation || undefined}
                          onSelect={handleLocationSelect}
                          onClear={() => {
                            setSelectedLocation(null);
                          }}
                          renderItemLabel={(item) => (
                            <AppView>
                              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                                {item.name}
                              </AppText>
                              {item.addressline1 && (
                                <AppText style={[$.fs_tiny, {color: colors.tint_4, marginTop: 2}]}>
                                  {item.addressline1}
                                </AppText>
                              )}
                              {(item.city || item.state) && (
                                <AppText style={[$.fs_tiny, {color: colors.tint_4}]}>
                                  {[item.city, item.state, item.pincode].filter(Boolean).join(', ')}
                                </AppText>
                              )}
                              <AppView style={[$.flex_row, {marginTop: 4, gap: 8}]}>
                                <AppView
                                  style={{
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                    backgroundColor: item.isverified ? colors.success + '20' : colors.warn + '20',
                                  }}>
                                  <AppText style={[$.fs_tiny, {color: item.isverified ? colors.success : colors.warn, fontSize: 9}]}>
                                    {item.isverified ? 'Verified' : 'Not Verified'}
        </AppText>
                                </AppView>
                                {!item.isactive && (
                                  <AppView
                                    style={{
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4,
                                      backgroundColor: colors.danger + '20',
                                    }}>
                                    <AppText style={[$.fs_tiny, {color: colors.danger, fontSize: 9}]}>
                                      Inactive
        </AppText>
      </AppView>
                                )}
                              </AppView>
                            </AppView>
                          )}
                          keyExtractor={(item) => item.id.toString()}
                          searchKeyExtractor={(item) => `${item.name || ''} ${item.addressline1 || ''} ${item.city || ''} ${item.state || ''}`}
                          isloading={isLoadingLocations}
                          style={{marginBottom: 16}}
                        />
                      </AppView>
                    )}
                  </>
                )}

                {/* Location Appointment Statistics */}
                {selectedLocation && (
                  <AppView style={{marginTop: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
                    <AppView style={[$.flex_row, $.align_items_center, $.justify_content_space_between, {marginBottom: 12}]}>
                      <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, fontSize: 16}]}>
                        Appointment Statistics
                      </AppText>
                    </AppView>

                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      style={{marginBottom: 6}}
                      contentContainerStyle={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingRight: 4,
                      }}>
                      <TouchableOpacity
                        onPress={() => {
                          setLocationFilterMode('all');
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: locationFilterMode === 'all' ? colors.tint_1 : colors.tint_6,
                          borderWidth: 1,
                          borderColor: locationFilterMode === 'all' ? colors.tint_1 : colors.tint_5,
                        }}>
                        <AppText style={[$.fs_small, $.fw_medium, {color: locationFilterMode === 'all' ? colors.tint_7 : colors.tint_1, fontSize: 11}]}>
                          All
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setLocationFilterMode('single');
                          setShowLocationSingleDatePicker(true);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: locationFilterMode === 'single' ? colors.tint_1 : colors.tint_6,
                          borderWidth: 1,
                          borderColor: locationFilterMode === 'single' ? colors.tint_1 : colors.tint_5,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <LucideIcon name={LucideIcons.Calendar} size={12} color={locationFilterMode === 'single' ? colors.tint_7 : colors.tint_1} />
                        <AppText style={[$.fs_small, $.fw_medium, {color: locationFilterMode === 'single' ? colors.tint_7 : colors.tint_1, fontSize: 11, marginLeft: 4}]}>
                          {locationFilterMode === 'single' ? formatDate(locationSingleDate) : 'Single Date'}
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setLocationFilterMode('range');
                          setShowLocationFromDatePicker(true);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: locationFilterMode === 'range' ? colors.tint_1 : colors.tint_6,
                          borderWidth: 1,
                          borderColor: locationFilterMode === 'range' ? colors.tint_1 : colors.tint_5,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <LucideIcon name={LucideIcons.Calendar} size={12} color={locationFilterMode === 'range' ? colors.tint_7 : colors.tint_1} />
                        <AppText style={[$.fs_small, $.fw_medium, {color: locationFilterMode === 'range' ? colors.tint_7 : colors.tint_1, fontSize: 11, marginLeft: 4}]}>
                          {locationFilterMode === 'range' ? `${formatDate(locationFromDate)} - ${formatDate(locationToDate)}` : 'Date Range'}
                        </AppText>
                      </TouchableOpacity>
                    </ScrollView>

                    {/* Date Range Inputs (shown when range mode is active) */}
                    {locationFilterMode === 'range' && (
                      <AppView style={[$.flex_row, {gap: 8, marginBottom: 8}]}>
                        <TouchableOpacity
                          onPress={() => setShowLocationFromDatePicker(true)}
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
                            {formatDate(locationFromDate)}
                          </AppText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => setShowLocationToDatePicker(true)}
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
                            {formatDate(locationToDate)}
                          </AppText>
                        </TouchableOpacity>
                      </AppView>
                    )}

                    {/* Location Appointment Stats */}
                    {isLoadingLocationStats ? (
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
                              {locationAppointmentStats?.TotalAppointments || 0}
                            </AppText>
                          </AppView>

                          {/* Status Code Counts */}
                          {locationAppointmentStats?.StatusCounts && locationAppointmentStats.StatusCounts.map((statusCount, index) => {
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
                )}

                {/* Organization Users */}
                {selectedOrganization && (
                  <AppView style={{marginTop: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
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
                {selectedLocation && (
                  <AppView style={{marginTop: 16, padding: 16, backgroundColor: colors.tint_6, borderRadius: 8}}>
                    <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 16}]}>
                      Location Details
                    </AppText>
                    
                    {/* Organization Info */}
                    <AppView style={{marginBottom: 16, padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
                      <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
                        Organization
                      </AppText>
                      <DetailRow label="Name" value={selectedLocation.organisationname} />
                      <DetailRow label="GST Number" value={selectedLocation.organisationgstnumber} />
                      <DetailRow label="Primary Type" value={selectedLocation.organisationprimarytypecode} />
                      <DetailRow label="Secondary Type" value={selectedLocation.organisationsecondarytypecode} />
                      <DetailRow label="Mobile" value={selectedLocation.organisationmobile || selectedLocation.usermobile} />
                    </AppView>

                    {/* Location Info */}
                    <AppView style={{marginBottom: 16, padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
                      <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
                        Location
                      </AppText>
                      <DetailRow label="Name" value={selectedLocation.name} />
                      <DetailRow label="Address Line 1" value={selectedLocation.addressline1} />
                      <DetailRow label="Address Line 2" value={selectedLocation.addressline2} />
                      <DetailRow label="City" value={selectedLocation.city} />
                      <DetailRow label="State" value={selectedLocation.state} />
                      <DetailRow label="Country" value={selectedLocation.country} />
                      <DetailRow label="Pincode" value={selectedLocation.pincode} />
                      <DetailRow label="Latitude" value={selectedLocation.latitude?.toString()} />
                      <DetailRow label="Longitude" value={selectedLocation.longitude?.toString()} />
                      {selectedLocation.googlelocation && (
                        <DetailRow label="Google Location" value={selectedLocation.googlelocation} />
                      )}
                    </AppView>

                    {/* Status Info */}
                    <AppView style={{padding: 12, backgroundColor: colors.tint_7, borderRadius: 8}}>
                      <AppText style={[$.fs_medium, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
                        Status
                      </AppText>
                      <DetailRow 
                        label="Verified" 
                        value={selectedLocation.isverified ? 'Yes' : 'No'} 
                        valueColor={selectedLocation.isverified ? colors.success : colors.danger}
                      />
                      <DetailRow 
                        label="Active" 
                        value={selectedLocation.isactive ? 'Yes' : 'No'} 
                        valueColor={selectedLocation.isactive ? colors.success : colors.danger}
                      />
                      {selectedLocation.createdon && (
                        <DetailRow 
                          label="Created On" 
                          value={new Date(selectedLocation.createdon).toLocaleDateString()} 
                        />
                      )}
                    </AppView>
                  </AppView>
                )}
              </AppView>
            )}
          </>
        )}
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

// Helper component for detail rows
function DetailRow({label, value, valueColor}: {label: string; value?: string; valueColor?: string}) {
  const colors = DefaultColor.instance;
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
