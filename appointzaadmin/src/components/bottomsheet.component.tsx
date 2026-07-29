import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { AppView } from './appview.component';
import { AppText } from './apptext.component';
import { $ } from '../styles';
import { DefaultColor } from '../styles/default-color.style';
import { Button } from './button.component';

type BottomSheetProps = {
    children: React.ReactNode;
    Buttonname?: string,
    screenname: string
    Save?: () => void;
    close: () => void;
    showbutton?: boolean;
}

export const BottomSheetComponent = forwardRef<any, BottomSheetProps>((props, ref) => {
    const bottomSheetRef = useRef<any>(null);
    const colors = DefaultColor.instance;
    
    React.useImperativeHandle(ref, () => ({
        open: () => bottomSheetRef.current?.open(),
        close: () => bottomSheetRef.current?.close(),
    }));
    
    const [showbutton, setShowbutton] = useState<boolean>(props?.showbutton ?? true);

    useEffect(() => {
        setShowbutton(props?.showbutton ?? true);
    }, []);

    const screenHeight = Dimensions.get('window').height;

    return (
        <AppView>
            {/* Bottom Sheet */}
            <RBSheet
                ref={bottomSheetRef}
                height={screenHeight * 0.6} // 60% of screen height
                openDuration={300} // Smooth animation
                closeOnPressMask={true}
                customStyles={{
                    wrapper: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    container: {
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        backgroundColor: colors.cardBackground,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -4,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 8,
                    },
                    draggableIcon: {
                        backgroundColor: colors.tint_5,
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        marginTop: 8,
                        marginBottom: 4,
                    }
                }}
            >
                <AppView style={styles.contentContainer}>
                    {/* Header Section */}
                    <AppView style={styles.headerContainer}>
                        <AppView style={styles.headerContent}>
                            <AppText style={[$.fw_bold, $.fs_large, {color: colors.tint_1, letterSpacing: 0.3}]}>
                                {props.screenname}
                            </AppText>
                        </AppView>
                    </AppView>

                    {/* Content Section */}
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}>
                        {props.children}
                    </ScrollView>

                    {/* Footer Section with Buttons */}
                    {showbutton && (
                        <AppView style={styles.footerContainer}>
                            <AppView style={styles.buttonContainer}>
                                <Button 
                                    title={'Cancel'} 
                                    variant='cancel' 
                                    style={[$.flex_1, $.mr_small, styles.button]}
                                    onPress={() => { props.close() }}
                                />
                                {props.Save && (
                                    <Button 
                                        title={'Save'} 
                                        variant='save' 
                                        style={[$.flex_1, styles.button]}
                                        textStyle={[$.text_tint_11]}
                                        onPress={() => { props.Save && props.Save() }}
                                    />
                                )}
                            </AppView>
                        </AppView>
                    )}
                </AppView>
            </RBSheet>
        </AppView>
    );
});

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerContainer: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: DefaultColor.instance.tint_6,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    footerContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: DefaultColor.instance.tint_6,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        minHeight: 48,
        borderRadius: 12,
    },
});
