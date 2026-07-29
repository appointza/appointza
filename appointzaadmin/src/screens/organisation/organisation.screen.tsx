import React, {useState, useEffect, useMemo} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {SafeAreaView, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl, View, TextInput, Modal} from 'react-native';
import {LucideIcon, LucideIcons} from '../../components/LucideIcons.component';
import {DefaultColor} from '../../styles/default-color.style';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch} from '../../redux/hooks.redux';
import {iscustomeractions} from '../../redux/iscustomer.redux';
import {usercontextactions} from '../../redux/usercontext.redux';
import {AdminService} from '../../services/admin.service';
import {AdminOrganisationLocation} from '../../models/admin.model';
import {AppAlert} from '../../components/appalert.component';

export function OrganisationScreen() {
  const colors = DefaultColor.instance;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [locations, setLocations] = useState<AdminOrganisationLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<AdminOrganisationLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<FilterOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  type FilterOption = {
    id: string;
    label: string;
    type: 'verified' | 'notVerified' | 'deleted';
  };
  
  const filterOptions: FilterOption[] = [
    {id: 'verified', label: 'Verified', type: 'verified'},
    {id: 'notVerified', label: 'Not Verified', type: 'notVerified'},
    {id: 'deleted', label: 'Deleted', type: 'deleted'},
  ];
  
  const adminService = useMemo(() => new AdminService(), []);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    let filtered = locations;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(loc => 
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.organisationname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.addressline1?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(loc => {
        // Check if location matches any selected filter (OR logic - show if matches any)
        const hasVerified = selectedFilters.some(f => f.type === 'verified');
        const hasNotVerified = selectedFilters.some(f => f.type === 'notVerified');
        const hasDeleted = selectedFilters.some(f => f.type === 'deleted');
        
        // If verified filter is selected and location is verified, include it
        if (hasVerified && loc.isverified) return true;
        // If not verified filter is selected and location is not verified, include it
        if (hasNotVerified && !loc.isverified) return true;
        // If deleted filter is selected and location is deleted, include it
        if (hasDeleted && !loc.isactive) return true;
        
        // If no filters match, exclude it
        return false;
      });
    }
    
    setFilteredLocations(filtered);
  }, [searchQuery, locations, selectedFilters]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.GetAllOrganisationLocations();
      console.log('Fetched locations:', JSON.stringify(result?.slice(0, 2), null, 2));
      if (result && result.length > 0) {
        console.log('First location isactive:', result[0].isactive, 'isverified:', result[0].isverified);
        console.log('First location keys:', Object.keys(result[0]));
      }
      setLocations(result || []);
      setFilteredLocations(result || []);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      const message = error?.response?.data?.message || 'Failed to fetch organization locations';
      AppAlert({message});
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  const handleToggleVerification = async (locationId: number, currentVerified: boolean) => {
    // Show confirmation alert for both verify and unverify
    if (currentVerified) {
      // Unverify - show confirmation
      Alert.alert(
        'Unverify Location',
        'Are you sure you want to unverify this location?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unverify',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminService.ToggleLocationVerification(locationId, false);
                fetchLocations();
                AppAlert({message: 'Location unverified successfully'});
              } catch (error: any) {
                const message = error?.response?.data?.message || 'Failed to update verification status';
                AppAlert({message});
              }
            },
          },
        ]
      );
    } else {
      // Verify - show confirmation
      Alert.alert(
        'Verify Location',
        'Are you sure you want to verify this location?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Verify',
            onPress: async () => {
              try {
                await adminService.ToggleLocationVerification(locationId, true);
                fetchLocations();
                AppAlert({message: 'Location verified successfully'});
              } catch (error: any) {
                const message = error?.response?.data?.message || 'Failed to update verification status';
                AppAlert({message});
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.DeleteLocation(locationId);
              // Refresh the list to show updated status
              fetchLocations();
              AppAlert({message: 'Location deleted successfully'});
            } catch (error: any) {
              const message = error?.response?.data?.message || 'Failed to delete location';
              AppAlert({message});
            }
          },
        },
      ]
    );
  };

  const handleActivateLocation = async (locationId: number) => {
    Alert.alert(
      'Activate Location',
      'Are you sure you want to activate this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              await adminService.ActivateLocation(locationId);
              // Refresh the list to show updated status
              fetchLocations();
              AppAlert({message: 'Location activated successfully'});
            } catch (error: any) {
              const message = error?.response?.data?.message || 'Failed to activate location';
              AppAlert({message});
            }
          },
        },
      ]
    );
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

  const renderLocationItem = ({item, index}: {item: AdminOrganisationLocation; index: number}) => {
    const statusColor = item.isactive 
      ? (item.isverified ? colors.success : colors.tint_4)
      : colors.danger;
    
    // Organisation name color logic: red if inactive, green if verified, else grey
    const organisationNameColor = !item.isactive 
      ? colors.danger 
      : (item.isverified ? colors.success : colors.tint_4);
    
    const addressParts = [
      item.addressline1,
      item.addressline2,
      item.city,
      item.state,
      item.country,
      item.pincode
    ].filter(part => part && part.trim() !== '');
    const fullAddress = addressParts.join(', ');
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          {
            width: '100%',
            backgroundColor: colors.white,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.tint_5,
            borderLeftWidth: 4,
            borderLeftColor: statusColor,
          },
        ]}>
            {/* Content */}
            <AppView style={[$.flex_row, $.justify_content_space_between, $.align_items_flex_start]}>
              <AppView style={{flex: 1, marginRight: 12}}>
                {/* Details Icon Button */}
                <TouchableOpacity
                  onPress={() => {
                    (navigation as any).navigate('LocationDetails', {locationId: item.id});
                  }}
                  activeOpacity={0.7}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 10,
                    padding: 6,
                    borderRadius: 6,
                    backgroundColor: colors.tint_6,
                    borderWidth: 1,
                    borderColor: colors.tint_5,
                  }}>
                  <LucideIcon name={LucideIcons.ChevronRight} size={14} color={colors.tint_1} />
                </TouchableOpacity>
                {/* Organization Name as Header */}
                {item.organisationname && (
                  <AppText 
                    style={[
                      $.fs_medium, 
                      $.fw_bold, 
                      {color: organisationNameColor, marginBottom: 4, lineHeight: 18, fontSize: 14}
                    ]}
                    numberOfLines={2}>
                    {item.organisationname}
                  </AppText>
                )}
                
                {/* Organization Mobile Number */}
                {item.organisationmobile && (
                  <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 4}]}>
                    <LucideIcon
                      name={LucideIcons.Phone}
                      size={12}
                      color={colors.tint_4}
                      style={{marginRight: 4}}
                    />
                    <AppText style={[$.fs_small, {color: colors.tint_3, fontWeight: '500', fontSize: 11}]}>
                      {item.organisationmobile}
                    </AppText>
                  </AppView>
                )}
                
                {/* User Mobile Number */}
                {item.usermobile && (
                  <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 4}]}>
                    <LucideIcon
                      name={LucideIcons.Phone}
                      size={12}
                      color={colors.tint_4}
                      style={{marginRight: 4}}
                    />
                    <AppText style={[$.fs_small, {color: colors.tint_3, fontWeight: '500', fontSize: 11}]}>
                      {item.usermobile}
                    </AppText>
                  </AppView>
                )}
                
                {/* Location Name Below */}
                <AppText 
                  style={[
                    $.fs_small, 
                    {color: colors.warn, marginBottom: 6, lineHeight: 16, fontSize: 12, fontWeight: '600'}
                  ]}
                  numberOfLines={2}>
                  {item.name || 'Unnamed Location'}
                </AppText>
                
                {/* Address */}
                {fullAddress && (
                  <AppView style={[$.flex_row, $.align_items_flex_start, {marginTop: 2}]}>
                    <LucideIcon
                      name={LucideIcons.MapPin}
                      size={12}
                      color={colors.tint_4}
                      style={{marginRight: 4, marginTop: 2}}
                    />
                    <AppText 
                      style={[$.fs_small, {color: colors.tint_4, lineHeight: 16, flex: 1, fontSize: 11}]}
                      numberOfLines={2}>
                      {fullAddress}
                    </AppText>
                  </AppView>
                )}
              </AppView>
            </AppView>
            
            {/* Action Buttons */}
            <AppView style={[$.flex_row, $.align_items_center, {marginTop: 12, gap: 8}]}>
              {/* Verify/Unverify Button */}
              <TouchableOpacity
                onPress={() => handleToggleVerification(item.id, item.isverified)}
                activeOpacity={0.7}
                style={[
                  {
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: item.isverified
                      ? colors.tint_4 + '15'
                      : colors.success + '15',
                    borderWidth: 1,
                    borderColor: item.isverified
                      ? colors.tint_4 + '30'
                      : colors.success + '30',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  <LucideIcon
                    name={item.isverified ? LucideIcons.X : LucideIcons.Check}
                    size={12}
                    color={item.isverified ? colors.tint_4 : colors.success}
                    style={{marginRight: 4}}
                  />
                  <AppText
                    style={[
                      $.fs_small,
                      $.fw_medium,
                      {
                        color: item.isverified ? colors.tint_4 : colors.success,
                        fontSize: 11,
                      },
                    ]}>
                    {item.isverified ? 'Unverify' : 'Verify'}
                  </AppText>
                </AppView>
              </TouchableOpacity>

              {/* Activate Button (shown when inactive) */}
              {!item.isactive && (
                <TouchableOpacity
                  onPress={() => handleActivateLocation(item.id)}
                  activeOpacity={0.7}
                  style={[
                    {
                      flex: 1,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.success + '15',
                      borderWidth: 1,
                      borderColor: colors.success + '30',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <LucideIcon
                      name={LucideIcons.Check}
                      size={12}
                      color={colors.success}
                      style={{marginRight: 4}}
                    />
                    <AppText
                      style={[
                        $.fs_small,
                        $.fw_medium,
                        {
                          color: colors.success,
                          fontSize: 11,
                        },
                      ]}>
                      Activate
                    </AppText>
                  </AppView>
                </TouchableOpacity>
              )}

              {/* Delete Button (shown when active) */}
              {item.isactive && (
                <TouchableOpacity
                  onPress={() => handleDeleteLocation(item.id)}
                  activeOpacity={0.7}
                  style={[
                    {
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: colors.danger + '15',
                      borderWidth: 1,
                      borderColor: colors.danger + '30',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <LucideIcon
                      name={LucideIcons.Trash}
                      size={12}
                      color={colors.danger}
                      style={{marginRight: 4}}
                    />
                    <AppText
                      style={[
                        $.fs_small,
                        $.fw_medium,
                        {
                          color: colors.danger,
                          fontSize: 11,
                        },
                      ]}>
                      Delete
                    </AppText>
                  </AppView>
                </TouchableOpacity>
              )}
            </AppView>
            
            {/* Status Badges */}
            <AppView style={[$.flex_row, $.align_items_center, {marginTop: 12, flexWrap: 'wrap'}]}>
              {/* Active/Rejected Badge */}
              {!item.isactive && (
                <AppView
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: colors.danger + '15',
                      marginRight: 8,
                      marginBottom: 4,
                      borderWidth: 1,
                      borderColor: colors.danger + '30',
                    },
                  ]}>
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.danger,
                        marginRight: 6,
                      }}
                    />
                    <AppText
                      style={[
                        $.fs_small,
                        $.fw_medium,
                        {
                          color: colors.danger,
                          fontSize: 11,
                        },
                      ]}>
                      Rejected
                    </AppText>
                  </AppView>
                </AppView>
              )}
              
              {/* Verified/Not Verified Badge */}
              <AppView
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: item.isverified
                      ? colors.success + '15'
                      : colors.tint_4 + '15',
                    marginRight: 8,
                    marginBottom: 4,
                    borderWidth: 1,
                    borderColor: item.isverified
                      ? colors.success + '30'
                      : colors.tint_4 + '30',
                  },
                ]}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  {item.isverified ? (
                    <LucideIcon
                      name={LucideIcons.Check}
                      size={12}
                      color={colors.success}
                      style={{marginRight: 4}}
                    />
                  ) : (
                    <LucideIcon
                      name={LucideIcons.X}
                      size={12}
                      color={colors.tint_4}
                      style={{marginRight: 4}}
                    />
                  )}
                  <AppText 
                    style={[
                      $.fs_small, 
                      $.fw_medium, 
                      {
                        color: item.isverified ? colors.success : colors.tint_4,
                        fontSize: 11,
                      }
                    ]}>
                    {item.isverified ? 'Verified' : 'Not Verified'}
                  </AppText>
                </AppView>
              </AppView>
            </AppView>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return null;
    }
    return (
      <AppView style={[$.align_items_center, $.justify_content_center, $.p_large, {flex: 1, paddingVertical: 80}]}>
        <AppView
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.tint_6,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
          <LucideIcon
            name={LucideIcons.MapPin}
            size={56}
            color={colors.tint_4}
          />
        </AppView>
        <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_1, marginBottom: 8}]}>
          {searchQuery ? 'No Results Found' : 'No Locations'}
        </AppText>
        <AppText style={[$.fs_medium, {color: colors.tint_4, textAlign: 'center', lineHeight: 22, maxWidth: 280}]}>
          {searchQuery 
            ? `No locations match "${searchQuery}"`
            : 'There are no organization locations to display at the moment.'}
        </AppText>
      </AppView>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      {/* Header */}
      <AppView 
        style={[
          {
            backgroundColor: colors.white,
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
              Locations
            </AppText>
            <AppText style={[$.fs_small, {color: colors.tint_4, fontSize: 11}]}>
              {locations.length} {locations.length === 1 ? 'location' : 'locations'} registered
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
              style={{marginRight: 6}}
            />
            <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, fontSize: 11}]}>
              Logout
            </AppText>
          </TouchableOpacity>
        </AppView>
      </AppView>

      {/* Search Bar */}
      {locations.length > 0 && (
        <AppView style={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12}}>
          <AppView
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.white,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.05,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: colors.tint_5,
            }}>
            <LucideIcon
              name={LucideIcons.Search}
              size={20}
              color={colors.tint_4}
              style={{marginRight: 12}}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: 13,
                color: colors.tint_1,
                padding: 0,
              }}
              placeholder="Search locations..."
              placeholderTextColor={colors.tint_4}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={{padding: 4, marginRight: 8}}>
                <LucideIcon
                  name={LucideIcons.X}
                  size={18}
                  color={colors.tint_4}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                padding: 4,
                borderLeftWidth: 1,
                borderLeftColor: colors.tint_5,
                paddingLeft: 12,
                marginLeft: searchQuery.length > 0 ? 0 : 8,
              }}>
              <LucideIcon
                name={LucideIcons.Filter}
                size={20}
                color={selectedFilters.length > 0 ? colors.tint_1 : colors.tint_4}
              />
            </TouchableOpacity>
          </AppView>
        </AppView>
      )}

      {/* Minimal Filter - Shown when filter icon is clicked */}
      {showFilters && (
        <AppView style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.tint_6}}>
          <AppView style={[$.flex_row, {flexWrap: 'wrap', gap: 8}]}>
            {filterOptions.map((option) => {
              const isSelected = selectedFilters.some(f => f.id === option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedFilters(selectedFilters.filter(f => f.id !== option.id));
                    } else {
                      setSelectedFilters([...selectedFilters, option]);
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: isSelected ? colors.tint_1 : colors.tint_7,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.tint_1 : colors.tint_5,
                    marginRight: 6,
                    marginBottom: 6,
                  }}>
                  <AppText style={[$.fs_small, {color: isSelected ? colors.tint_11 : colors.tint_3, fontWeight: '500', fontSize: 11}]}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
            {selectedFilters.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedFilters([])}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  backgroundColor: colors.tint_7,
                  borderWidth: 1,
                  borderColor: colors.tint_5,
                  marginBottom: 6,
                }}>
                <AppText style={[$.fs_small, {color: colors.tint_4, fontWeight: '500', fontSize: 11}]}>
                  Clear
                </AppText>
              </TouchableOpacity>
            )}
          </AppView>
        </AppView>
      )}

      {/* Content Area */}
      <AppView style={[$.flex_1, {backgroundColor: colors.white}]}>
        {isLoading && locations.length === 0 ? (
          <AppView style={[$.flex_1, $.align_items_center, $.justify_content_center]}>
            <ActivityIndicator size="large" color={colors.tint_1} />
            <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 16}]}>
              Loading locations...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={filteredLocations}
            renderItem={renderLocationItem}
              keyExtractor={(item, index) => `loc-${item.id}-${index}`}
            contentContainerStyle={[
              filteredLocations.length === 0 && {flex: 1},
            ]}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.tint_1]}
                tintColor={colors.tint_1}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </AppView>
    </SafeAreaView>
  );
}