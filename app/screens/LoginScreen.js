// app/screens/LoginScreen.js
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry />
      <Button title="Login" onPress={() => alert('Logged in!')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  heading: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20,
  },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5,
  },
});
