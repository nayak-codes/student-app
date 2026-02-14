import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    GestureHandlerRootView,
    PinchGestureHandler,
    State,
    TapGestureHandler
} from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const ZoomableImage = ({ uri }: { uri: string }) => {
    // Standard Animated Value
    const scale = useRef(new Animated.Value(1)).current;

    // Track internal scale state without relying on _value
    const lastScale = useRef(1);

    const onPinchGestureEvent = Animated.event(
        [{ nativeEvent: { scale: scale } }],
        { useNativeDriver: true }
    );

    const onPinchHandlerStateChange = (event: any) => {
        if (event.nativeEvent.state === State.END) {
            const currentScale = event.nativeEvent.scale;
            // Calculate target
            let target = 1;

            // If user pinched out significantly, snap to 2x (or roughly what they pinched to if we supported free zoom)
            // Simulating Instagram behavior: Snap to 1x or remain zoomed (modeled as 2x for simplicity here)
            if (currentScale > 1.2) {
                target = 2;
            } else {
                target = 1;
            }

            lastScale.current = target;

            Animated.spring(scale, {
                toValue: target, // Note: This assumes scale is relative to 1. 
                // Since Animated.event drove 'scale' directly from 1 -> n during pinch,
                // we just animate it to the target.
                useNativeDriver: true,
                friction: 7,
                tension: 40
            }).start();
        }
    };

    const doubleTapRef = useRef(null);
    const onDoubleTap = () => {
        const target = lastScale.current > 1.1 ? 1 : 2;
        lastScale.current = target;
        Animated.spring(scale, {
            toValue: target,
            useNativeDriver: true,
            friction: 7,
            tension: 40
        }).start();
    };

    return (
        <TapGestureHandler
            ref={doubleTapRef}
            numberOfTaps={2}
            onActivated={onDoubleTap}
        >
            <Animated.View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                <PinchGestureHandler
                    onGestureEvent={onPinchGestureEvent}
                    onHandlerStateChange={onPinchHandlerStateChange}
                >
                    <Animated.View style={{ width, height }}>
                        <Animated.Image
                            source={{ uri }}
                            style={{
                                width: '100%',
                                height: '100%',
                                resizeMode: 'contain',
                                transform: [{ scale: scale }]
                            }}
                        />
                    </Animated.View>
                </PinchGestureHandler>
            </Animated.View>
        </TapGestureHandler>
    );
};

export default function ImageViewerScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const parseImages = (param: string | string[]): string[] => {
        if (!param) return [];

        // If it's already an array (from expo-router parsing), use it
        if (Array.isArray(param)) return param;

        // If it's a string, check if it's a JSON array
        if (typeof param === 'string') {
            const trimmed = param.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    // If parse fails, assume it's a single weird URL or just treat as is
                    return [param];
                }
            } else {
                // Regular string URL (e.g. from chat screen)
                return [param];
            }
        }

        return [];
    };

    const images: string[] = parseImages(params.images as string | string[]);
    const initialIndex = params.index ? parseInt(params.index as string, 10) : 0;

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    React.useEffect(() => {
        if (flatListRef.current && images.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
            }, 100);
        }
    }, [initialIndex, images.length]);

    const handleMomentumScrollEnd = (event: any) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(newIndex);
    };

    if (images.length === 0) return null;

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" hidden={true} />

            <FlatList
                ref={flatListRef}
                data={images}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                renderItem={({ item }) => (
                    <View style={styles.imageContainer}>
                        <ZoomableImage uri={item} />
                    </View>
                )}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={3}
            />

            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.counter}>
                    {currentIndex + 1} / {images.length}
                </Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    imageContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        zIndex: 100,
    },
    closeButton: {
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    counter: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    }
});
