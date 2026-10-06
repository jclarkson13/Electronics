# DIY Electronics Bench App

A small Expo (React Native) app for hobby electronics. Runs on Android and iOS through Expo Go.

## Features

- **My parts**: inventory with type, value or part number, quantity and storage location. Search, quantity +/- buttons, low-stock flags. Saved on the device.
- **Resistor bands**: 4 and 5 band color code decoder
- **Capacitor code**: decodes codes like 104K
- **LED resistor**: resistor value for a given supply, LED voltage and current
- **Voltage divider**
- **Ohm's law**: enter any two of V, I, R, P
- **RC timing**: time constant and cutoff frequency

In number fields you can use suffixes such as `4.7k`, `100u`, `20m`.

## Run it

1. Create a blank Expo project:
   `npx create-expo-app bench --template blank`
2. Copy `App.js` and `Inventory.js` from this repo into the new `bench` folder, replacing the existing `App.js`.
3. Inside `bench`, install the storage package:
   `npx expo install @react-native-async-storage/async-storage`
4. Start it:
   `npx expo start`
5. Scan the QR code with Expo Go on your phone (same Wi-Fi as your computer).

### Windows PowerShell notes

- If scripts are blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- PowerShell treats `@` specially. If the install command fails, run it in Command Prompt instead.

## Files

- `App.js`: app shell and the calculators
- `Inventory.js`: parts inventory screen
