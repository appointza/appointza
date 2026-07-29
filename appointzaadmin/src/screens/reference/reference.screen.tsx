import React, {useState, useEffect, useMemo, useRef} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {SafeAreaView, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl, Platform} from 'react-native';
import {LucideIcon, LucideIcons} from '../../components/LucideIcons.component';
import {DefaultColor} from '../../styles/default-color.style';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch} from '../../redux/hooks.redux';
import {iscustomeractions} from '../../redux/iscustomer.redux';
import {usercontextactions} from '../../redux/usercontext.redux';
import {ReferenceTypeService} from '../../services/referencetype.service';
import {ReferenceValueService} from '../../services/referencevalue.service';
import {ReferenceType, ReferenceTypeSelectReq} from '../../models/referencetype.model';
import {ReferenceValue, ReferenceValueSelectReq} from '../../models/referencevalue.model';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {AppTextInput, apptextinputvalidators} from '../../components/apptextinput.component';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';

type ReferenceTypeWithValues = ReferenceType & {
  values: ReferenceValue[];
  children?: ReferenceTypeWithValues[]; // Secondary Types (children)
};

export function ReferenceScreen() {
  const colors = DefaultColor.instance;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [referenceTypes, setReferenceTypes] = useState<ReferenceTypeWithValues[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [newValue, setNewValue] = useState<Partial<ReferenceValue>>({
    identifier: '',
    displaytext: '',
    description: '',
    notes: '',
    referencetypeid: 0,
    parentid: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentIdOptions, setParentIdOptions] = useState<ReferenceValue[]>([]);
  const [isLoadingParentOptions, setIsLoadingParentOptions] = useState(false);
  const [selectedParentValue, setSelectedParentValue] = useState<ReferenceValue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottomSheetRef = useRef<any>(null);
  
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  const listStats = useMemo(() => {
    let valueCount = 0;
    referenceTypes.forEach((t) => {
      valueCount += t.values?.length || 0;
      (t.children || []).forEach((c) => {
        valueCount += c.values?.length || 0;
      });
    });
    return {typeCount: referenceTypes.length, valueCount};
  }, [referenceTypes]);

  useEffect(() => {
    fetchReferenceData();
    fetchParentIdOptions();
  }, []);

  const fetchParentIdOptions = async () => {
    setIsLoadingParentOptions(true);
    try {
      const req = new ReferenceValueSelectReq();
      req.id = 0;
      req.parentid = 0;
      req.referencetypeid = 1; // Fetch values where referencetypeid is 1
      req.organisationid = 0;
      
      const values = await referenceValueService.select(req);
      setParentIdOptions(values || []);
    } catch (error: any) {
      console.error('Error fetching parent ID options:', error);
    } finally {
      setIsLoadingParentOptions(false);
    }
  };

  const fetchReferenceData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const req = new ReferenceTypeSelectReq();
      req.id = 0;
      req.referencetypeid = 0;
      req.identifier = '';

      const types = await referenceTypeService.select(req);
      
      // Fetch values for each reference type and organize hierarchically
      const typesWithValues = await Promise.all(
        (types || []).map(async (type) => {
          try {
            const valueReq = new ReferenceValueSelectReq();
            valueReq.id = 0;
            valueReq.parentid = 0;
            valueReq.referencetypeid = type.id;
            valueReq.organisationid = 0;
            
            const values = await referenceValueService.select(valueReq);
            return {
              ...type,
              values: values || [],
              children: [], // Will be populated below
            };
          } catch (valueError: any) {
            console.error(`Error fetching values for type ${type.id}:`, valueError);
            return {
              ...type,
              values: [],
              children: [],
            };
          }
        })
      );
      
      // Organize hierarchically: Primary Types (parentid = 0) and Secondary Types (parentid > 0)
      const primaryTypes: ReferenceTypeWithValues[] = [];
      const secondaryTypesMap = new Map<number, ReferenceTypeWithValues[]>();
      
      // Separate primary and secondary types
      typesWithValues.forEach((type) => {
        if (type.parentid === 0 || !type.parentid) {
          // This is a Primary Type
          primaryTypes.push(type);
        } else {
          // This is a Secondary Type - group by parentid
          const parentId = type.parentid;
          if (!secondaryTypesMap.has(parentId)) {
            secondaryTypesMap.set(parentId, []);
          }
          secondaryTypesMap.get(parentId)!.push(type);
        }
      });
      
      // Attach Secondary Types to their Primary Types
      primaryTypes.forEach((primaryType) => {
        const children = secondaryTypesMap.get(primaryType.id) || [];
        primaryType.children = children;
      });
      
      // Also include standalone Secondary Types (whose parent doesn't exist in the list)
      const standaloneSecondaryTypes: ReferenceTypeWithValues[] = [];
      secondaryTypesMap.forEach((children, parentId) => {
        const parentExists = primaryTypes.some((pt) => pt.id === parentId);
        if (!parentExists) {
          standaloneSecondaryTypes.push(...children);
        }
      });
      
      // Combine: Primary Types (with their children) + Standalone Secondary Types
      const organizedTypes = [...primaryTypes, ...standaloneSecondaryTypes];
      
      setReferenceTypes(organizedTypes);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'We could not load reference data. Check your connection and try again.';
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferenceData();
  };

  const handleRetryLoad = () => {
    setLoadError(null);
    fetchReferenceData();
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

  const handleAddValue = (typeId: number) => {
    setSelectedTypeId(typeId);
    setSelectedParentValue(null);
    setNewValue({
      identifier: '',
      displaytext: '',
      description: '',
      notes: '',
      referencetypeid: typeId,
      parentid: 0,
    });
    bottomSheetRef.current?.open();
  };

  const handleSaveValue = async () => {
    if (!newValue.displaytext || !newValue.displaytext.trim()) {
      Alert.alert('Validation Error', 'Display Text is required');
      return;
    }

    if (!newValue.identifier || !newValue.identifier.trim()) {
      Alert.alert('Validation Error', 'Identifier is required');
      return;
    }

    // Validate parentid when referencetypeid is 2
    if (newValue.referencetypeid === 2) {
      if (!selectedParentValue || !newValue.parentid || newValue.parentid <= 0) {
        Alert.alert('Validation Error', 'Parent ID is required when Reference Type ID is 2');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const valueToSave = new ReferenceValue();
      valueToSave.identifier = newValue.identifier || '';
      valueToSave.displaytext = newValue.displaytext || '';
      valueToSave.description = newValue.description || '';
      valueToSave.notes = newValue.notes || '';
      valueToSave.referencetypeid = newValue.referencetypeid || 0;
      valueToSave.langcode = '';
      valueToSave.organizationid = 0;
      // Set parentid only when referencetypeid is 2
      valueToSave.parentid = newValue.referencetypeid === 2 ? (newValue.parentid || 0) : 0;
      valueToSave.isactive = true;

      await referenceValueService.insert(valueToSave);
      
      bottomSheetRef.current?.close();
      AppAlert({title: 'Success', message: 'Reference value added successfully'});
      
      // Refresh data
      await fetchReferenceData();
    } catch (error: any) {
      console.error('Error adding reference value:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add reference value';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBottomSheet = () => {
    setSelectedTypeId(null);
    setSelectedParentValue(null);
    setNewValue({
      identifier: '',
      displaytext: '',
      description: '',
      notes: '',
      referencetypeid: 0,
      parentid: 0,
    });
    bottomSheetRef.current?.close();
  };

  const handleParentIdSelect = (value: ReferenceValue) => {
    setSelectedParentValue(value);
    setNewValue({...newValue, parentid: value.id});
  };

  const handleClearParentId = () => {
    setSelectedParentValue(null);
    setNewValue({...newValue, parentid: 0});
  };

  const cardShadow = {
    backgroundColor: colors.tint_7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.tint_5,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {elevation: 3},
      default: {},
    }),
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.tint_6}}>
      <AppView
        style={{
          backgroundColor: colors.tint_7,
          paddingTop: 14,
          paddingBottom: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.tint_5,
        }}>
        <AppView style={[$.flex_row, {justifyContent: 'space-between', alignItems: 'flex-start'}]}>
          <AppView style={{flex: 1, paddingRight: 12}}>
            <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_3, fontSize: 22, marginBottom: 4}]}>
              Reference data
            </AppText>
            <AppText style={[$.fs_small, {color: colors.tint_4, fontSize: 13, lineHeight: 18}]}>
              Browse types, values, and secondary types. Pull down to refresh.
            </AppText>
          </AppView>
          <AppView style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => onRefresh()}
              disabled={isLoading || refreshing}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.tint_6,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 9,
                borderWidth: 1,
                borderColor: colors.tint_5,
                opacity: isLoading || refreshing ? 0.5 : 1,
                marginRight: 8,
              }}>
              <LucideIcon name={LucideIcons.RefreshCw} size={18} color={colors.tint_1} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.tint_6,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.tint_5,
              }}>
              <LucideIcon name={LucideIcons.LogOut} size={16} color={colors.tint_1} />
              <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_3, fontSize: 12, marginLeft: 6}]}>
                Log out
              </AppText>
            </TouchableOpacity>
          </AppView>
        </AppView>
      </AppView>

      {loadError ? (
        <AppView
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            padding: 14,
            borderRadius: 12,
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
          }}>
          <AppText style={[$.fs_small, {color: colors.danger, fontWeight: '600', marginBottom: 6}]}>
            Something went wrong
          </AppText>
          <AppText style={[$.fs_small, {color: colors.tint_3, lineHeight: 20, marginBottom: 12}]}>
            {loadError}
          </AppText>
          <TouchableOpacity
            onPress={handleRetryLoad}
            activeOpacity={0.85}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: colors.tint_1,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 10,
            }}>
            <AppText style={[$.fs_small, {color: colors.tint_7, fontWeight: '700'}]}>Try again</AppText>
          </TouchableOpacity>
        </AppView>
      ) : null}

      <AppView style={[$.flex_1, {backgroundColor: colors.tint_6}]}>
        {isLoading && referenceTypes.length === 0 ? (
          <AppView style={[$.flex_1, $.align_items_center, $.justify_content_center, {paddingHorizontal: 32}]}>
            <ActivityIndicator size="large" color={colors.tint_1} />
            <AppText style={[$.fs_medium, {color: colors.tint_3, marginTop: 18, fontWeight: '600', textAlign: 'center'}]}>
              Loading reference data
            </AppText>
            <AppText style={[$.fs_small, {color: colors.tint_4, marginTop: 8, textAlign: 'center', lineHeight: 20}]}>
              Fetching types and values from the server…
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={referenceTypes}
            keyExtractor={(item, index) => `ref-type-${item.id}-${index}`}
            ListHeaderComponent={
              referenceTypes.length > 0 ? (
                <AppView style={{paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4}}>
                  <AppView style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center'}}>
                    <AppView
                      style={{
                        backgroundColor: colors.tint_1 + '18',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginRight: 8,
                        marginBottom: 4,
                      }}>
                      <AppText style={[$.fs_small, {color: colors.tint_1, fontWeight: '700'}]}>
                        {listStats.typeCount} type{listStats.typeCount === 1 ? '' : 's'}
                      </AppText>
                    </AppView>
                    <AppView
                      style={{
                        backgroundColor: colors.tint_2 + '18',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginBottom: 4,
                      }}>
                      <AppText style={[$.fs_small, {color: colors.tint_2, fontWeight: '700'}]}>
                        {listStats.valueCount} value{listStats.valueCount === 1 ? '' : 's'}
                      </AppText>
                    </AppView>
                  </AppView>
                  <AppText style={[$.fs_tiny, {color: colors.tint_4, marginTop: 8, fontSize: 12}]}>
                    Pull down anywhere on the list to refresh.
                  </AppText>
                </AppView>
              ) : null
            }
            renderItem={({item}) => (
              <AppView
                style={{
                  marginHorizontal: 16,
                  marginBottom: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  ...cardShadow,
                }}>
                {/* Reference Type Header */}
                <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 12}]}>
                  <AppView style={{flex: 1}}>
                    <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 4}]}>
                      {item.parentid > 0 ? (
                        <AppText style={[$.fs_tiny, {color: colors.tint_4, marginRight: 6, fontSize: 10}]}>
                          └─
                        </AppText>
                      ) : null}
                      <AppText style={[$.fs_medium, $.fw_bold, {color: item.isactive ? colors.tint_1 : colors.tint_4}]}>
                        {item.parentid > 0 ? 'Secondary Type: ' : 'Primary Type: '}
                        {item.displaytext || item.identifier}
                      </AppText>
                    </AppView>
                    {item.parentid > 0 && (
                      <AppText style={[$.fs_tiny, {color: colors.tint_4, fontSize: 10, marginLeft: 16}]}>
                        Parent ID: {item.parentid}
                      </AppText>
                    )}
                  </AppView>
                  <AppView
                    style={{
                      backgroundColor: item.isactive ? colors.success + '20' : colors.tint_6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: item.isactive ? colors.success : colors.tint_5,
                    }}>
                    <AppText style={[$.fs_tiny, {color: item.isactive ? colors.success : colors.tint_4, fontWeight: '500'}]}>
                      {item.isactive ? 'Active' : 'Inactive'}
                    </AppText>
                  </AppView>
                </AppView>

                {/* Secondary Types (Children) */}
                {item.children && item.children.length > 0 && (
                  <AppView style={{marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.warn + '40', marginBottom: 12}}>
                    <AppText style={[$.fs_small, $.fw_bold, {color: colors.warn, marginBottom: 8, marginTop: 4}]}>
                      Secondary Types ({item.children.length}):
                    </AppText>
                    {item.children.map((child, childIndex) => (
                      <AppView
                        key={`ref-child-${child.id}-${childIndex}`}
                        style={{
                          backgroundColor: colors.tint_6,
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: childIndex < item.children!.length - 1 ? 8 : 0,
                          borderWidth: 1,
                          borderColor: colors.tint_5,
                        }}>
                        <AppView style={[$.flex_row, $.align_items_center, {marginBottom: 8}]}>
                          <AppView style={{flex: 1}}>
                            <AppText style={[$.fs_small, $.fw_bold, {color: child.isactive ? colors.tint_1 : colors.tint_4, marginBottom: 4}]}>
                              {child.displaytext || child.identifier}
                            </AppText>
                            <AppText style={[$.fs_tiny, {color: colors.tint_4, fontSize: 10}]}>
                              ID: {child.id} | Identifier: {child.identifier}
                            </AppText>
                          </AppView>
                          <AppView
                            style={{
                              backgroundColor: child.isactive ? colors.success + '20' : colors.tint_6,
                              paddingHorizontal: 6,
                              paddingVertical: 3,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: child.isactive ? colors.success : colors.tint_5,
                            }}>
                            <AppText style={[$.fs_tiny, {color: child.isactive ? colors.success : colors.tint_4, fontSize: 9}]}>
                              {child.isactive ? 'Active' : 'Inactive'}
                            </AppText>
                          </AppView>
                        </AppView>
                        {/* Reference Values for Secondary Type */}
                        <AppView style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.tint_5}}>
                          <AppView style={[$.flex_row, {justifyContent: 'space-between'}, $.align_items_center, {marginBottom: 6}]}>
                            <AppText style={[$.fs_tiny, $.fw_bold, {color: colors.tint_3, fontSize: 10}]}>
                              Values ({child.values?.length || 0}):
                            </AppText>
                            <TouchableOpacity
                              onPress={() => handleAddValue(child.id)}
                              activeOpacity={0.7}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.tint_1,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                minHeight: 36,
                              }}>
                              <LucideIcon name={LucideIcons.Plus} size={14} color={colors.tint_7} />
                              <AppText style={[$.fs_small, {color: colors.tint_7, marginLeft: 6, fontWeight: '700'}]}>
                                Add value
                              </AppText>
                            </TouchableOpacity>
                          </AppView>
                        {child.values && child.values.length > 0 ? (
                          <AppView>
                            {child.values.map((value, valueIndex) => (
                              <AppView
                                key={`ref-value-${value.id}-${valueIndex}`}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingVertical: 6,
                                  paddingLeft: 8,
                                  borderLeftWidth: 1,
                                  borderLeftColor: colors.tint_5,
                                  marginBottom: valueIndex < child.values.length - 1 ? 4 : 0,
                                }}>
                                <AppView style={{flex: 1}}>
                                  <AppText style={[$.fs_tiny, $.fw_medium, {color: colors.tint_1, fontSize: 10}]}>
                                    {value.displaytext || value.identifier}
                                  </AppText>
                                </AppView>
                                <AppView
                                  style={{
                                    backgroundColor: value.isactive ? colors.success + '20' : colors.tint_6,
                                    paddingHorizontal: 4,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: value.isactive ? colors.success : colors.tint_5,
                                  }}>
                                  <AppText style={[$.fs_tiny, {color: value.isactive ? colors.success : colors.tint_4, fontSize: 9}]}>
                                    {value.isactive ? 'Active' : 'Off'}
                                  </AppText>
                                </AppView>
                              </AppView>
                            ))}
                          </AppView>
                        ) : null}
                        </AppView>
                      </AppView>
                    ))}
                  </AppView>
                )}

                {/* Reference Values */}
                <AppView style={{marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.tint_5}}>
                  <AppView style={[$.flex_row, {justifyContent: 'space-between'}, $.align_items_center, {marginBottom: 8, marginTop: 4}]}>
                    <AppText style={[$.fs_small, $.fw_bold, {color: colors.tint_3}]}>
                      Reference Values ({item.values?.length || 0}):
                    </AppText>
                    <TouchableOpacity
                      onPress={() => handleAddValue(item.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.tint_1,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 10,
                        minHeight: 40,
                      }}>
                      <LucideIcon name={LucideIcons.Plus} size={16} color={colors.tint_7} />
                      <AppText style={[$.fs_small, {color: colors.tint_7, marginLeft: 6, fontWeight: '700'}]}>
                        Add value
                      </AppText>
                    </TouchableOpacity>
                  </AppView>
                {item.values && item.values.length > 0 ? (
                  <AppView>
                    {item.values.map((value, valueIndex) => (
                      <AppView
                        key={`ref-value-${value.id}-${valueIndex}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          borderBottomWidth: valueIndex < item.values.length - 1 ? 1 : 0,
                          borderBottomColor: colors.tint_6,
                        }}>
                        <AppView style={{flex: 1}}>
                          <AppText style={[$.fs_small, $.fw_medium, {color: colors.tint_1, marginBottom: 2}]}>
                            {value.displaytext || value.identifier}
                          </AppText>
                          <AppText style={[$.fs_tiny, {color: colors.tint_4, fontSize: 10}]}>
                            ID: {value.id} | Identifier: {value.identifier}
                          </AppText>
                        </AppView>
                        <AppView
                          style={{
                            backgroundColor: value.isactive ? colors.success + '20' : colors.tint_6,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: value.isactive ? colors.success : colors.tint_5,
                          }}>
                          <AppText style={[$.fs_tiny, {color: value.isactive ? colors.success : colors.tint_4, fontSize: 9}]}>
                            {value.isactive ? 'Active' : 'Inactive'}
                          </AppText>
                        </AppView>
                      </AppView>
                    ))}
                  </AppView>
                ) : (
                  <AppView style={{paddingVertical: 8}}>
                    <AppText style={[$.fs_small, {color: colors.tint_4, fontStyle: 'italic'}]}>
                      No values available
                    </AppText>
                  </AppView>
                )}
                </AppView>
              </AppView>
            )}
            contentContainerStyle={[
              referenceTypes.length === 0 && {flexGrow: 1},
              {paddingBottom: 32},
            ]}
            ListEmptyComponent={
              loadError ? (
                <AppView style={{minHeight: 24}} />
              ) : (
                <AppView
                  style={[
                    $.flex_1,
                    $.align_items_center,
                    $.justify_content_center,
                    {paddingHorizontal: 28, paddingVertical: 40},
                  ]}>
                  <AppView
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: colors.tint_6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: colors.tint_5,
                    }}>
                    <LucideIcon name={LucideIcons.BookOpen} size={40} color={colors.tint_1} />
                  </AppView>
                  <AppText style={[$.fs_large, $.fw_bold, {color: colors.tint_3, marginBottom: 10, textAlign: 'center'}]}>
                    Nothing here yet
                  </AppText>
                  <AppText
                    style={[
                      $.fs_medium,
                      {color: colors.tint_4, textAlign: 'center', lineHeight: 22, marginBottom: 22},
                    ]}>
                    There are no reference types to show. Pull down to refresh or try again if you expected data.
                  </AppText>
                  <TouchableOpacity
                    onPress={handleRetryLoad}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: colors.tint_1,
                      paddingHorizontal: 22,
                      paddingVertical: 12,
                      borderRadius: 12,
                    }}>
                    <AppText style={[$.fs_medium, {color: colors.tint_7, fontWeight: '700'}]}>Reload</AppText>
                  </TouchableOpacity>
                </AppView>
              )
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.tint_1]}
                tintColor={colors.tint_1}
              />
            }
          />
        )}
      </AppView>

      {/* Bottom Sheet for Adding Value */}
      <BottomSheetComponent
        ref={bottomSheetRef}
        screenname="Add Reference Value"
        Save={handleSaveValue}
        close={handleCloseBottomSheet}
        showbutton={true}>
        <AppView style={{paddingVertical: 8}}>
          <AppText style={[$.fs_small, {color: colors.tint_3, marginBottom: 6, fontWeight: '600'}]}>
            New value
          </AppText>
          <AppText style={[$.fs_small, {color: colors.tint_4, marginBottom: 18, lineHeight: 20}]}>
            Enter a short code (identifier) and the label users will see. Required fields are marked with *.
          </AppText>

          <AppView style={{marginBottom: 16}}>
            <AppTextInput
              placeholder="Identifier *"
              value={newValue.identifier}
              onChangeText={(text) => setNewValue({...newValue, identifier: text})}
              issubmitted={isSubmitting}
              validators={[apptextinputvalidators.required()]}
            />
          </AppView>

          <AppView style={{marginBottom: 16}}>
            <AppTextInput
              placeholder="Display Text *"
              value={newValue.displaytext}
              onChangeText={(text) => setNewValue({...newValue, displaytext: text})}
              issubmitted={isSubmitting}
              validators={[apptextinputvalidators.required()]}
            />
          </AppView>

          <AppView style={{marginBottom: 16}}>
            <AppTextInput
              placeholder="Description"
              value={newValue.description}
              onChangeText={(text) => setNewValue({...newValue, description: text})}
              issubmitted={isSubmitting}
            />
          </AppView>

          {/* Show parentid field only when referencetypeid is 2 */}
          {newValue.referencetypeid === 2 && (
            <AppView style={{marginBottom: 16}}>
              <AppSingleSelect<ReferenceValue>
                title="Parent ID *"
                data={parentIdOptions}
                selecteditem={selectedParentValue || undefined}
                onSelect={handleParentIdSelect}
                onClear={handleClearParentId}
                renderItemLabel={(item) => (
                  <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                    {item.displaytext || item.identifier}
                  </AppText>
                )}
                keyExtractor={(item) => item.id.toString()}
                searchKeyExtractor={(item) => `${item.displaytext || ''} ${item.identifier || ''}`}
                required={true}
                issubmitted={isSubmitting}
                isloading={isLoadingParentOptions}
                style={{marginBottom: 4}}
              />
              <AppText style={[$.fs_tiny, {color: colors.tint_4, marginTop: 4}]}>
                Select a reference value from Reference Type ID 1
        </AppText>
      </AppView>
          )}

          <AppView style={{marginBottom: 16}}>
            <AppTextInput
              placeholder="Notes"
              value={newValue.notes}
              onChangeText={(text) => setNewValue({...newValue, notes: text})}
              issubmitted={isSubmitting}
            />
          </AppView>
        </AppView>
      </BottomSheetComponent>
    </SafeAreaView>
  );
}
