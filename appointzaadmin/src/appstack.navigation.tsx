import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeTabNavigation} from './hometab.navigation';
import {LaunchScreen} from './screens/launch/launch.screen';
import {$} from './styles';
import {LoginScreen} from './screens/login/login.screen';
import {HeaderTitle} from './components/headertitle.component';
import {OrganisationScreen} from './screens/organisation/organisation.screen';
import {DashboardScreen} from './screens/dashboard/dashboard.screen';
import {ReferenceScreen} from './screens/reference/reference.screen';
import React, {createRef} from 'react';
import { useAppSelector } from './redux/hooks.redux';
import { selectTheme } from './redux/theme.redux';
import { DefaultColor } from './styles/default-color.style';
import { ServiceAvailableScreen } from './screens/servicesavailable/service.screen';
import { TimingScreen } from './screens/timing/timing.screen';
import { AppoinmentBookingScreen } from './screens/appoinmentfixing/appoinmentbooking.screen';
import { AppointmentTimelineScreen } from './screens/appointmentimeline/appointmenttimeline.screen';
import { LucideIcon, LucideIcons } from './components/LucideIcons.component';
import { OTPVerificationScreen } from './screens/otpverification/otpverification.screen';
import { LocationDetailsScreen } from './screens/locationdetails/locationdetails.screen';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export type AppStackParamList = {
  Launch: undefined;
  HomeTab: undefined;
  Login: undefined;
  Organisation: undefined;
  Dashboard: undefined;
  Reference: undefined;
  LocationDetails: {
    locationId: number;
  };
  OTPVerification: {
    mobileNumber: string;
    fromSignup: boolean;
  };
};
const colors = DefaultColor.instance.colors;
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.tint_11,
    primary: colors.tint_1,
  },
};
export const navigationRef =
  createRef<NavigationContainerRef<AppStackParamList>>();

export function navigate(name: any, params?: any) {
  navigationRef.current?.navigate(name, params);
}

function AppStackNavigation() {
  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <AppStack.Navigator
        initialRouteName="Launch"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.tint_11,
          },
          headerTitleAlign: 'center',
          headerTitle: ({children}) => <HeaderTitle>{children}</HeaderTitle>,
          headerLeft: () => (
            <LucideIcon 
              name={LucideIcons.ChevronLeft} 
              size={24} 
              color={colors.tint_1}
            />
          ),
        }}>
        <AppStack.Screen
          name="Launch"
          component={LaunchScreen}
          options={{
            headerShown: false,
          }}
        />
            <AppStack.Screen
          name="HomeTab"
          component={HomeTabNavigation}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Organisation"
          component={OrganisationScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="Reference"
          component={ReferenceScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen 
          name="OTPVerification" 
          component={OTPVerificationScreen}
          options={{
            headerShown: false,
          }}
        />
        <AppStack.Screen
          name="LocationDetails"
          component={LocationDetailsScreen}
          options={{
            headerShown: false,
          }}
        />
  
      </AppStack.Navigator>
    </NavigationContainer>
  );
}

export {AppStackNavigation};
