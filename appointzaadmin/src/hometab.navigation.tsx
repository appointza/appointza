import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {$} from './styles';
import {AppView} from './components/appview.component';
import {TouchableOpacity} from 'react-native';
import {DashboardScreen} from './screens/dashboard/dashboard.screen';
import {ReferenceScreen} from './screens/reference/reference.screen';
import {OrganisationScreen} from './screens/organisation/organisation.screen';
import { LucideIcon, LucideIcons } from './components/LucideIcons.component';
import { DefaultColor } from './styles/default-color.style';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type HomeTabParamList = {
  Dashboard: undefined;
  Reference: undefined;
  Organisation: undefined;
};

const HomeTab = createBottomTabNavigator<HomeTabParamList>();
const colors = DefaultColor.instance;

function HomeTabNavigation() {
  const insets = useSafeAreaInsets();
  
  return (
    <HomeTab.Navigator
      tabBar={({state, descriptors, navigation}) => {
        return (
          <AppView style={[$.flex_row, {
            minHeight: 60,
            paddingBottom: Math.max(insets.bottom, 0),
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.tint_5
          }]}>
            {state.routes.map((route, index) => {
              const {options} = descriptors[route.key];
              const isFocused = state.index === index;
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <TouchableOpacity
                  key={index}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[$.flex_1, $.p_compact, $.align_items_center, $.justify_content_center]}>
                  {options.tabBarIcon &&
                    options.tabBarIcon({
                      focused: isFocused,
                      color: '',
                      size: 0,
                    })}
                </TouchableOpacity>
              );
            })}
          </AppView>
        );
      }}
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}>
      
      <HomeTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={LucideIcons.BarChart2} />
          ),
        }}
      />
      
      <HomeTab.Screen
        name="Reference"
        component={ReferenceScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={LucideIcons.BookOpen} />
          ),
        }}
      />
      
      <HomeTab.Screen
        name="Organisation"
        component={OrganisationScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} icon={LucideIcons.Building} />
          ),
        }}
      />
    </HomeTab.Navigator>
  );
}

const TabBarIcon = (props: {focused: boolean; icon: LucideIcons}) => {
  return (
    <AppView style={[$.align_items_center, $.justify_content_center]}>
      <LucideIcon
        name={props.icon}
        color={props.focused ? colors.tint_1 : colors.tint_3}
        size={24}
        stroke={2}
      />
    </AppView>
  );
};
export {HomeTabNavigation};
