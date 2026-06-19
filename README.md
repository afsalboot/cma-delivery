This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Android app

The Android project uses Capacitor and loads the production app from
`https://cma-delivery.vercel.app`. The package ID is `com.cma.delivery`.

Create and install a debug APK:

```powershell
npm run android:debug
```

The APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For a signed Play Store bundle, copy
`android/keystore.properties.example` to `android/keystore.properties` and
replace the placeholder alias and passwords. The keystore properties file and
all `.jks` files are ignored by Git.

```powershell
npm run android:release
```

The signed bundle is written to:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
